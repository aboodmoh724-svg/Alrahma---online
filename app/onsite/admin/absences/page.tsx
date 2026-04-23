import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatIstanbulDateEnglish, getIstanbulDayRange } from "@/lib/school-day";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber as normalizeWhatsAppNumberShared,
  onsiteAbsenceWhatsAppMessage,
  sendWhatsAppText,
} from "@/lib/whatsapp";

function normalizeWhatsAppNumber(raw: string | null) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : "";
}

function absenceMessage(input: { studentName: string; reportDate: string }) {
  return `السلام عليكم ورحمة الله وبركاته

نفيدكم أن ابنكم الكريم / ${input.studentName}
غائب عن التحفيظ اليوم بتاريخ ${input.reportDate} بدون عذر.

نرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.

نشكر لكم حرصكم وتفهمكم.

🔸 هذه رسالة تلقائية ترسل للطلاب الغائبين.

إدارة تحفيظ الرحمن للقرآن الكريم - أفيون`;
}

function whatsAppUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function updateTodayAttendanceStatus(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  const reportId = String(formData.get("reportId") || "");
  const status = String(formData.get("status") || "");

  if (!adminId || !reportId || (status !== "PRESENT" && status !== "ABSENT")) {
    return;
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });

  if (!admin) return;

  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      student: {
        studyMode: "ONSITE",
        isActive: true,
      },
    },
    select: {
      id: true,
      studentId: true,
    },
  });

  if (!report) return;

  await prisma.report.update({
    where: { id: report.id },
    data: {
      status,
      lessonName: status === "ABSENT" ? "غياب" : "حضور",
      sentToParent: status === "PRESENT" ? false : undefined,
      parentSentAt: status === "PRESENT" ? null : undefined,
      parentSentChannel: status === "PRESENT" ? null : undefined,
      parentSentError: status === "PRESENT" ? null : undefined,
    },
  });

  revalidatePath("/onsite/admin/absences");
  revalidatePath("/onsite/admin/absence-statistics");
}

async function sendSelectedAbsenceWhatsApp(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  const reportIds = formData
    .getAll("reportId")
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!adminId || reportIds.length === 0 || !isWhatsAppConfigured()) {
    return;
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });

  if (!admin) return;

  const { start, end } = getIstanbulDayRange();
  const reports = await prisma.report.findMany({
    where: {
      id: { in: reportIds },
      status: "ABSENT",
      sentToParent: false,
      createdAt: {
        gte: start,
        lt: end,
      },
      student: {
        studyMode: "ONSITE",
        isActive: true,
      },
    },
    select: {
      id: true,
      student: {
        select: {
          fullName: true,
          parentWhatsapp: true,
        },
      },
    },
  });

  const reportDate = formatIstanbulDateEnglish(start);

  for (const report of reports) {
    const phone = report.student.parentWhatsapp
      ? normalizeWhatsAppNumberShared(report.student.parentWhatsapp)
      : null;

    if (!phone) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          parentSentError: "لا يوجد رقم واتساب صالح لولي الأمر",
        },
      });
      continue;
    }

    try {
      await sendWhatsAppText({
        to: phone,
        body: onsiteAbsenceWhatsAppMessage({
          studentName: report.student.fullName,
          reportDate,
        }),
      });

      await prisma.report.update({
        where: { id: report.id },
        data: {
          sentToParent: true,
          parentSentAt: new Date(),
          parentSentChannel: "WHATSAPP",
          parentSentError: null,
        },
      });
    } catch (error) {
      await prisma.report.update({
        where: { id: report.id },
        data: {
          sentToParent: false,
          parentSentAt: null,
          parentSentChannel: null,
          parentSentError:
            error instanceof Error ? error.message : "تعذر إرسال رسالة واتساب",
        },
      });
    }
  }

  revalidatePath("/onsite/admin/absences");
  revalidatePath("/onsite/admin/absence-statistics");
}

