import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    track?: string;
    circleId?: string;
  }>;
};

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function trackGroup(circle: { name: string; track: string | null }) {
  const value = `${circle.track || ""} ${circle.name}`.toLowerCase();
  if (
    value.includes("nour") ||
    value.includes("nur") ||
    value.includes("bayan") ||
    value.includes("نور") ||
    value.includes("بيان")
  ) {
    return "nour";
  }

  return "quran";
}

function trackTitle(track: string) {
  return track === "nour" ? "إشراف حلقات نور البيان" : "إشراف حلقات القرآن الكريم";
}

function memorizedLabel(value: boolean | null) {
  if (value === true) return "حافظ";
  if (value === false) return "غير حافظ";
  return "غير مسجل";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function OnsiteEducationSupervisionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const selectedTrack = params?.track === "nour" ? "nour" : "quran";
  const selectedCircleId = params?.circleId || "";
  const { start, end } = getTodayRange();

  const circles = await prisma.circle.findMany({
    where: {
      studyMode: "ONSITE",
    },
    orderBy: {
      name: "asc",
    },
    include: {
      teacher: {
        select: {
          fullName: true,
        },
      },
      students: {
        where: {
          isActive: true,
        },
        orderBy: {
          fullName: "asc",
        },
        include: {
          reports: {
            where: {
              createdAt: {
                gte: start,
                lt: end,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  const visibleCircles = circles.filter(
    (circle) => trackGroup(circle) === selectedTrack
  );
  const selectedCircle =
    visibleCircles.find((circle) => circle.id === selectedCircleId) || null;
  const studentIds = selectedCircle?.students.map((student) => student.id) || [];
  const reportCounts =
    studentIds.length > 0
      ? await prisma.report.groupBy({
          by: ["studentId"],
          where: {
            studentId: {
              in: studentIds,
            },
          },
          _count: {
            _all: true,
          },
        })
      : [];
  const countByStudent = new Map(
    reportCounts.map((item) => [item.studentId, item._count._all])
  );
  const selectedReportsCount = selectedCircle
    ? selectedCircle.students.reduce(
        (total, student) => total + (countByStudent.get(student.id) || 0),
        0
      )
    : 0;
  const todayCompleted = selectedCircle
    ? selectedCircle.students.filter((student) => student.reports.length > 0).length
    : 0;

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/onsite/admin/dashboard"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2]"
            >
              الرجوع للوحة الإدارة
            </Link>
            <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
              إشراف تعليمي حضوري
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
            متابعة التقارير وسير الطلاب حسب الحلقات.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
            تظهر هنا حالة إدخال تقارير اليوم لكل حلقة، ثم تفاصيل الطلاب داخل الحلقة
            لمراجعة الحضور، التسميع، المراجعة، وعدد التقارير.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {[
            { key: "quran", title: "إشراف حلقات القرآن الكريم" },
            { key: "nour", title: "إشراف حلقات نور البيان" },
          ].map((item) => (
            <Link
              key={item.key}
              href={`/onsite/admin/education-supervision?track=${item.key}`}
              className={`rounded-[1.8rem] p-5 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${
                selectedTrack === item.key
                  ? "bg-[#1f6358] text-white"
                  : "bg-white/88 text-[#173d42]"
              }`}
            >
              <h2 className="text-2xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 opacity-75">
                عرض الحلقات، حالة تقارير اليوم، وتفاصيل سير الطلاب.
              </p>
            </Link>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">
                {trackTitle(selectedTrack)}
              </h2>
              <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                اضغط على أي حلقة لعرض الطلاب والتقارير التفصيلية.
              </p>
            </div>
            <span className="rounded-full bg-[#173d42] px-4 py-2 text-sm font-black text-white">
              {visibleCircles.length} حلقة
            </span>
          </div>

          {visibleCircles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/55">
              لا توجد حلقات في هذا القسم حتى الآن.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCircles.map((circle) => {
                const studentsCount = circle.students.length;
                const completedCount = circle.students.filter(
                  (student) => student.reports.length > 0
                ).length;
                const isComplete = studentsCount > 0 && completedCount === studentsCount;

                return (
                  <Link
                    key={circle.id}
                    href={`/onsite/admin/education-supervision?track=${selectedTrack}&circleId=${circle.id}`}
                    className={`rounded-[1.8rem] p-5 ring-1 transition hover:-translate-y-0.5 ${
                      selectedCircle?.id === circle.id
                        ? "bg-[#173d42] text-white ring-[#173d42]"
                        : "bg-[#fffaf2] text-[#1c2d31] ring-[#eadcc6]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{circle.name}</h3>
                        <p className="mt-2 text-sm leading-7 opacity-70">
                          المعلم: {circle.teacher?.fullName || "لم يحدد"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {completedCount}/{studentsCount}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 opacity-75">
                      {isComplete
                        ? "تم إدخال تقارير طلاب الحلقة اليوم."
                        : "توجد تقارير لم تكتمل بعد اليوم."}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {selectedCircle ? (
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-[#173d42] p-4 text-white">
                <p className="text-sm text-white/70">الحلقة</p>
                <p className="mt-2 text-xl font-black">{selectedCircle.name}</p>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <p className="text-sm text-[#1c2d31]/55">المعلم</p>
                <p className="mt-2 text-xl font-black text-[#173d42]">
                  {selectedCircle.teacher?.fullName || "لم يحدد"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <p className="text-sm text-[#1c2d31]/55">تقارير اليوم</p>
                <p className="mt-2 text-xl font-black text-[#1f6358]">
                  {todayCompleted}/{selectedCircle.students.length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                <p className="text-sm text-[#1c2d31]/55">إجمالي التقارير</p>
                <p className="mt-2 text-xl font-black text-[#c39a62]">
                  {selectedReportsCount}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-2xl text-sm">
                <thead>
                  <tr className="bg-[#173d42] text-right text-white">
                    <th className="px-4 py-3 font-black">الطالب</th>
                    <th className="px-4 py-3 font-black">تقرير اليوم</th>
                    <th className="px-4 py-3 font-black">الدرس</th>
                    <th className="px-4 py-3 font-black">المراجعة</th>
                    <th className="px-4 py-3 font-black">الحالة</th>
                    <th className="px-4 py-3 font-black">عدد التقارير</th>
                    <th className="px-4 py-3 font-black">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCircle.students.map((student) => {
                    const report = student.reports[0] || null;

                    return (
                      <tr key={student.id} className="border-b border-[#eadcc6] bg-white">
                        <td className="px-4 py-3 font-black text-[#1c2d31]">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              report
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {report ? "تم الإدخال" : "لم يدخل"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          {report?.lessonName || "-"}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          {report?.review || "-"}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          {report
                            ? report.status === "ABSENT"
                              ? "غائب"
                              : memorizedLabel(report.lessonMemorized)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 font-black text-[#173d42]">
                          {countByStudent.get(student.id) || 0}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/60">
                          {report ? formatDate(report.createdAt) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
