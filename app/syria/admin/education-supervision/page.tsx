import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    circleId?: string;
    day?: string;
    view?: string;
    month?: string;
  }>;
};

type AttendanceDayKey = "friday" | "tuesday";

type AttendanceDay = {
  key: AttendanceDayKey;
  label: string;
  start: Date;
  end: Date;
};

type ReportLike = {
  id: string;
  status: string;
  lessonName: string;
  lessonSurah: string | null;
  lessonMemorized: boolean | null;
  lastFiveMemorized: boolean | null;
  review: string | null;
  reviewSurah: string | null;
  reviewMemorized: boolean | null;
  pageFrom: number | null;
  pageTo: number | null;
  pagesCount: number | null;
  nextHomework: string | null;
  note: string | null;
  sentToParent: boolean;
  parentSentAt: Date | null;
  parentSentError: string | null;
  createdAt: Date;
};

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

function shiftedToIstanbul(date: Date) {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MS);
}

function istanbulDayRangeFromShiftedDate(shiftedDate: Date) {
  const startUtcMs =
    Date.UTC(
      shiftedDate.getUTCFullYear(),
      shiftedDate.getUTCMonth(),
      shiftedDate.getUTCDate(),
      0,
      0,
      0,
      0
    ) - ISTANBUL_OFFSET_MS;

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000),
  };
}

function getLatestSyriaAttendanceDays(count = 4): AttendanceDay[] {
  const shiftedToday = shiftedToIstanbul(new Date());
  const days: AttendanceDay[] = [];

  for (let offset = 0; offset < 45 && days.length < count; offset += 1) {
    const shifted = new Date(shiftedToday);
    shifted.setUTCDate(shiftedToday.getUTCDate() - offset);
    const weekday = shifted.getUTCDay();

    if (weekday !== 5 && weekday !== 2) continue;

    const range = istanbulDayRangeFromShiftedDate(shifted);
    days.push({
      key: weekday === 5 ? "friday" : "tuesday",
      label: weekday === 5 ? "الجمعة" : "الثلاثاء",
      start: range.start,
      end: range.end,
    });
  }

  return days.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function getMonthRange(monthParam?: string) {
  const shiftedNow = shiftedToIstanbul(new Date());
  const match = monthParam?.match(/^(\d{4})-(\d{2})$/);
  const year = match ? Number(match[1]) : shiftedNow.getUTCFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : shiftedNow.getUTCMonth();
  const shiftedStart = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const shiftedEnd = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));

  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    start: new Date(shiftedStart.getTime() - ISTANBUL_OFFSET_MS),
    end: new Date(shiftedEnd.getTime() - ISTANBUL_OFFSET_MS),
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    month: "long",
    day: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ar", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function boundedPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusTone(value: number) {
  if (value >= 85) return "bg-emerald-100 text-emerald-800";
  if (value >= 55) return "bg-amber-100 text-amber-800";
  return "bg-red-50 text-red-700";
}

function memorizedLabel(value: boolean | null) {
  if (value === true) return "حافظ";
  if (value === false) return "غير حافظ";
  return "غير مسجل";
}

function whatsAppLabel(report: ReportLike | null) {
  if (!report) return "لا يوجد تقرير";
  if (report.sentToParent) return "أُرسل";
  if (report.parentSentError) return "تعذر الإرسال";
  return "لم يرسل";
}

function whatsAppTone(report: ReportLike | null) {
  if (!report) return "bg-slate-100 text-slate-600";
  if (report.sentToParent) return "bg-emerald-100 text-emerald-800";
  if (report.parentSentError) return "bg-amber-100 text-amber-800";
  return "bg-red-50 text-red-700";
}

function isReportEntered(report: ReportLike) {
  return Boolean(report.status === "ABSENT" || isRecitationReport(report));
}

function isRecitationReport(report: ReportLike) {
  if (report.status !== "PRESENT") return false;
  if (report.lessonName.trim() === "غياب") return false;

  return Boolean(
    report.lessonSurah ||
      report.lessonMemorized !== null ||
      report.reviewSurah ||
      report.review?.trim() ||
      report.pageFrom ||
      report.pageTo ||
      report.pagesCount
  );
}

function reportsInRange<T extends { createdAt: Date }>(reports: T[], start: Date, end: Date) {
  return reports.filter((report) => report.createdAt >= start && report.createdAt < end);
}

