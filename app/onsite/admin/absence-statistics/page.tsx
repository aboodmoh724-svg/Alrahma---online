import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  formatIstanbulDateEnglish,
  getIstanbulDateKey,
} from "@/lib/school-day";

type AbsenceSummary = {
  studentId: string;
  studentCode: string | null;
  studentName: string;
  parentWhatsapp: string | null;
  circleName: string;
  teacherName: string;
  absenceDates: string[];
  lastAbsenceAt: Date;
};

export default async function OnsiteAbsenceStatisticsPage() {
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
          <p className="font-black">لا تملك صلاحية عرض إحصائيات الغياب.</p>
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

  const absenceReports = await prisma.report.findMany({
    where: {
      status: "ABSENT",
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

  const summaries = new Map<string, AbsenceSummary & { dateKeys: Set<string> }>();

  for (const report of absenceReports) {
    const student = report.student;
    const summary =
      summaries.get(student.id) ||
      ({
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.fullName,
        parentWhatsapp: student.parentWhatsapp,
        circleName: student.circle?.name || "غير محددة",
        teacherName: student.teacher?.fullName || "غير محدد",
        absenceDates: [],
        dateKeys: new Set<string>(),
        lastAbsenceAt: report.createdAt,
      } satisfies AbsenceSummary & { dateKeys: Set<string> });

    const dateKey = getIstanbulDateKey(report.createdAt);
    if (!summary.dateKeys.has(dateKey)) {
      summary.dateKeys.add(dateKey);
      summary.absenceDates.push(formatIstanbulDateEnglish(report.createdAt));
    }

    if (report.createdAt > summary.lastAbsenceAt) {
      summary.lastAbsenceAt = report.createdAt;
    }

    summaries.set(student.id, summary);
  }

  const absenceSummaries = Array.from(summaries.values())
    .map((summary) => ({
      studentId: summary.studentId,
      studentCode: summary.studentCode,
      studentName: summary.studentName,
      parentWhatsapp: summary.parentWhatsapp,
      circleName: summary.circleName,
      teacherName: summary.teacherName,
      absenceDates: summary.absenceDates,
      lastAbsenceAt: summary.lastAbsenceAt,
    }))
    .sort((a, b) => {
      if (b.absenceDates.length !== a.absenceDates.length) {
        return b.absenceDates.length - a.absenceDates.length;
      }

      return b.lastAbsenceAt.getTime() - a.lastAbsenceAt.getTime();
    });

  const totalAbsenceDays = absenceSummaries.reduce(
    (sum, summary) => sum + summary.absenceDates.length,
    0
  );

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                إحصائيات الغياب
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                الطلاب الأكثر غيابا
              </h1>
              <p className="mt-4 text-sm leading-8 text-white/72">
                يظهر هنا كل طالب تم تسجيله غائبا، وعدد أيام الغياب وتواريخها.
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
            <p className="text-sm font-bold text-[#1c2d31]/55">طلاب لديهم غياب</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">
              {absenceSummaries.length}
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">إجمالي أيام الغياب</p>
            <p className="mt-2 text-4xl font-black text-[#c39a62]">
              {totalAbsenceDays}
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طريقة الحساب</p>
            <p className="mt-2 text-sm font-black leading-7 text-[#1f6358]">
              يحتسب غياب الطالب مرة واحدة لكل يوم بتوقيت تركيا.
            </p>
          </div>
        </section>

        <section className="rounded-[2.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          {absenceSummaries.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/55">
              لا توجد سجلات غياب حتى الآن.
            </div>
          ) : (
            <div className="grid gap-3">
              {absenceSummaries.map((summary) => (
                <div
                  key={summary.studentId}
                  className="rounded-[1.8rem] border border-[#d9c8ad]/75 bg-[#fffaf2] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-[#1c2d31]">
                          {summary.studentName}
                        </h2>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                          {summary.absenceDates.length} مرات
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm leading-7 text-[#1c2d31]/60 md:grid-cols-2">
                        <p>رقم الطالب: {summary.studentCode || "-"}</p>
                        <p>الحلقة: {summary.circleName}</p>
                        <p>المعلم: {summary.teacherName}</p>
                        <p>ولي الأمر: {summary.parentWhatsapp || "-"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#173d42] ring-1 ring-[#d9c8ad]">
                      آخر غياب: {formatIstanbulDateEnglish(summary.lastAbsenceAt)}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {summary.absenceDates.map((date) => (
                      <span
                        key={date}
                        className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1c2d31]/70 ring-1 ring-[#d9c8ad]"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
