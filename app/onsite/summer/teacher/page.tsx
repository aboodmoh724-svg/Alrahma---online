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

  // Fetch teacher's assigned students & all summerReports from 2026-07-09
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
        },
        orderBy: { dateKey: "desc" },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // Calculate missing dates for all students from 2026-07-09
  const allWorkingDates = availableDates.map((d) => d.dateKey);

  const studentsWithMeta = students.map((st) => {
    const reportForSelectedDate = st.summerReports.find((r) => r.dateKey === selectedDateKey) || null;
    const lastPresentReport = st.summerReports.find((r) => r.status === "PRESENT") || null;

    const recordedKeys = new Set(st.summerReports.map((r) => r.dateKey));
    const missingDateKeys = allWorkingDates.filter((dKey) => !recordedKeys.has(dKey));

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
    };
  });

  const filledCount = studentsWithMeta.filter((s) => Boolean(s.reportForSelectedDate)).length;
  const remainingCount = students.length - filledCount;
  const completionPercentage =
    students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;

  // Split students into pending and completed
  const pendingStudents = studentsWithMeta.filter((s) => !s.reportForSelectedDate);
  const completedStudents = studentsWithMeta.filter((s) => Boolean(s.reportForSelectedDate));

  // Smart greeting based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "صباح الخير" : "مساء الخير";
  const firstName = teacher.fullName?.split(" ")[0] || "أستاذ";

  // Smart status message
  const getStatusMessage = () => {
    if (completionPercentage === 100) return "ما شاء الله، تم إكمال رصد جميع الطلاب لهذا اليوم";
    if (remainingCount === 1) return "بقي طالب واحد فقط لإكمال الرصد";
    if (remainingCount === 2) return "بقي طالبان فقط لإكمال الرصد";
    if (remainingCount <= 10) return `بقي ${remainingCount} طلاب لإكمال الرصد`;
    return `لديك ${remainingCount} طالباً بانتظار الرصد`;
  };

  // Estimated time remaining (approx ~1.5 mins per student)
  const estimatedMinutes = Math.ceil(remainingCount * 1.5);

  // Islamic star SVG icon for section headers
  const StarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
    </svg>
  );

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
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6 space-y-5">

        {/* ─── Smart Greeting Card ─── */}
        <div className="bg-[#EDF5F4] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          {/* Native Quran Education Vector Illustration */}
          <div className="hidden lg:block absolute left-28 -bottom-4 opacity-[0.45] pointer-events-none">
            <QuranEducationIllustration className="w-36 h-36" />
          </div>

          <div className="relative z-10 flex-1">
            <p className="text-[13px] font-medium text-[#0C5C5E]/70 mb-1">
              السلام عليكم ورحمة الله
            </p>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#0C5C5E] leading-tight">
              {timeGreeting} أستاذ {firstName}
            </h2>
            <p className="text-[14px] text-[#374151] mt-2 font-medium">
              {getStatusMessage()}
            </p>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0C5C5E]/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <span className="block text-[11px] text-[#6B7280]">إجمالي الطلاب</span>
                  <span className="block text-[15px] font-bold text-[#1F2937]">{students.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <span className="block text-[11px] text-[#6B7280]">تم الرصد</span>
                  <span className="block text-[15px] font-bold text-[#059669]">{filledCount}</span>
                </div>
              </div>

              {remainingCount > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#6B7280]">بانتظار</span>
                      <span className="block text-[15px] font-bold text-[#D97706]">{remainingCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0C5C5E]/10 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#6B7280]">الوقت المتوقع</span>
                      <span className="block text-[15px] font-bold text-[#0C5C5E]">~{estimatedMinutes} دقيقة</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#6B7280]">الحالة</span>
                    <span className="block text-[15px] font-bold text-[#059669]">مكتمل 100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Circular Progress */}
          <div className="shrink-0 relative z-10">
            <CircularProgress
              percentage={completionPercentage}
              size={110}
              strokeWidth={8}
              filledCount={filledCount}
              totalCount={students.length}
            />
          </div>
        </div>

        {/* ─── Horizontal Day Picker ─── */}
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

        {/* ─── Past Date Alert ─── */}
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

        {/* ─── All Students Completed Message ─── */}
        {completionPercentage === 100 && students.length > 0 && (
          <div className="rounded-xl bg-[#D1FAE5] border border-[#A7F3D0] p-5 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p className="text-[15px] font-bold text-[#065F46] font-heading">
              بارك الله فيك، تم إكمال رصد جميع الطلاب لهذا اليوم
            </p>
            <p className="text-[13px] text-[#065F46]/70 mt-1">
              «خيركم من تعلم القرآن وعلمه»
            </p>
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
            {/* ─── Pending Students ─── */}
            {pendingStudents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#0C5C5E]"><StarIcon /></span>
                  <h3 className="text-[17px] font-bold font-heading text-[#1F2937]">
                    بانتظار الرصد
                  </h3>
                  <span className="bg-[#D97706]/10 text-[#D97706] text-[12px] font-bold px-2.5 py-0.5 rounded-md">
                    {pendingStudents.length}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {pendingStudents.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student}
                        selectedDateKey={selectedDateKey}
                        todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate}
                        lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys}
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
