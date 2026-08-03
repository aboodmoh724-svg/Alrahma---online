import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTodayDateKey, getLocalDayOfWeek, toLocalDateKey } from "@/lib/date-utils";

import LogoutButton from "@/components/LogoutButton";
import TeacherStudentCard from "@/components/teacher/TeacherStudentCard";
import CircularProgress from "@/components/ui/CircularProgress";

type DashboardPageProps = {
  searchParams?: Promise<{ dateKey?: string }>;
};

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
  if (!userId) redirect("/onsite/summer/teacher/login");

  const teacher = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, fullName: true, role: true },
  });
  if (!teacher) redirect("/onsite/summer/teacher/login");
  if (teacher.role === "ADMIN") redirect("/onsite/summer/admin");

  const sParams = (await searchParams) || {};
  const todayStr = getTodayDateKey();
  const selectedDateKey = sParams.dateKey && /^\d{4}-\d{2}-\d{2}$/.test(sParams.dateKey) ? sParams.dateKey : todayStr;
  const isPastDate = selectedDateKey < todayStr;

  // ── Date generation ──
  const availableDates: Array<{ dateKey: string; label: string; isToday: boolean; dayName: string; dayNum: string }> = [];
  const today = new Date();
  const startDate = new Date("2026-07-09");
  const curr = new Date(startDate);
  while (curr <= today) {
    const dayOfWeek = getLocalDayOfWeek(curr);
    if (dayOfWeek !== 1) {
      const dateStr = toLocalDateKey(curr);
      const isTodayDate = dateStr === todayStr;
      const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const shortDayNames = ["أح", "اث", "ثل", "أر", "خم", "جم", "سب"];
      availableDates.push({
        dateKey: dateStr,
        label: isTodayDate ? `اليوم - ${dayNames[dayOfWeek]} (${dateStr})` : `${dayNames[dayOfWeek]} (${dateStr})`,
        isToday: isTodayDate,
        dayName: shortDayNames[dayOfWeek],
        dayNum: dateStr.slice(8),
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  availableDates.reverse();
  const recentDays = availableDates.slice(0, 7);

  // ── Data fetch ──
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      studyMode: "ONSITE_SUMMER",
      OR: [{ teacherId: teacher.id }, { studentCode: "7500" }],
    },
    include: {
      circle: { select: { name: true } },
      summerReports: {
        where: { dateKey: { gte: "2026-07-09" } },
        select: {
          id: true, status: true, dateKey: true,
          quranNew: true, quranRevision: true, quranTaqeen: true, noorLearned: true,
          behaviorGrade: true, createdAt: true,
        },
        orderBy: { dateKey: "desc" },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // ── Computations ──
  const allWorkingDates = availableDates.map((d) => d.dateKey);
  const last7Days = recentDays.slice(0, 7).map((d) => d.dateKey).reverse();
  const last7DayLabels = recentDays.slice(0, 7).map((d) => d.dayName).reverse();

  const studentsWithMeta = students.map((st) => {
    const reportForSelectedDate = st.summerReports.find((r) => r.dateKey === selectedDateKey) || null;
    const lastPresentReport = st.summerReports.find((r) => r.status === "PRESENT") || null;
    const recordedKeys = new Set(st.summerReports.map((r) => r.dateKey));
    const missingDateKeys = allWorkingDates.filter((dKey) => !recordedKeys.has(dKey));
    const presentReports = st.summerReports.filter((r) => r.status === "PRESENT");
    const absentReports = st.summerReports.filter((r) => r.status === "ABSENT");
    const totalReports = st.summerReports.length;
    const attendanceRate = totalReports > 0 ? Math.round((presentReports.length / totalReports) * 100) : 0;
    const lastBehaviorGrade = presentReports.length > 0 ? presentReports[0].behaviorGrade : null;
    const recentDots = last7Days.map((dateKey) => {
      if (dateKey > todayStr) return "future" as const;
      const report = st.summerReports.find((r) => r.dateKey === dateKey);
      if (!report) return "missing" as const;
      return report.status === "PRESENT" ? ("present" as const) : ("absent" as const);
    });

    return {
      student: { id: st.id, fullName: st.fullName, studentCode: st.studentCode, summerGroup: st.summerGroup, circleName: st.circle?.name },
      reportForSelectedDate,
      lastPresentReport: lastPresentReport ? { dateKey: lastPresentReport.dateKey, quranNew: lastPresentReport.quranNew, quranRevision: lastPresentReport.quranRevision, noorLearned: lastPresentReport.noorLearned } : null,
      missingDateKeys, attendanceRate, totalReports, absentCount: absentReports.length, lastBehaviorGrade, recentDots,
    };
  });

  const filledCount = studentsWithMeta.filter((s) => Boolean(s.reportForSelectedDate)).length;
  const remainingCount = students.length - filledCount;
  const completionPercentage = students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;
  const absentTodayCount = studentsWithMeta.filter((s) => s.reportForSelectedDate?.status === "ABSENT").length;
  const totalMissingDays = studentsWithMeta.reduce((sum, s) => sum + s.missingDateKeys.length, 0);
  const estimatedMinutes = Math.ceil(remainingCount * 1.5);

  // Recent activity
  const recentActivity = students
    .flatMap((st) => st.summerReports.map((r) => ({ studentName: st.fullName, status: r.status as string, dateKey: r.dateKey, createdAt: r.createdAt })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Progress timeline
  const progressTimeline = recentDays.slice(0, 7).reverse().map((day) => {
    const isFuture = day.dateKey > todayStr;
    const isToday = day.dateKey === todayStr;
    const allRecorded = students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === day.dateKey));
    let status: "complete" | "current" | "incomplete" | "future";
    if (isFuture) status = "future";
    else if (isToday) status = allRecorded ? "complete" : "current";
    else status = allRecorded ? "complete" : "incomplete";
    return { ...day, status };
  });

  // Teacher performance
  const completedDayKeys = allWorkingDates.filter((dk) => dk < todayStr && students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === dk)));
  const dayDurations: Array<{ durationMinutes: number; dayName: string }> = [];
  for (const dk of completedDayKeys) {
    const times = students.flatMap((st) => st.summerReports.filter((r) => r.dateKey === dk)).map((r) => new Date(r.createdAt).getTime());
    if (times.length < 2) continue;
    const dur = Math.round((Math.max(...times) - Math.min(...times)) / 60000);
    if (dur > 0 && dur < 300) {
      const dow = getLocalDayOfWeek(new Date(dk));
      dayDurations.push({ durationMinutes: dur, dayName: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][dow] });
    }
  }
  const avgMin = dayDurations.length > 0 ? Math.round(dayDurations.reduce((s, d) => s + d.durationMinutes, 0) / dayDurations.length) : null;

  let streak = 0;
  for (const dk of allWorkingDates) {
    if (dk > todayStr) continue;
    if (dk === todayStr) { if (completionPercentage === 100) streak++; continue; }
    if (students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === dk))) streak++;
    else break;
  }

  // Priority sorting
  const pendingStudents = [...studentsWithMeta.filter((s) => !s.reportForSelectedDate)].sort((a, b) => {
    if (a.missingDateKeys.length !== b.missingDateKeys.length) return b.missingDateKeys.length - a.missingDateKeys.length;
    return a.student.fullName.localeCompare(b.student.fullName, "ar");
  });
  const completedStudents = studentsWithMeta.filter((s) => Boolean(s.reportForSelectedDate));

  // Gamification
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "صباح الخير" : "مساء الخير";
  const firstName = teacher.fullName?.split(" ")[0] || "أستاذ";

  const gamification = (() => {
    if (students.length === 0) return null;
    if (completionPercentage === 100) return "✅ تم إكمال رصد جميع الطلاب";
    if (completionPercentage >= 90) { const r = remainingCount === 1 ? "طالب واحد" : remainingCount === 2 ? "طالبان" : `${remainingCount} طلاب`; return `🏆 بقي ${r} فقط!`; }
    if (completionPercentage >= 61) return `🎉 أحسنت! بقي ${remainingCount} — أقل من ${estimatedMinutes} دقائق`;
    if (completionPercentage >= 31) return `⚡ أكثر من النصف! بقي ${remainingCount}`;
    if (completionPercentage >= 1) return `🔥 أنجزت ${filledCount} من ${students.length}`;
    return null;
  })();

  const progressColor = completionPercentage >= 90 ? "#059669" : completionPercentage >= 61 ? "#0C5C5E" : completionPercentage >= 31 ? "#D97706" : "#DC2626";

  const firstPending = pendingStudents[0] || null;

  // ── Stats definition ──
  const stats = [
    { label: "إجمالي", value: students.length, color: "#0C5C5E" },
    { label: "تم الرصد", value: filledCount, color: "#059669" },
    { label: "المتبقي", value: remainingCount, color: remainingCount > 0 ? "#0C5C5E" : "#9CA3AF" },
    { label: "غائبون", value: absentTodayCount, color: absentTodayCount > 0 ? "#DC2626" : "#9CA3AF" },
    { label: "أيام ناقصة", value: totalMissingDays, color: totalMissingDays > 0 ? "#D97706" : "#9CA3AF" },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* ── HEADER ── */}
      <header className="bg-[#0C5C5E] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <Image src="/images/alrahma_tahfeez_logo.png" alt="تحفيظ الرحمة" width={34} height={34} className="h-[34px] w-[34px] rounded-lg object-contain" />
              <div>
                <h1 className="text-[14px] font-bold font-heading text-white leading-tight">تحفيظ الرحمة</h1>
                <p className="text-[10px] font-medium text-white/50 hidden sm:block">الدورة الصيفية</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-left hidden sm:block">
                <span className="block text-[12px] font-semibold text-white/90">{teacher.fullName}</span>
                <span className="block text-[10px] text-white/40">{todayStr}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-[13px] font-bold text-white border border-white/20">
                {teacher.fullName ? teacher.fullName.charAt(0) : "أ"}
              </div>
              <LogoutButton redirectUrl="/onsite/summer" className="h-8 w-8 rounded-lg bg-transparent hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition" />
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #0C5C5E, #1A8A8D, #0C5C5E)' }} />
      </header>

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-4 space-y-3">

        {/* ── Compact Hero ── */}
        <div className="bg-[#EDF5F4] rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] sm:text-[19px] font-bold font-heading text-[#0C5C5E] leading-tight truncate">
              {timeGreeting} أستاذ {firstName}
            </h2>
            {gamification && (
              <p className="text-[13px] text-[#374151] font-semibold mt-1">{gamification}</p>
            )}
            {students.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="flex-1 h-2.5 bg-white/80 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-200 ease-out" style={{ width: `${Math.max(completionPercentage, 2)}%`, backgroundColor: progressColor }} />
                </div>
                <span className="text-[13px] font-bold text-[#0C5C5E] shrink-0" dir="ltr">{completionPercentage}%</span>
              </div>
            )}
          </div>
          <div className="shrink-0">
            <CircularProgress percentage={completionPercentage} size={76} strokeWidth={6} filledCount={filledCount} totalCount={students.length} />
          </div>
        </div>

        {/* ── Day Picker ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <span className="text-[12px] font-semibold text-[#9CA3AF] shrink-0 ml-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-0.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          {recentDays.map((day) => {
            const isSelected = day.dateKey === selectedDateKey;
            return (
              <Link key={day.dateKey} href={day.isToday ? "/onsite/summer/teacher" : `/onsite/summer/teacher?dateKey=${day.dateKey}`}
                className={`shrink-0 flex flex-col items-center justify-center w-[46px] h-[50px] rounded-lg transition-all duration-200 border ${
                  isSelected ? "bg-[#0C5C5E] text-white border-[#0C5C5E] shadow-sm" : "bg-white text-[#374151] border-[#E5E3DF] hover:border-[#0C5C5E]/30"
                }`}>
                <span className={`text-[10px] font-medium ${isSelected ? "text-white/60" : "text-[#9CA3AF]"}`}>{day.dayName}</span>
                <span className={`text-[15px] font-bold ${isSelected ? "text-white" : "text-[#1F2937]"}`}>{day.dayNum}</span>
                {day.isToday && <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-[#0C5C5E]"}`} />}
              </Link>
            );
          })}
          {availableDates.length > 7 && (
            <form method="GET" className="shrink-0 flex items-center gap-1">
              <select name="dateKey" defaultValue="" className="h-[50px] rounded-lg border border-[#E5E3DF] bg-white px-2 text-[11px] font-semibold text-[#9CA3AF] outline-none focus:border-[#0C5C5E] cursor-pointer">
                <option value="">سابق</option>
                {availableDates.slice(7).map((d) => <option key={d.dateKey} value={d.dateKey}>{d.label}</option>)}
              </select>
              <button type="submit" className="h-[50px] rounded-lg bg-[#0C5C5E] px-2.5 text-white text-[11px] hover:bg-[#0A4D4F] transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </form>
          )}
        </div>

        {/* ── Past Date Alert ── */}
        {isPastDate && (
          <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-3 py-2.5 flex items-center justify-between gap-2 text-[12px]">
            <span className="font-bold text-[#92400E]">⚠️ رصد ليوم سابق: {selectedDateKey} — يتطلب موافقة الإدارة</span>
            <Link href="/onsite/summer/teacher" className="shrink-0 font-semibold text-[#0C5C5E] hover:underline">العودة لليوم</Link>
          </div>
        )}

        {/* ── Stats Row (5 cards) ── */}
        {students.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-lg border border-[#E5E3DF] p-2.5 text-center" style={{ borderTopWidth: '2px', borderTopColor: s.color }}>
                <p className="text-[10px] font-medium text-[#9CA3AF] leading-tight">{s.label}</p>
                <p className="text-[20px] font-bold mt-0.5 leading-none" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Compact Info Row: Focus + Activity ── */}
        {students.length > 0 && (
          <div className="grid gap-2 lg:grid-cols-2">
            {/* Today's Focus */}
            <div className="bg-white rounded-lg border border-[#E5E3DF] p-3">
              <p className="text-[11px] font-bold text-[#6B7280] mb-2">تقدم الأسبوع</p>
              <div className="flex items-center gap-1 mb-2.5">
                {progressTimeline.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className={`w-full h-6 rounded flex items-center justify-center text-[9px] font-bold ${
                      day.status === "complete" ? "bg-[#059669] text-white"
                        : day.status === "current" ? "bg-[#0C5C5E] text-white ring-1 ring-[#0C5C5E]/30"
                        : day.status === "incomplete" ? "bg-[#FEE2E2] text-[#DC2626]"
                        : "bg-[#F3F4F6] text-[#D1D5DB]"
                    }`}>
                      {day.status === "complete" ? "✔" : day.status === "current" ? "◯" : day.status === "incomplete" ? "✗" : "—"}
                    </div>
                    <span className={`text-[9px] ${day.status === "current" ? "text-[#0C5C5E] font-bold" : "text-[#D1D5DB]"}`}>{day.dayName}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                  {avgMin !== null && <span>⏱ متوسط <strong className="text-[#374151]">{avgMin}د</strong></span>}
                  {streak >= 2 && <span>🔥 <strong className="text-[#374151]">{streak}</strong> أيام</span>}
                </div>
                {firstPending && (
                  <Link href={`/onsite/summer/teacher/reports/${firstPending.student.id}?dateKey=${selectedDateKey}`}
                    className="rounded-md bg-[#0C5C5E] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#0A4D4F] transition shadow-xs">
                    ⚡ رصد أسرع طالب
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-[#E5E3DF] p-3">
              <p className="text-[11px] font-bold text-[#6B7280] mb-2">النشاط الأخير</p>
              {recentActivity.length === 0 ? (
                <p className="text-[11px] text-[#D1D5DB] py-3 text-center">لا يوجد نشاط بعد</p>
              ) : (
                <div className="space-y-0">
                  {recentActivity.map((a, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[12px] text-[#374151] font-medium truncate">
                          <span className={a.status === "ABSENT" ? "text-[#DC2626]" : "text-[#059669]"}>
                            {a.status === "ABSENT" ? "❌" : "✅"}
                          </span>
                          {" "}{a.status === "ABSENT" ? `غياب ${a.studentName}` : `تقرير ${a.studentName}`}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF] shrink-0 mr-2">
                          {getRelativeTime(new Date(a.createdAt))}
                        </span>
                      </div>
                      {i < recentActivity.length - 1 && <div className="border-b border-[#F3F4F6]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Student Sections ── */}
        {studentsWithMeta.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E3DF] bg-white p-10 text-center">
            <h3 className="text-[14px] font-bold text-[#374151] font-heading">لا يوجد طلاب في حلقتك</h3>
            <p className="text-[12px] text-[#9CA3AF] mt-1">سيظهر طلابك هنا عند إسنادهم إلى حلقتك من قبل الإدارة</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pendingStudents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[15px] font-bold font-heading text-[#1F2937]">بانتظار الرصد</h3>
                  <span className="bg-[#0C5C5E]/10 text-[#0C5C5E] text-[11px] font-bold px-2 py-0.5 rounded">{pendingStudents.length}</span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {pendingStudents.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student} selectedDateKey={selectedDateKey} todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate} lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys} attendanceRate={item.attendanceRate}
                        totalReports={item.totalReports} absentCount={item.absentCount}
                        lastBehaviorGrade={item.lastBehaviorGrade} recentDots={item.recentDots} recentDotLabels={last7DayLabels}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completedStudents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[15px] font-bold font-heading text-[#1F2937]">تم الرصد</h3>
                  <span className="bg-[#059669]/10 text-[#059669] text-[11px] font-bold px-2 py-0.5 rounded">{completedStudents.length}</span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {completedStudents.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student} selectedDateKey={selectedDateKey} todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate} lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys} attendanceRate={item.attendanceRate}
                        totalReports={item.totalReports} absentCount={item.absentCount}
                        lastBehaviorGrade={item.lastBehaviorGrade} recentDots={item.recentDots} recentDotLabels={last7DayLabels}
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
