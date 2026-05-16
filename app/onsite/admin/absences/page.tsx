import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatIstanbulDateEnglish, getIstanbulDayRange } from "@/lib/school-day";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppText,
} from "@/lib/whatsapp";

function onsiteAbsenceNotice(input: { studentName: string; reportDate: string }) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نود إبلاغكم أن ابنكم *${input.studentName}* تغيب اليوم عن حضور الحلقة بتاريخ ${input.reportDate}.\n\n` +
    `نرجو منكم الاهتمام بالحضور؛ لأن الغياب يؤثر على مستوى التعلم والمتابعة.\n\n` +
    `إدارة منصة الرحمة لتحفيظ القرآن الكريم`
  );
}

async function sendAbsenceReportWhatsApp(input: {
  reportId: string;
  reportDate: string;
}) {
  const report = await prisma.report.findFirst({
    where: {
      id: input.reportId,
      status: "ABSENT",
      student: {
        studyMode: "ONSITE",
        isActive: true,
      },
    },
    select: {
      id: true,
      sentToParent: true,
      student: {
        select: {
          fullName: true,
          parentWhatsapp: true,
        },
      },
    },
  });

  if (!report || report.sentToParent) {
    return;
  }

  const phone = normalizeWhatsAppNumber(report.student.parentWhatsapp || "");

  if (!phone) {
    await prisma.report.update({
      where: { id: report.id },
      data: {
        sentToParent: false,
        parentSentAt: null,
        parentSentChannel: null,
        parentSentError: "لا يوجد رقم واتساب صالح لولي الأمر",
      },
    });
    return;
  }

  try {
    await sendWhatsAppText({
      to: phone,
      body: onsiteAbsenceNotice({
        studentName: report.student.fullName,
        reportDate: input.reportDate,
      }),
      channel: "ONSITE",
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

async function sendTodayAbsenceWhatsApp() {
  "use server";

  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;

  if (!adminId || !isWhatsAppConfigured("ONSITE")) {
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
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          fullName: true,
          parentWhatsapp: true,
        },
      },
    },
  });

  const latestAbsenceByStudent = new Map<string, (typeof reports)[number]>();
  for (const report of reports) {
    if (!latestAbsenceByStudent.has(report.studentId)) {
      latestAbsenceByStudent.set(report.studentId, report);
    }
  }

  const reportDate = formatIstanbulDateEnglish(start);

  for (const report of latestAbsenceByStudent.values()) {
    await sendAbsenceReportWhatsApp({
      reportId: report.id,
      reportDate,
    });
  }

  revalidatePath("/onsite/admin/absences");
  revalidatePath("/onsite/admin/absence-statistics");
}

async function sendOneAbsenceWhatsApp(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  const reportId = String(formData.get("reportId") || "");

  if (!adminId || !reportId || !isWhatsAppConfigured("ONSITE")) {
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
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      status: "ABSENT",
      createdAt: {
        gte: start,
        lt: end,
      },
      student: {
        studyMode: "ONSITE",
        isActive: true,
      },
    },
    select: { id: true },
  });

  if (!report) return;

  await sendAbsenceReportWhatsApp({
    reportId: report.id,
    reportDate: formatIstanbulDateEnglish(start),
  });

  revalidatePath("/onsite/admin/absences");
  revalidatePath("/onsite/admin/absence-statistics");
}

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function OnsiteAdminAbsencesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchQuery = String(resolvedSearchParams.q || "").trim();
  const statusFilter = String(resolvedSearchParams.status || "ALL");

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
      parentSentError: true,
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
  const filteredAttendance = todayAttendance.filter((report) => {
    const haystack = [
      report.student.fullName,
      report.student.studentCode || "",
      report.student.circle?.name || "",
      report.student.teacher?.fullName || "",
      report.student.parentWhatsapp || "",
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchQuery
      ? haystack.includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus =
      statusFilter === "ABSENT"
        ? report.status === "ABSENT"
        : statusFilter === "PRESENT"
          ? report.status === "PRESENT"
          : statusFilter === "PENDING"
            ? report.status === "ABSENT" && !report.sentToParent
            : true;

    return matchesSearch && matchesStatus;
  });
  const absences = todayAttendance.filter((report) => report.status === "ABSENT");
  const pendingAbsences = absences.filter(
    (report) =>
      !report.sentToParent &&
      Boolean(normalizeWhatsAppNumber(report.student.parentWhatsapp || ""))
  );
  const presentCount = todayAttendance.filter((report) => report.status === "PRESENT").length;
  const absentCount = absences.length;
  const reportDate = formatIstanbulDateEnglish(start);
  const whatsappReady = isWhatsAppConfigured("ONSITE");

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                إدارة الغياب الحضوري
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                قائمة الطلاب الغائبين اليوم
              </h1>
              <p className="mt-4 text-sm leading-8 text-white/72">
                بعد اعتماد الغياب يضغط الإداري زرًا واحدًا فقط، فتُرسل رسائل الغياب لجميع الطلاب
                الغائبين عبر رقم الحضوري المرتبط بالنظام.
              </p>
            </div>
            <Link
              href="/onsite/admin/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">تاريخ اليوم</p>
            <p className="mt-2 text-2xl font-black text-[#0a3f2a]">{reportDate}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">عدد الغائبين</p>
            <p className="mt-2 text-4xl font-black text-[#bd8f2d]">{pendingAbsences.length}</p>
            <p className="mt-1 text-xs font-bold text-[#1c2d31]/50">بانتظار الإرسال فقط</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">آلية الإرسال</p>
            <p className="mt-2 text-sm font-black leading-7 text-[#0f5a35]">
              إرسال جماعي مباشر من واتساب الحضوري داخل النظام، دون فتح كل طالب بشكل منفصل.
            </p>
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">تعديل حضور وغياب اليوم</h2>
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

          <form className="mb-5 grid gap-3 rounded-[1.7rem] bg-[#fffaf4] p-3 ring-1 ring-[#eadcc4] md:grid-cols-[1fr_auto_auto] md:items-center">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="ابحث باسم الطالب أو الرقم أو الحلقة أو المعلم..."
              className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold text-[#1c2d31] outline-none focus:border-[#0f5a35]"
            />
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-black text-[#1c2d31] outline-none focus:border-[#0f5a35]"
            >
              <option value="ALL">كل الحالات</option>
              <option value="PRESENT">الحضور فقط</option>
              <option value="ABSENT">الغياب فقط</option>
              <option value="PENDING">غياب بانتظار الرسالة</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white md:flex-none"
              >
                عرض
              </button>
              <Link
                href="/onsite/admin/absences"
                className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-sm font-black text-[#1c2d31]"
              >
                مسح
              </Link>
            </div>
          </form>

          {todayAttendance.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d8bf83] p-8 text-center text-sm text-[#1c2d31]/55">
              لا توجد سجلات حضور أو غياب لهذا اليوم.
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d8bf83] p-8 text-center text-sm text-[#1c2d31]/55">
              لا توجد نتائج مطابقة للبحث أو الفلتر الحالي.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredAttendance.map((report) => (
                <div
                  key={report.id}
                  className="grid gap-3 rounded-[1.6rem] border border-[#d8bf83]/75 bg-[#fffaf4] p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-[#1c2d31]">{report.student.fullName}</p>
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
                          تم إرسال الرسالة
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

        <section className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
          {absences.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d8bf83] p-8 text-center text-sm text-[#1c2d31]/55">
              لا يوجد طلاب غائبون اليوم حسب آخر حالة مسجلة لكل طالب.
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="flex flex-col gap-3 rounded-[1.5rem] bg-[#0a3f2a] p-4 text-white md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black">غياب اليوم</h2>
                  <p className="mt-1 text-sm text-white/70">
                    بعد مراجعة القائمة اضغط الزر مرة واحدة لإرسال رسائل الغياب لجميع الطلاب
                    الغائبين الذين لم تُرسل لهم الرسالة بعد.
                  </p>
                </div>
                <form action={sendTodayAbsenceWhatsApp}>
                  <button
                    type="submit"
                    disabled={!whatsappReady || pendingAbsences.length === 0}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {!whatsappReady
                      ? "واتساب الحضوري غير مفعّل"
                      : pendingAbsences.length === 0
                        ? "لا يوجد غياب قابل للإرسال"
                        : "إرسال رسائل الغياب لجميع الغائبين"}
                  </button>
                </form>
              </div>

              {absences.map((report) => {
                const phone = normalizeWhatsAppNumber(report.student.parentWhatsapp || "");
                const statusLabel = report.sentToParent
                  ? "تم إرسال الرسالة"
                  : phone
                    ? "بانتظار الإرسال الجماعي"
                    : "لا يوجد رقم ولي أمر";
                const statusClass = report.sentToParent
                  ? "bg-sky-100 text-sky-800 ring-sky-200"
                  : phone
                    ? "bg-amber-100 text-amber-800 ring-amber-200"
                    : "bg-red-50 text-red-700 ring-red-200";

                return (
                  <div
                    key={report.id}
                    className="grid gap-4 rounded-[1.8rem] border border-[#d8bf83]/75 bg-[#fffaf4] p-4 md:grid-cols-[1fr_auto] md:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-[#1c2d31]">{report.student.fullName}</p>
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
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/58">ملاحظة: {report.note}</p>
                      ) : null}
                      {report.parentSentError ? (
                        <p className="mt-2 text-sm font-bold leading-7 text-red-700">
                          سبب التعذر: {report.parentSentError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex min-w-56 flex-col gap-2">
                      <div className={`rounded-2xl px-5 py-3 text-center text-sm font-black ring-1 ${statusClass}`}>
                        {statusLabel}
                      </div>
                      {phone ? (
                        <p className="text-center text-xs font-bold text-[#1c2d31]/50">{phone}</p>
                      ) : null}
                      <form action={sendOneAbsenceWhatsApp}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <button
                          type="submit"
                          disabled={
                            !whatsappReady || report.sentToParent || !phone
                          }
                          className="w-full rounded-2xl bg-[#0f5a35] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {!whatsappReady
                            ? "واتساب غير مفعّل"
                            : report.sentToParent
                              ? "تم الإرسال"
                              : phone
                                ? "إرسال لهذا الطالب"
                                : "لا يوجد رقم"}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
