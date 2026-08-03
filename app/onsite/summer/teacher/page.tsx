import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTodayDateKey, getLocalDayOfWeek, toLocalDateKey } from "@/lib/date-utils";

import LogoutButton from "@/components/LogoutButton";
import TeacherStudentCard from "@/components/teacher/TeacherStudentCard";
import CircularProgress from "@/components/ui/CircularProgress";
import QuranEducationIllustration from "@/components/ui/QuranEducationIllustration";

type DashboardPageProps = {
  searchParams?: Promise<{ dateKey?: string }>;
};

/* ─── Relative Time Helper (Arabic) ─── */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return "الآن";
  if (diffMin === 1) return "قبل دقيقة";
  if (diffMin === 2) return "قبل دقيقتين";
  if (diffMin <= 10) return `قبل ${diffMin} دقائق`;
  if (diffMin <= 59) return `قبل ${diffMin} دقيقة`;
  if (diffHr === 1) return "قبل ساعة";
  if (diffHr === 2) return "قبل ساعتين";
  if (diffHr <= 10) return `قبل ${diffHr} ساعات`;
  if (diffHr <= 23) return `قبل ${diffHr} ساعة`;
  if (diffDays === 1) return "أمس";
  if (diffDays === 2) return "قبل يومين";
  return `قبل ${diffDays} أيام`;
}