export default async function OnsiteAdminAbsencesPage() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;

  if (!adminId) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-black">الرجاء تسجيل الدخول أولا.</p>
          <Link
            href="/onsite/admin/login"
            className="mt-3 inline-flex rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });

  if (!admin) {
    return (
      <main className="rahma-shell min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-black">لا تملك صلاحية عرض غياب الحضوري.</p>
          <Link
            href="/onsite/admin/login"
            className="mt-3 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الدخول بحساب إدارة الحضوري
          </Link>
        </div>
      </main>
    );
  }

  const { start, end } = getIstanbulDayRange();
  const todayReports = await prisma.report.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
      student: {
        studyMode: "ONSITE",
        isActive: true,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      sentToParent: true,
      parentSentAt: true,
      lessonName: true,
      note: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          studentCode: true,
          fullName: true,
          parentWhatsapp: true,
          circle: {
            select: {
              name: true,
            },
          },
          teacher: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  const latestByStudent = new Map<string, (typeof todayReports)[number]>();
  for (const report of todayReports) {
    if (!latestByStudent.has(report.student.id)) {
      latestByStudent.set(report.student.id, report);
    }
  }

  const todayAttendance = Array.from(latestByStudent.values()).sort((a, b) =>
    a.student.fullName.localeCompare(b.student.fullName, "ar")
  );
  const absences = todayAttendance.filter(
    (report) => report.status === "ABSENT" && !report.sentToParent
  );
  const presentCount = todayAttendance.filter((report) => report.status === "PRESENT").length;
  const absentCount = todayAttendance.filter((report) => report.status === "ABSENT").length;
  const reportDate = formatIstanbulDateEnglish(start);
  const whatsappReady = isWhatsAppConfigured();

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                إدارة الغياب الحضوري
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                قائمة الطلاب الغائبين اليوم
              </h1>
              <p className="mt-4 text-sm leading-8 text-white/72">
                يضغط الإداري زر واتساب فتفتح رسالة جاهزة لولي الأمر من جهاز رقم التحفيظ.
              </p>
            </div>
            <Link
              href="/onsite/admin/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">تاريخ اليوم</p>
            <p className="mt-2 text-2xl font-black text-[#173d42]">{reportDate}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">عدد الغائبين</p>
            <p className="mt-2 text-4xl font-black text-[#c39a62]">{absences.length}</p>
            <p className="mt-1 text-xs font-bold text-[#1c2d31]/50">
              غير المرسل لهم فقط
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">آلية الإرسال</p>
            <p className="mt-2 text-sm font-black leading-7 text-[#1f6358]">
              رسالة جاهزة تفتح في واتساب، والإداري يضغط إرسال فقط.
            </p>
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">
                تعديل حضور وغياب اليوم
              </h2>
              <p className="mt-1 text-sm leading-7 text-[#1c2d31]/58">
                تعديل الحضور والغياب يتم من الإدارة فقط بعد تسجيل المعلم.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-black">
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-800">
                حضور: {presentCount}
              </span>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-amber-800">
                غياب: {absentCount}
              </span>
            </div>
          </div>

          {todayAttendance.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/55">
              لا توجد سجلات حضور أو غياب لهذا اليوم.
            </div>
          ) : (
            <div className="grid gap-3">
              {todayAttendance.map((report) => (
                <div
                  key={report.id}
                  className="grid gap-3 rounded-[1.6rem] border border-[#d9c8ad]/75 bg-[#fffaf2] p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-[#1c2d31]">
                        {report.student.fullName}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          report.status === "ABSENT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {report.status === "ABSENT" ? "غائب" : "حاضر"}
                      </span>
                      {report.sentToParent ? (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
                          تم إرسال الواتساب
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                      الحلقة: {report.student.circle?.name || "غير محددة"} - المعلم:{" "}
                      {report.student.teacher?.fullName || "غير محدد"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={updateTodayAttendanceStatus}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="PRESENT" />
                      <button
                        type="submit"
                        disabled={report.status === "PRESENT"}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        جعله حاضر
                      </button>
                    </form>
                    <form action={updateTodayAttendanceStatus}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="status" value="ABSENT" />
                      <button
                        type="submit"
                        disabled={report.status === "ABSENT"}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        جعله غائب
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          {absences.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/55">
              لا يوجد طلاب غائبون اليوم حسب آخر حالة مسجلة لكل طالب.
            </div>
          ) : (
            <form action={sendSelectedAbsenceWhatsApp} className="grid gap-3">
              <div className="flex flex-col gap-2 rounded-[1.5rem] bg-[#173d42] p-4 text-white md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black">إرسال واتساب للغياب المحدد</h2>
                  <p className="mt-1 text-sm text-white/70">
                    اختر الطلاب الغائبين فقط، ثم اضغط زر الإرسال مرة واحدة.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!whatsappReady}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2]"
                >
                  {whatsappReady ? "إرسال للطلاب المحددين" : "واتساب غير مفعّل"}
                </button>
              </div>
              {absences.map((report) => {
                const phone = normalizeWhatsAppNumber(report.student.parentWhatsapp);

                return (
                  <div
                    key={report.id}
                    className="grid gap-4 rounded-[1.8rem] border border-[#d9c8ad]/75 bg-[#fffaf2] p-4 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[#1c2d31]">
                          {report.student.fullName}
                        </p>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                          غائب
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm leading-7 text-[#1c2d31]/60 md:grid-cols-2">
                        <p>رقم الطالب: {report.student.studentCode || "-"}</p>
                        <p>الحلقة: {report.student.circle?.name || "غير محددة"}</p>
                        <p>المعلم: {report.student.teacher?.fullName || "غير محدد"}</p>
                        <p>
                          وقت التسجيل:{" "}
                          {report.createdAt.toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {report.note ? (
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/58">
                          ملاحظة: {report.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex min-w-56 flex-col gap-2">
                      {phone ? (
                        <label className="flex items-center justify-center gap-3 rounded-2xl bg-[#1f6358] px-5 py-3 text-center text-sm font-black text-white">
                          <input
                            type="checkbox"
                            name="reportId"
                            value={report.id}
                            defaultChecked
                            className="h-5 w-5"
                          />
                          تحديد للإرسال
                        </label>
                      ) : (
                        <div className="rounded-2xl bg-red-50 px-5 py-3 text-center text-sm font-black text-red-700 ring-1 ring-red-200">
                          لا يوجد رقم ولي أمر
                        </div>
                      )}
                      {phone ? (
                        <p className="text-center text-xs font-bold text-[#1c2d31]/50">
                          {phone}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
