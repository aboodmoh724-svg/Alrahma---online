import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    track?: string;
    circleId?: string;
    day?: string;
  }>;
};

type AttendanceDay = {
  key: "saturday" | "sunday";
  label: string;
  start: Date;
  end: Date;
};

function getLatestAttendanceWeekend(): AttendanceDay[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const day = now.getDay();
  const daysSinceSaturday = day === 6 ? 0 : day === 0 ? 1 : day + 1;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - daysSinceSaturday);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() + 2);

  return [
    { key: "saturday", label: "السبت", start: saturday, end: sunday },
    { key: "sunday", label: "الأحد", start: sunday, end: monday },
  ];
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
  return track === "nour"
    ? "إشراف حلقات نور البيان"
    : "إشراف حلقات القرآن الكريم";
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

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function OnsiteEducationSupervisionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const selectedTrack = params?.track === "nour" ? "nour" : "quran";
  const selectedCircleId = params?.circleId || "";
  const attendanceDays = getLatestAttendanceWeekend();
  const selectedDay =
    attendanceDays.find((day) => day.key === params?.day) || attendanceDays[0];
  const weekendStart = attendanceDays[0].start;
  const weekendEnd = attendanceDays[1].end;

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
                gte: weekendStart,
                lt: weekendEnd,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
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

  const selectedDayCompleted = selectedCircle
    ? selectedCircle.students.filter((student) =>
        student.reports.some(
          (report) =>
            report.createdAt >= selectedDay.start && report.createdAt < selectedDay.end
        )
      ).length
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
            متابعة السبت والأحد فقط.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
            التحفيظ الحضوري يكون يومي السبت والأحد، لذلك تعرض هذه الصفحة حالة
            إدخال التقارير لهذين اليومين فقط، مع تفاصيل الحلقة والطلاب عند فتحها.
          </p>
          <div className="mt-6 max-w-3xl rounded-[1.5rem] bg-white/10 p-5 ring-1 ring-white/15">
            <p className="text-lg font-black leading-9 text-white md:text-2xl">
              من شرف العمل القرآني أن تكون عينًا راعية لمسيرة طالب مع كتاب الله،
              فكل متابعة صادقة لبنة في بناء جيل يحمل القرآن خلقًا وعملاً.
            </p>
            <p className="mt-3 text-sm font-black text-[#f1d39d]">
              د.معاذ قدح
            </p>
          </div>
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
                حالة تقارير السبت والأحد حسب الحلقات.
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
                أسبوع المتابعة: السبت {formatShortDate(attendanceDays[0].start)} والأحد{" "}
                {formatShortDate(attendanceDays[1].start)}.
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
                const dayStats = attendanceDays.map((day) => {
                  const completed = circle.students.filter((student) =>
                    student.reports.some(
                      (report) =>
                        report.createdAt >= day.start && report.createdAt < day.end
                    )
                  ).length;

                  return { ...day, completed };
                });

                return (
                  <Link
                    key={circle.id}
                    href={`/onsite/admin/education-supervision?track=${selectedTrack}&circleId=${circle.id}&day=${selectedDay.key}`}
                    className={`rounded-[1.8rem] p-5 ring-1 transition hover:-translate-y-0.5 ${
                      selectedCircle?.id === circle.id
                        ? "bg-[#173d42] text-white ring-[#173d42]"
                        : "bg-[#fffaf2] text-[#1c2d31] ring-[#eadcc6]"
                    }`}
                  >
                    <h3 className="text-xl font-black">{circle.name}</h3>
                    <p className="mt-2 text-sm leading-7 opacity-70">
                      المعلم: {circle.teacher?.fullName || "لم يحدد"}
                    </p>
                    <div className="mt-4 grid gap-2">
                      {dayStats.map((day) => (
                        <div
                          key={day.key}
                          className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-[#1c2d31]"
                        >
                          <span className="text-sm font-black">{day.label}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              studentsCount > 0 && day.completed === studentsCount
                                ? "bg-emerald-100 text-emerald-800"
                                : day.completed > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {day.completed}/{studentsCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {selectedCircle ? (
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
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
                <p className="text-sm text-[#1c2d31]/55">
                  تقارير {selectedDay.label}
                </p>
                <p className="mt-2 text-xl font-black text-[#1f6358]">
                  {selectedDayCompleted}/{selectedCircle.students.length}
                </p>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {attendanceDays.map((day) => (
                <Link
                  key={day.key}
                  href={`/onsite/admin/education-supervision?track=${selectedTrack}&circleId=${selectedCircle.id}&day=${day.key}`}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    selectedDay.key === day.key
                      ? "bg-[#173d42] text-white"
                      : "bg-[#fffaf2] text-[#173d42] ring-1 ring-[#d9c8ad]"
                  }`}
                >
                  {day.label} {formatShortDate(day.start)}
                </Link>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-2xl text-sm">
                <thead>
                  <tr className="bg-[#173d42] text-right text-white">
                    <th className="px-4 py-3 font-black">الطالب</th>
                    <th className="px-4 py-3 font-black">تقرير {selectedDay.label}</th>
                    <th className="px-4 py-3 font-black">الدرس</th>
                    <th className="px-4 py-3 font-black">المراجعة</th>
                    <th className="px-4 py-3 font-black">الحالة</th>
                    <th className="px-4 py-3 font-black">الواجب القادم</th>
                    <th className="px-4 py-3 font-black">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCircle.students.map((student) => {
                    const report =
                      student.reports.find(
                        (item) =>
                          item.createdAt >= selectedDay.start &&
                          item.createdAt < selectedDay.end
                      ) || null;

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
                        <td className="min-w-64 px-4 py-3 text-[#1c2d31]/70">
                          {report?.nextHomework || "-"}
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