function latestReportInRange(reports: ReportLike[], start: Date, end: Date) {
  return reportsInRange(reports, start, end).find(isReportEntered) || null;
}

function reportSummary(report: ReportLike | null) {
  if (!report) return "لم يدخل تقرير";
  if (report.status === "ABSENT") return "غياب";
  return [report.lessonName, report.review ? `مراجعة: ${report.review}` : ""]
    .filter(Boolean)
    .join(" - ");
}

function prevMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function SyriaEducationSupervisionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const view = params?.view === "performance" || params?.view === "monthly" ? params.view : "quran";
  const selectedCircleId = params?.circleId || "";
  const attendanceDays = getLatestSyriaAttendanceDays(4);
  const activeAttendanceDays = attendanceDays.slice(-2);
  const selectedDay =
    activeAttendanceDays.find((day) => day.key === params?.day) || activeAttendanceDays[0];
  const periodStart = attendanceDays[0]?.start || new Date();
  const periodEnd = attendanceDays[attendanceDays.length - 1]?.end || new Date();
  const monthRange = getMonthRange(params?.month);

  const queryStart = view === "monthly" ? monthRange.start : periodStart;
  const queryEnd = view === "monthly" ? monthRange.end : periodEnd;

  const circles = await prisma.circle.findMany({
    where: {
      studyMode: "ONSITE_SYRIA",
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
                gte: queryStart,
                lt: queryEnd,
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

  const selectedCircle = circles.find((circle) => circle.id === selectedCircleId) || circles[0] || null;
  const allStudents = circles.flatMap((circle) => circle.students);
  const allReports = allStudents.flatMap((student) => student.reports as ReportLike[]);
  const enteredReports = allReports.filter(isReportEntered);
  const recitationReports = allReports.filter(isRecitationReport);
  const expectedCurrentReports = circles.reduce(
    (total, circle) => total + circle.students.length * activeAttendanceDays.length,
    0
  );
  const sentReports = enteredReports.filter((report) => report.sentToParent).length;

  const circleCards = circles.map((circle) => {
    const studentsCount = circle.students.length;
    const dayStats = activeAttendanceDays.map((day) => {
      const reports = circle.students.map((student) =>
        latestReportInRange(student.reports as ReportLike[], day.start, day.end)
      );
      const entered = reports.filter(Boolean).length;
      const sent = reports.filter((report) => report?.sentToParent).length;

      return {
        ...day,
        entered,
        sent,
        expected: studentsCount,
      };
    });
    const entered = dayStats.reduce((total, day) => total + day.entered, 0);
    const expected = dayStats.reduce((total, day) => total + day.expected, 0);

    return {
      circle,
      dayStats,
      entered,
      expected,
      completionRate: expected ? boundedPercent((entered / expected) * 100) : 0,
    };
  });

  const performanceRows = circles.map((circle) => {
    const expectedReports = circle.students.length * attendanceDays.length;
    const reports = circle.students.flatMap((student) =>
      reportsInRange(student.reports as ReportLike[], periodStart, periodEnd).filter(isReportEntered)
    );
    const recitations = reports.filter(isRecitationReport);
    const memorized = recitations.filter((report) => report.lessonMemorized === true).length;
    const pages = recitations.reduce((total, report) => total + (report.pagesCount || 0), 0);
    const sent = reports.filter((report) => report.sentToParent).length;
    const completionRate = expectedReports ? (reports.length / expectedReports) * 100 : 0;
    const memorizationRate = recitations.length ? (memorized / recitations.length) * 100 : 0;
    const sendRate = reports.length ? (sent / reports.length) * 100 : 0;
    const score = boundedPercent(completionRate * 0.5 + memorizationRate * 0.3 + sendRate * 0.2);

    return {
      circle,
      expectedReports,
      enteredReports: reports.length,
      recitationReports: recitations.length,
      sent,
      memorized,
      pages,
      score,
      completionRate: boundedPercent(completionRate),
      memorizationRate: boundedPercent(memorizationRate),
      sendRate: boundedPercent(sendRate),
    };
  });

  const monthlyCircleRows = circles.map((circle) => {
    const reports = circle.students.flatMap((student) =>
      reportsInRange(student.reports as ReportLike[], monthRange.start, monthRange.end).filter(isReportEntered)
    );
    const recitations = reports.filter(isRecitationReport);
    const pages = recitations.reduce((total, report) => total + (report.pagesCount || 0), 0);
    const absent = reports.filter((report) => report.status === "ABSENT").length;
    const notMemorized = recitations.filter((report) => report.lessonMemorized === false).length;
    const sent = reports.filter((report) => report.sentToParent).length;

    return {
      circle,
      reports,
      reportsCount: reports.length,
      recitationsCount: recitations.length,
      pages,
      absent,
      notMemorized,
      sent,
    };
  });

  const selectedMonthlyCircle =
    monthlyCircleRows.find((row) => row.circle.id === selectedCircleId) || monthlyCircleRows[0] || null;

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/syria/admin/dashboard"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4]"
            >
              الرجوع للوحة الإدارة
            </Link>
            <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
              إشراف تعليمي - سوريا
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
            متابعة الجمعة والثلاثاء.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
            هذه الصفحة تركز على تقارير حلقات القرآن الكريم في سوريا: اكتمال
            التقارير، تفاصيل ما كتبه المعلم، حالة إرسال واتساب، وملخصات الأداء
            الشهرية.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            {
              href: "/syria/admin/education-supervision",
              active: view === "quran",
              title: "إشراف حلقات القرآن الكريم",
              body: "متابعة إدخال تقارير الجمعة والثلاثاء لكل حلقة.",
            },
            {
              href: "/syria/admin/education-supervision?view=performance",
              active: view === "performance",
              title: "متابعة أداء الحلقات",
              body: "مؤشر عملي للانتظام والحفظ وإرسال رسائل واتساب.",
            },
            {
              href: `/syria/admin/education-supervision?view=monthly&month=${monthRange.key}`,
              active: view === "monthly",
              title: "التقارير الشهرية",
              body: "ملخص شهري عام، حسب الحلقة، وحسب الطالب.",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`rounded-[1.8rem] p-5 shadow-sm ring-1 ring-[#d8bf83] transition hover:-translate-y-0.5 ${
                item.active ? "bg-[#0f5a35] text-white" : "bg-white/88 text-[#0a3f2a]"
              }`}
            >
              <h2 className="text-2xl font-black">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 opacity-75">{item.body}</p>
            </Link>
          ))}
        </section>

        {view === "quran" ? (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              {[
                ["الحلقات", circles.length],
                ["الطلاب", allStudents.length],
                ["تقارير الفترة", `${enteredReports.length}/${expectedCurrentReports}`],
                ["واتساب مرسل", sentReports],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.5rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
                  <p className="text-sm font-bold text-[#1c2d31]/55">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#0a3f2a]">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#1c2d31]">
                    إشراف حلقات القرآن الكريم
                  </h2>
                  <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                    الفترة الحالية: {activeAttendanceDays.map((day) => `${day.label} ${formatShortDate(day.start)}`).join(" - ")}.
                  </p>
                </div>
                <span className="rounded-full bg-[#0a3f2a] px-4 py-2 text-sm font-black text-white">
                  {circles.length} حلقة
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {circleCards.map((item) => (
                  <Link
                    key={item.circle.id}
                    href={`/syria/admin/education-supervision?circleId=${item.circle.id}&day=${selectedDay.key}`}
                    className={`rounded-[1.8rem] p-5 ring-1 transition hover:-translate-y-0.5 ${
                      selectedCircle?.id === item.circle.id
                        ? "bg-[#0a3f2a] text-white ring-[#0a3f2a]"
                        : "bg-[#fffaf4] text-[#1c2d31] ring-[#e7d7b4]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black leading-8">{item.circle.name}</h3>
                        <p className="mt-2 text-sm leading-7 opacity-70">
                          المعلم: {item.circle.teacher?.fullName || "لم يحدد"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(item.completionRate)}`}>
                        {item.completionRate}%
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {item.dayStats.map((day) => (
                        <div
                          key={`${item.circle.id}-${day.key}`}
                          className="flex items-center justify-between rounded-2xl bg-white/85 px-3 py-2 text-[#1c2d31]"
                        >
                          <span className="text-sm font-black">{day.label}</span>
                          <span className="text-xs font-black">
                            تقارير {day.entered}/{day.expected} - واتساب {day.sent}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {selectedCircle ? (
              <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
                <div className="mb-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-[#0a3f2a] p-4 text-white">
                    <p className="text-sm text-white/70">الحلقة</p>
                    <p className="mt-2 text-xl font-black">{selectedCircle.name}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                    <p className="text-sm text-[#1c2d31]/55">المعلم</p>
                    <p className="mt-2 text-xl font-black text-[#0a3f2a]">
                      {selectedCircle.teacher?.fullName || "لم يحدد"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                    <p className="text-sm text-[#1c2d31]/55">الطلاب</p>
                    <p className="mt-2 text-xl font-black text-[#0f5a35]">
                      {selectedCircle.students.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                    <p className="text-sm text-[#1c2d31]/55">اليوم المحدد</p>
                    <p className="mt-2 text-xl font-black text-[#bd8f2d]">
                      {selectedDay.label}
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {activeAttendanceDays.map((day) => (
                    <Link
                      key={day.key}
                      href={`/syria/admin/education-supervision?circleId=${selectedCircle.id}&day=${day.key}`}
                      className={`rounded-full px-4 py-2 text-sm font-black transition ${
                        selectedDay.key === day.key
                          ? "bg-[#0a3f2a] text-white"
                          : "bg-[#fffaf4] text-[#0a3f2a] ring-1 ring-[#d8bf83]"
                      }`}
                    >
                      {day.label} {formatShortDate(day.start)}
                    </Link>
                  ))}
                </div>

                <div className="grid gap-3">
                  {selectedCircle.students.map((student) => {
                    const report = latestReportInRange(
                      student.reports as ReportLike[],
                      selectedDay.start,
                      selectedDay.end
                    );

                    return (
                      <article
                        key={student.id}
                        className="rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-[#1c2d31]">
                                {student.fullName}
                              </h3>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  report ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"
                                }`}
                              >
                                {report ? "تم إدخال التقرير" : "لم يدخل التقرير"}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${whatsAppTone(report)}`}>
                                واتساب: {whatsAppLabel(report)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/62">
                              {reportSummary(report)}
                            </p>
                          </div>
                          <div className="grid gap-2 text-sm lg:min-w-80">
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc4]">
                              <span className="font-black text-[#0a3f2a]">الحالة: </span>
                              {report
                                ? report.status === "ABSENT"
                                  ? "غائب"
                                  : memorizedLabel(report.lessonMemorized)
                                : "-"}
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc4]">
                              <span className="font-black text-[#0a3f2a]">واجب الغد: </span>
                              {report?.nextHomework || "-"}
                            </div>
                          </div>
                        </div>
                        {report ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadcc4]">
                              <p className="text-xs font-black text-[#0a3f2a]">الدرس</p>
                              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/70">
                                {report.lessonName || "-"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadcc4]">
                              <p className="text-xs font-black text-[#0a3f2a]">المراجعة</p>
                              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/70">
                                {report.review || "-"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadcc4]">
                              <p className="text-xs font-black text-[#0a3f2a]">الملاحظات</p>
                              <p className="mt-2 text-sm leading-7 text-[#1c2d31]/70">
                                {report.note || "-"}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {view === "performance" ? (
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1c2d31]">متابعة أداء الحلقات</h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                  المؤشر يعتمد على آخر أربع جلسات: إدخال التقارير، جودة الحفظ، وحالة إرسال واتساب.
                </p>
              </div>
              <span className="rounded-full bg-[#0a3f2a] px-4 py-2 text-sm font-black text-white">
                {formatShortDate(periodStart)} - {formatShortDate(periodEnd)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {performanceRows.map((row) => (
                <div key={row.circle.id} className="rounded-[1.8rem] bg-[#fffaf4] p-5 ring-1 ring-[#e7d7b4]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black leading-8 text-[#1c2d31]">
                        {row.circle.name}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#1c2d31]/62">
                        {row.circle.teacher?.fullName || "لم يحدد"}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone(row.score)}`}>
                      {row.score}%
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc4]">
                      <span className="font-bold text-[#1c2d31]/65">التقارير</span>
                      <span className="font-black text-[#0a3f2a]">
                        {row.enteredReports}/{row.expectedReports}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc4]">
                      <span className="font-bold text-[#1c2d31]/65">الحفظ</span>
                      <span className="font-black text-[#0a3f2a]">{row.memorizationRate}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc4]">
                      <span className="font-bold text-[#1c2d31]/65">واتساب</span>
                      <span className="font-black text-[#0a3f2a]">{row.sendRate}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-[#eadcc4]">
                      <span className="font-bold text-[#1c2d31]/65">صفحات</span>
                      <span className="font-black text-[#bd8f2d]">{row.pages}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {view === "monthly" ? (
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1c2d31]">التقارير الشهرية</h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                  ملخص شهري أولي مبني على التقارير اليومية الحالية.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/syria/admin/education-supervision?view=monthly&month=${prevMonth(monthRange.key)}`}
                  className="rounded-full bg-[#fffaf4] px-4 py-2 text-sm font-black text-[#0a3f2a] ring-1 ring-[#d8bf83]"
                >
                  الشهر السابق
                </Link>
                <span className="rounded-full bg-[#0a3f2a] px-4 py-2 text-sm font-black text-white">
                  {formatMonthLabel(monthRange.key)}
                </span>
                <Link
                  href={`/syria/admin/education-supervision?view=monthly&month=${nextMonth(monthRange.key)}`}
                  className="rounded-full bg-[#fffaf4] px-4 py-2 text-sm font-black text-[#0a3f2a] ring-1 ring-[#d8bf83]"
                >
                  الشهر التالي
                </Link>
              </div>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-4">
              {[
                ["تقارير الشهر", enteredReports.length],
                ["تقارير تسميع", recitationReports.length],
                ["صفحات منجزة", recitationReports.reduce((total, report) => total + (report.pagesCount || 0), 0)],
                ["رسائل واتساب", sentReports],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                  <p className="text-sm text-[#1c2d31]/55">{label}</p>
                  <p className="mt-2 text-2xl font-black text-[#0a3f2a]">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                {monthlyCircleRows.map((row) => (
                  <Link
                    key={row.circle.id}
                    href={`/syria/admin/education-supervision?view=monthly&month=${monthRange.key}&circleId=${row.circle.id}`}
                    className={`block rounded-[1.5rem] p-4 ring-1 transition ${
                      selectedMonthlyCircle?.circle.id === row.circle.id
                        ? "bg-[#0a3f2a] text-white ring-[#0a3f2a]"
                        : "bg-[#fffaf4] text-[#1c2d31] ring-[#e7d7b4]"
                    }`}
                  >
                    <h3 className="text-lg font-black">{row.circle.name}</h3>
                    <p className="mt-1 text-sm opacity-70">
                      {row.circle.teacher?.fullName || "لم يحدد"}
                    </p>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-black">
                      <span>تقارير {row.reportsCount}</span>
                      <span>تسميع {row.recitationsCount}</span>
                      <span>صفحات {row.pages}</span>
                      <span>واتساب {row.sent}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {selectedMonthlyCircle ? (
                <div className="rounded-[1.8rem] bg-[#fffaf4] p-5 ring-1 ring-[#e7d7b4]">
                  <h3 className="text-2xl font-black text-[#1c2d31]">
                    {selectedMonthlyCircle.circle.name}
                  </h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full overflow-hidden rounded-2xl text-sm">
                      <thead>
                        <tr className="bg-[#0a3f2a] text-right text-white">
                          <th className="px-4 py-3 font-black">الطالب</th>
                          <th className="px-4 py-3 font-black">التقارير</th>
                          <th className="px-4 py-3 font-black">الصفحات</th>
                          <th className="px-4 py-3 font-black">غير حافظ</th>
                          <th className="px-4 py-3 font-black">غياب</th>
                          <th className="px-4 py-3 font-black">آخر تقرير</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMonthlyCircle.circle.students.map((student) => {
                          const reports = reportsInRange(
                            student.reports as ReportLike[],
                            monthRange.start,
                            monthRange.end
                          ).filter(isReportEntered);
                          const recitations = reports.filter(isRecitationReport);
                          const pages = recitations.reduce(
                            (total, report) => total + (report.pagesCount || 0),
                            0
                          );
                          const notMemorized = recitations.filter(
                            (report) => report.lessonMemorized === false
                          ).length;
                          const absences = reports.filter((report) => report.status === "ABSENT").length;
                          const latest = reports[0] || null;

                          return (
                            <tr key={student.id} className="border-b border-[#e7d7b4] bg-white">
                              <td className="px-4 py-3 font-black text-[#1c2d31]">
                                {student.fullName}
                              </td>
                              <td className="px-4 py-3 text-[#1c2d31]/70">{reports.length}</td>
                              <td className="px-4 py-3 font-black text-[#0a3f2a]">{pages}</td>
                              <td className="px-4 py-3 text-[#1c2d31]/70">{notMemorized}</td>
                              <td className="px-4 py-3 text-[#1c2d31]/70">{absences}</td>
                              <td className="min-w-72 px-4 py-3 text-[#1c2d31]/70">
                                {latest ? reportSummary(latest) : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