export default async function OnsiteSummerTeacherDashboard({ searchParams }: DashboardPageProps) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/onsite/summer/teacher/login");
  }

  const teacher = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, fullName: true, role: true },
  });

  if (!teacher) {
    redirect("/onsite/summer/teacher/login");
  }

  // Admin Guard: Redirect admin users to admin dashboard
  if (teacher.role === "ADMIN") {
    redirect("/onsite/summer/admin");
  }

  const sParams = (await searchParams) || {};
  const todayStr = getTodayDateKey();
  const selectedDateKey = sParams.dateKey && /^\d{4}-\d{2}-\d{2}$/.test(sParams.dateKey) ? sParams.dateKey : todayStr;
  const isPastDate = selectedDateKey < todayStr;

  // Generate available past dates from 9 July 2026 up to today, skipping Mondays
  const availableDates: Array<{ dateKey: string; label: string; isToday: boolean; dayName: string; dayNum: string }> = [];
  const today = new Date();
  const startDate = new Date("2026-07-09");

  const curr = new Date(startDate);
  while (curr <= today) {
    const dayOfWeek = getLocalDayOfWeek(curr);

    // Skip Mondays (day 1) as Monday is a holiday in the Summer course
    if (dayOfWeek !== 1) {
      const dateStr = toLocalDateKey(curr);
      const isTodayDate = dateStr === todayStr;

      const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const shortDayNames = ["أح", "اث", "ثل", "أر", "خم", "جم", "سب"];
      const dayLabel = `${dayNames[dayOfWeek]} (${dateStr})`;

      availableDates.push({
        dateKey: dateStr,
        label: isTodayDate ? `اليوم - ${dayLabel}` : dayLabel,
        isToday: isTodayDate,
        dayName: shortDayNames[dayOfWeek],
        dayNum: dateStr.slice(8),
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  // Reverse so newest date comes first
  availableDates.reverse();

  // Get recent 7 days for the day picker
  const recentDays = availableDates.slice(0, 7);

  // ═══════════════ DATA FETCH (Expanded select) ═══════════════
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      studyMode: "ONSITE_SUMMER",
      OR: [
        { teacherId: teacher.id },
        { studentCode: "7500" },
      ],
    },
    include: {
      circle: { select: { name: true } },
      summerReports: {
        where: {
          dateKey: { gte: "2026-07-09" },
        },
        select: {
          id: true,
          status: true,
          dateKey: true,
          quranNew: true,
          quranRevision: true,
          quranTaqeen: true,
          noorLearned: true,
          behaviorGrade: true,
          createdAt: true,
        },
        orderBy: { dateKey: "desc" },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // ═══════════════ SMART COMPUTATIONS ═══════════════
  const allWorkingDates = availableDates.map((d) => d.dateKey);

  // Last 7 working days in chronological order (oldest first) for dots
  const last7Days = recentDays.slice(0, 7).map(d => d.dateKey).reverse();
  const last7DayLabels = recentDays.slice(0, 7).map(d => d.dayName).reverse();

  const studentsWithMeta = students.map((st) => {
    const reportForSelectedDate = st.summerReports.find((r) => r.dateKey === selectedDateKey) || null;
    const lastPresentReport = st.summerReports.find((r) => r.status === "PRESENT") || null;

    const recordedKeys = new Set(st.summerReports.map((r) => r.dateKey));
    const missingDateKeys = allWorkingDates.filter((dKey) => !recordedKeys.has(dKey));

    // Smart analytics per student
    const presentReports = st.summerReports.filter((r) => r.status === "PRESENT");
    const absentReports = st.summerReports.filter((r) => r.status === "ABSENT");
    const totalReports = st.summerReports.length;
    const attendanceRate = totalReports > 0 ? Math.round((presentReports.length / totalReports) * 100) : 0;

    // Last behavior grade (from most recent present report)
    const lastBehaviorGrade = presentReports.length > 0 ? presentReports[0].behaviorGrade : null;

    // Recent 7 days dots
    const recentDots = last7Days.map((dateKey) => {
      if (dateKey > todayStr) return "future" as const;
      const report = st.summerReports.find((r) => r.dateKey === dateKey);
      if (!report) return "missing" as const;
      return report.status === "PRESENT" ? "present" as const : "absent" as const;
    });

    return {
      student: {
        id: st.id,
        fullName: st.fullName,
        studentCode: st.studentCode,
        summerGroup: st.summerGroup,
        circleName: st.circle?.name,
      },
      reportForSelectedDate,
      lastPresentReport: lastPresentReport
        ? {
            dateKey: lastPresentReport.dateKey,
            quranNew: lastPresentReport.quranNew,
            quranRevision: lastPresentReport.quranRevision,
            noorLearned: lastPresentReport.noorLearned,
          }
        : null,
      missingDateKeys,
      // Smart analytics
      attendanceRate,
      totalReports,
      absentCount: absentReports.length,
      lastBehaviorGrade,
      recentDots,
      lastPresentDate: lastPresentReport?.dateKey || null,
    };
  });

  // ═══════════════ DASHBOARD METRICS ═══════════════
  const filledCount = studentsWithMeta.filter((s) => Boolean(s.reportForSelectedDate)).length;
  const remainingCount = students.length - filledCount;
  const completionPercentage = students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;

  // Absent today
  const absentTodayCount = studentsWithMeta.filter(
    (s) => s.reportForSelectedDate?.status === "ABSENT"
  ).length;

  // Students with missing days
  const studentsWithMissingCount = studentsWithMeta.filter((s) => s.missingDateKeys.length > 0).length;
  const totalMissingDays = studentsWithMeta.reduce((sum, s) => sum + s.missingDateKeys.length, 0);

  // Students not seen recently (no present report for 2+ working days)
  const studentsNotSeenCount = studentsWithMeta.filter((s) => {
    if (!s.lastPresentDate) return s.totalReports > 0; // only if they ever had a report
    const idx = allWorkingDates.indexOf(s.lastPresentDate);
    return idx >= 2; // 2+ working days ago (allWorkingDates[0] = today)
  }).length;

  // ═══════════════ RECENT ACTIVITY ═══════════════
  const recentActivity = students
    .flatMap((st) =>
      st.summerReports.map((r) => ({
        studentName: st.fullName,
        status: r.status as string,
        dateKey: r.dateKey,
        createdAt: r.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Reports saved in the last hour
  const oneHourAgo = new Date(Date.now() - 3600000);
  const reportsLastHour = students.reduce(
    (count, st) => count + st.summerReports.filter((r) => new Date(r.createdAt) >= oneHourAgo).length,
    0
  );

  // ═══════════════ PROGRESS TIMELINE ═══════════════
  const progressTimeline = recentDays.slice(0, 7).reverse().map((day) => {
    const isFuture = day.dateKey > todayStr;
    const isToday = day.dateKey === todayStr;
    const allRecorded = students.length > 0 && students.every((st) =>
      st.summerReports.some((r) => r.dateKey === day.dateKey)
    );

    let status: "complete" | "current" | "incomplete" | "future";
    if (isFuture) status = "future";
    else if (isToday) status = allRecorded ? "complete" : "current";
    else status = allRecorded ? "complete" : "incomplete";

    return { ...day, status };
  });

  // ═══════════════ TEACHER PERFORMANCE ═══════════════
  const completedDayKeys = allWorkingDates.filter((dateKey) => {
    if (dateKey >= todayStr) return false;
    return students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === dateKey));
  });

  type DayDuration = { dateKey: string; durationMinutes: number; dayName: string };
  const dayDurations: DayDuration[] = [];

  for (const dateKey of completedDayKeys) {
    const dayReports = students.flatMap((st) =>
      st.summerReports.filter((r) => r.dateKey === dateKey)
    );
    if (dayReports.length < 2) continue;

    const times = dayReports.map((r) => new Date(r.createdAt).getTime());
    const first = Math.min(...times);
    const last = Math.max(...times);
    const durationMinutes = Math.round((last - first) / 60000);

    if (durationMinutes > 0 && durationMinutes < 300) {
      const d = new Date(dateKey);
      const dayOfWeek = getLocalDayOfWeek(d);
      const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      dayDurations.push({ dateKey, durationMinutes, dayName: dayNames[dayOfWeek] });
    }
  }

  const avgCompletionMinutes = dayDurations.length > 0
    ? Math.round(dayDurations.reduce((sum, d) => sum + d.durationMinutes, 0) / dayDurations.length)
    : null;

  const bestCompletionDay = dayDurations.length > 0
    ? dayDurations.reduce((min, d) => (d.durationMinutes < min.durationMinutes ? d : min))
    : null;

  // Streak: consecutive completed days from today backward
  let completionStreak = 0;
  for (const dateKey of allWorkingDates) {
    if (dateKey > todayStr) continue;
    if (dateKey === todayStr) {
      if (completionPercentage === 100) completionStreak++;
      continue;
    }
    const allHaveReport = students.length > 0 && students.every((st) =>
      st.summerReports.some((r) => r.dateKey === dateKey)
    );
    if (allHaveReport) completionStreak++;
    else break;
  }

  // ═══════════════ PRIORITY SORTING ═══════════════
  const pendingStudents = studentsWithMeta.filter((s) => !s.reportForSelectedDate);
  const completedStudents = studentsWithMeta.filter((s) => Boolean(s.reportForSelectedDate));

  // Sort pending: missing days first (most missing first), then alphabetically
  const sortedPendingStudents = [...pendingStudents].sort((a, b) => {
    if (a.missingDateKeys.length !== b.missingDateKeys.length) {
      return b.missingDateKeys.length - a.missingDateKeys.length;
    }
    return a.student.fullName.localeCompare(b.student.fullName, "ar");
  });

  // ═══════════════ GAMIFICATION ═══════════════
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "صباح الخير" : "مساء الخير";
  const firstName = teacher.fullName?.split(" ")[0] || "أستاذ";
  const estimatedMinutes = Math.ceil(remainingCount * 1.5);

  const getGamificationMessage = () => {
    if (students.length === 0) return null;
    if (completionPercentage === 100) return "✅ ما شاء الله! تم إكمال رصد جميع الطلاب";
    if (completionPercentage >= 90) {
      const rem = remainingCount === 1 ? "طالب واحد" : remainingCount === 2 ? "طالبان" : `${remainingCount} طلاب`;
      return `🏆 شبه مكتمل! بقي ${rem} فقط`;
    }
    if (completionPercentage >= 61) return `🎉 أحسنت! بقي ${remainingCount} — أقل من ${estimatedMinutes} دقائق`;
    if (completionPercentage >= 31) return `⚡ أكثر من النصف! بقي ${remainingCount} فقط`;
    if (completionPercentage >= 1) return `🔥 بداية رائعة! أنجزت ${filledCount} من ${students.length}`;
    return `💪 لديك ${students.length} طالباً بانتظار الرصد — يالله نبدأ!`;
  };

  const getProgressColor = () => {
    if (completionPercentage >= 90) return "#059669";
    if (completionPercentage >= 61) return "#0C5C5E";
    if (completionPercentage >= 31) return "#D97706";
    return "#DC2626";
  };

  // ═══════════════ SMART ALERTS ═══════════════
  const smartAlerts: Array<{ message: string; type: "success" | "warning" | "danger" | "info" }> = [];

  if (completionPercentage === 100 && students.length > 0) {
    smartAlerts.push({ message: "✅ بارك الله فيك — تم إكمال رصد جميع الطلاب لهذا اليوم", type: "success" });
  }
  if (remainingCount > 0 && remainingCount <= 3) {
    const rem = remainingCount === 1 ? "تقرير واحد" : remainingCount === 2 ? "تقريران" : `${remainingCount} تقارير`;
    smartAlerts.push({ message: `⚡ بقي ${rem} فقط!`, type: "info" });
  }
  if (studentsWithMissingCount > 0) {
    smartAlerts.push({ message: `⚠️ يوجد ${studentsWithMissingCount} طلاب لديهم أيام ناقصة`, type: "warning" });
  }
  if (studentsNotSeenCount > 0) {
    smartAlerts.push({ message: `🔴 يوجد ${studentsNotSeenCount} طلاب لم يحضروا منذ يومين أو أكثر`, type: "danger" });
  }
  if (completionStreak >= 3) {
    smartAlerts.push({ message: `🔥 ${completionStreak} أيام إكمال متتالية — استمر!`, type: "success" });
  }

  const alertColors = {
    success: "bg-[#D1FAE5] border-[#A7F3D0] text-[#065F46]",
    warning: "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]",
    danger: "bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]",
    info: "bg-[#EDF5F4] border-[#0C5C5E]/20 text-[#0C5C5E]",
  };

  // First pending student for quick action
  const firstPendingStudent = sortedPendingStudents[0] || null;

  // Islamic star SVG icon for section headers
  const StarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </svg>
  );

  // ═══════════════ JSX RENDER ═══════════════
  return (
    <div className="min-h-screen pb-16">
      {/* ═══════════════ SIGNATURE HEADER ═══════════════ */}
      <header className="bg-[#0C5C5E] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Right: Logo + Brand */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/alrahma_tahfeez_logo.png"
                alt="تحفيظ الرحمة"
                width={38}
                height={38}
                className="h-[38px] w-[38px] rounded-lg object-contain"
              />
              <div className="hidden sm:block h-8 w-px bg-white/20" />
              <div>
                <h1 className="text-[15px] font-bold font-heading text-white leading-tight">
                  تحفيظ الرحمة
                </h1>
                <p className="text-[11px] font-medium text-white/60 hidden sm:block">
                  الدورة الصيفية
                </p>
              </div>
            </div>

            {/* Left: Teacher info + Logout */}
            <div className="flex items-center gap-3">
              <div className="text-left hidden sm:block">
                <span className="block text-[13px] font-semibold text-white/90">
                  {teacher.fullName}
                </span>
                <span className="block text-[11px] text-white/50">
                  {todayStr}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold text-white border border-white/20">
                {teacher.fullName ? teacher.fullName.charAt(0) : "أ"}
              </div>
              <LogoutButton
                redirectUrl="/onsite/summer"
                className="h-9 w-9 rounded-lg bg-transparent hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition border border-transparent hover:border-white/20"
              />
            </div>
          </div>
        </div>

        {/* Islamic decorative strip */}
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #0C5C5E, #1A8A8D, #0C5C5E)',
          }}
        />
      </header>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6 space-y-4">

        {/* ─── 1. Smart Greeting + Gamification ─── */}
        <div className="bg-[#EDF5F4] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          {/* Background illustration */}
          <div className="hidden lg:block absolute left-28 -bottom-4 opacity-[0.35] pointer-events-none">
            <QuranEducationIllustration className="w-36 h-36" />
          </div>

          <div className="relative z-10 flex-1 w-full">
            <p className="text-[13px] font-medium text-[#0C5C5E]/70 mb-1">
              السلام عليكم ورحمة الله
            </p>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#0C5C5E] leading-tight">
              {timeGreeting} أستاذ {firstName}
            </h2>

            {/* Gamification Message */}
            {getGamificationMessage() && (
              <p className="text-[14px] text-[#374151] mt-2 font-semibold">
                {getGamificationMessage()}
              </p>
            )}

            {/* Progress Bar */}
            {students.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-3 bg-white rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: `${Math.max(completionPercentage, 2)}%`,
                      backgroundColor: getProgressColor(),
                    }}
                  />
                </div>
                <span className="text-[14px] font-bold text-[#0C5C5E] shrink-0 min-w-[3rem] text-left" dir="ltr">
                  {completionPercentage}%
                </span>
              </div>
            )}
          </div>

          {/* Circular Progress */}
          <div className="shrink-0 relative z-10">
            <CircularProgress
              percentage={completionPercentage}
              size={100}
              strokeWidth={7}
              filledCount={filledCount}
              totalCount={students.length}
            />
          </div>
        </div>

        {/* ─── 2. Horizontal Day Picker ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[13px] font-semibold text-[#6B7280] shrink-0 ml-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            التاريخ:
          </span>
          {recentDays.map((day) => {
            const isSelected = day.dateKey === selectedDateKey;
            return (
              <Link
                key={day.dateKey}
                href={day.isToday ? "/onsite/summer/teacher" : `/onsite/summer/teacher?dateKey=${day.dateKey}`}
                className={`shrink-0 flex flex-col items-center justify-center w-[52px] h-[58px] rounded-xl transition-all duration-200 border ${
                  isSelected
                    ? "bg-[#0C5C5E] text-white border-[#0C5C5E] shadow-md"
                    : "bg-white text-[#374151] border-[#E5E3DF] hover:border-[#0C5C5E]/40 hover:bg-[#EDF5F4]"
                }`}
              >
                <span className={`text-[11px] font-medium ${isSelected ? "text-white/70" : "text-[#9CA3AF]"}`}>
                  {day.dayName}
                </span>
                <span className={`text-[16px] font-bold ${isSelected ? "text-white" : "text-[#1F2937]"}`}>
                  {day.dayNum}
                </span>
                {day.isToday && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-[#0C5C5E]"}`} />
                )}
              </Link>
            );
          })}

          {/* Show more dates via select for older dates */}
          {availableDates.length > 7 && (
            <form method="GET" className="shrink-0 flex items-center gap-1.5">
              <select
                name="dateKey"
                defaultValue=""
                className="h-[58px] rounded-xl border border-[#E5E3DF] bg-white px-3 text-[12px] font-semibold text-[#6B7280] outline-none focus:border-[#0C5C5E] focus:ring-1 focus:ring-[#0C5C5E]/20 cursor-pointer"
              >
                <option value="">سابق...</option>
                {availableDates.slice(7).map((d) => (
                  <option key={d.dateKey} value={d.dateKey}>
                    {d.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="h-[58px] rounded-xl bg-[#0C5C5E] px-3 text-white text-[12px] font-semibold hover:bg-[#0A4D4F] transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </form>
          )}
        </div>

        {/* ─── 3. Past Date Alert ─── */}
        {isPastDate && (
          <div className="rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <span className="text-[13px] font-bold text-[#92400E]">
                  تقوم برصد تقرير ليوم سابق: {selectedDateKey}
                </span>
                <p className="text-[12px] text-[#92400E]/70 mt-0.5">
                  يتطلب موافقة الإدارة بعد الحفظ
                </p>
              </div>
            </div>
            <Link
              href="/onsite/summer/teacher"
              className="shrink-0 text-[12px] font-semibold text-[#0C5C5E] hover:underline"
            >
              العودة لليوم الحالي
            </Link>
          </div>
        )}

        {/* ─── 4. Stats Grid (4 cards) ─── */}
        {students.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Students */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280]">إجمالي الطلاب</p>
                  <p className="text-[22px] font-bold text-[#0C5C5E] mt-0.5">{students.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#0C5C5E]/8 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
            </div>

            {/* Recorded Today */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280]">تم الرصد</p>
                  <p className="text-[22px] font-bold text-[#059669] mt-0.5">{filledCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#059669]/8 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
              </div>
            </div>

            {/* Absent Today */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280]">غائبون اليوم</p>
                  <p className={`text-[22px] font-bold mt-0.5 ${absentTodayCount > 0 ? "text-[#DC2626]" : "text-[#9CA3AF]"}`}>{absentTodayCount}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${absentTodayCount > 0 ? "bg-[#DC2626]/8" : "bg-[#F3F4F6]"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={absentTodayCount > 0 ? "#DC2626" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
              </div>
            </div>

            {/* Missing Days */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280]">أيام ناقصة</p>
                  <p className={`text-[22px] font-bold mt-0.5 ${totalMissingDays > 0 ? "text-[#D97706]" : "text-[#9CA3AF]"}`}>{totalMissingDays}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalMissingDays > 0 ? "bg-[#D97706]/8" : "bg-[#F3F4F6]"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={totalMissingDays > 0 ? "#D97706" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── 5. Two Wide Cards: Today's Focus + Recent Activity ─── */}
        {students.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">

            {/* TODAY'S FOCUS */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E3DF] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <h3 className="text-[14px] font-bold font-heading text-[#1F2937]">تركيز اليوم</h3>
              </div>
              <div className="p-4 space-y-4">

                {/* Progress Timeline */}
                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] mb-2">مسار الأسبوع</p>
                  <div className="flex items-center gap-1.5">
                    {progressTimeline.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                          day.status === "complete"
                            ? "bg-[#059669] text-white"
                            : day.status === "current"
                              ? "bg-[#0C5C5E] text-white ring-2 ring-[#0C5C5E]/30"
                              : day.status === "incomplete"
                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                : "bg-[#F3F4F6] text-[#D1D5DB]"
                        }`}>
                          {day.status === "complete" ? "✔" : day.status === "current" ? "◯" : day.status === "incomplete" ? "✗" : "—"}
                        </div>
                        <span className={`text-[10px] font-medium ${day.status === "current" ? "text-[#0C5C5E] font-bold" : "text-[#9CA3AF]"}`}>
                          {day.dayName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] mb-2">إجراءات سريعة</p>
                  <div className="flex flex-wrap gap-2">
                    {firstPendingStudent && (
                      <Link
                        href={`/onsite/summer/teacher/reports/${firstPendingStudent.student.id}?dateKey=${selectedDateKey}`}
                        className="flex items-center gap-1.5 rounded-lg bg-[#0C5C5E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#0A4D4F] transition-all duration-200 shadow-xs"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        رصد أسرع طالب
                      </Link>
                    )}
                    {reportsLastHour > 0 && (
                      <span className="flex items-center gap-1 rounded-lg bg-[#EDF5F4] px-3 py-2 text-[12px] font-semibold text-[#0C5C5E] border border-[#0C5C5E]/10">
                        📊 {reportsLastHour} تقرير آخر ساعة
                      </span>
                    )}
                  </div>
                </div>

                {/* Teacher Performance */}
                {(avgCompletionMinutes !== null || completionStreak >= 2) && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#6B7280] mb-2">أداؤك</p>
                    <div className="flex flex-wrap gap-3 text-[12px]">
                      {avgCompletionMinutes !== null && (
                        <div className="flex items-center gap-1.5 text-[#374151]">
                          <span className="text-[#0C5C5E]">⏱</span>
                          <span className="font-medium">متوسط الإنجاز: <strong>{avgCompletionMinutes} دقيقة</strong></span>
                        </div>
                      )}
                      {bestCompletionDay && (
                        <div className="flex items-center gap-1.5 text-[#374151]">
                          <span className="text-[#059669]">🏆</span>
                          <span className="font-medium">أفضل يوم: <strong>{bestCompletionDay.dayName}</strong> ({bestCompletionDay.durationMinutes} د)</span>
                        </div>
                      )}
                      {completionStreak >= 2 && (
                        <div className="flex items-center gap-1.5 text-[#374151]">
                          <span className="text-[#D97706]">🔥</span>
                          <span className="font-medium"><strong>{completionStreak}</strong> أيام متتالية</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] shadow-xs overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E3DF] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <h3 className="text-[14px] font-bold font-heading text-[#1F2937]">النشاط الأخير</h3>
              </div>
              <div className="p-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-[#9CA3AF] font-medium">لا يوجد نشاط مسجل بعد</p>
                    <p className="text-[12px] text-[#D1D5DB] mt-1">ابدأ برصد أول طالب لمشاهدة النشاط هنا</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {recentActivity.map((activity, i) => (
                      <div key={i}>
                        <div className="flex items-start gap-3 py-2.5">
                          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                            activity.status === "ABSENT"
                              ? "bg-[#FEE2E2] text-[#DC2626]"
                              : "bg-[#D1FAE5] text-[#059669]"
                          }`}>
                            {activity.status === "ABSENT" ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#1F2937] truncate">
                              {activity.status === "ABSENT"
                                ? `تم تسجيل غياب ${activity.studentName}`
                                : `تم حفظ تقرير ${activity.studentName}`}
                            </p>
                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                              {getRelativeTime(new Date(activity.createdAt))}
                              {activity.dateKey !== todayStr && (
                                <span className="text-[#D97706]"> • {activity.dateKey}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {i < recentActivity.length - 1 && (
                          <div className="border-b border-[#E5E3DF]/50 mr-10" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── 6. Smart Alerts ─── */}
        {smartAlerts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {smartAlerts.map((alert, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-[12px] font-semibold ${alertColors[alert.type]}`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ STUDENT SECTIONS ═══════════════ */}

        {studentsWithMeta.length === 0 ? (
          /* Empty State */
          <div className="rounded-xl border border-dashed border-[#E5E3DF] bg-white p-12 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1CFC9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3 className="text-[15px] font-bold text-[#374151] font-heading">
              لا يوجد طلاب في حلقتك
            </h3>
            <p className="text-[13px] text-[#9CA3AF] mt-1">
              سيظهر طلابك هنا عند إسنادهم إلى حلقتك من قبل الإدارة
            </p>
          </div>
        ) : (
          <>
            {/* ─── Pending Students (Priority Sorted) ─── */}
            {sortedPendingStudents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#0C5C5E]"><StarIcon /></span>
                  <h3 className="text-[17px] font-bold font-heading text-[#1F2937]">
                    بانتظار الرصد
                  </h3>
                  <span className="bg-[#0C5C5E]/10 text-[#0C5C5E] text-[12px] font-bold px-2.5 py-0.5 rounded-md">
                    {sortedPendingStudents.length}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedPendingStudents.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student}
                        selectedDateKey={selectedDateKey}
                        todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate}
                        lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys}
                        attendanceRate={item.attendanceRate}
                        totalReports={item.totalReports}
                        absentCount={item.absentCount}
                        lastBehaviorGrade={item.lastBehaviorGrade}
                        recentDots={item.recentDots}
                        recentDotLabels={last7DayLabels}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── Completed Students ─── */}
            {completedStudents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <h3 className="text-[17px] font-bold font-heading text-[#1F2937]">
                    تم الرصد
                  </h3>
                  <span className="bg-[#059669]/10 text-[#059669] text-[12px] font-bold px-2.5 py-0.5 rounded-md">
                    {completedStudents.length}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {completedStudents.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student}
                        selectedDateKey={selectedDateKey}
                        todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate}
                        lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys}
                        attendanceRate={item.attendanceRate}
                        totalReports={item.totalReports}
                        absentCount={item.absentCount}
                        lastBehaviorGrade={item.lastBehaviorGrade}
                        recentDots={item.recentDots}
                        recentDotLabels={last7DayLabels}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
