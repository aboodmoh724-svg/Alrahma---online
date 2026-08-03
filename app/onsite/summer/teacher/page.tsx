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

  // ── Dates ──
  const availableDates: Array<{ dateKey: string; label: string; isToday: boolean; dayName: string; dayNum: string }> = [];
  const today = new Date();
  const startDate = new Date("2026-07-09");
  const cur = new Date(startDate);
  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const shortNames = ["أح", "اث", "ثل", "أر", "خم", "جم", "سب"];
  while (cur <= today) {
    const dow = getLocalDayOfWeek(cur);
    if (dow !== 1) {
      const ds = toLocalDateKey(cur);
      const isT = ds === todayStr;
      availableDates.push({ dateKey: ds, label: isT ? `اليوم - ${dayNames[dow]} (${ds})` : `${dayNames[dow]} (${ds})`, isToday: isT, dayName: shortNames[dow], dayNum: ds.slice(8) });
    }
    cur.setDate(cur.getDate() + 1);
  }
  availableDates.reverse();
  const recentDays = availableDates.slice(0, 7);

  // ── Data ──
  const students = await prisma.student.findMany({
    where: { isActive: true, studyMode: "ONSITE_SUMMER", OR: [{ teacherId: teacher.id }, { studentCode: "7500" }] },
    include: {
      circle: { select: { name: true } },
      summerReports: {
        where: { dateKey: { gte: "2026-07-09" } },
        select: { id: true, status: true, dateKey: true, quranNew: true, quranRevision: true, quranTaqeen: true, noorLearned: true, behaviorGrade: true, createdAt: true },
        orderBy: { dateKey: "desc" },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // ── Compute ──
  const allDates = availableDates.map((d) => d.dateKey);
  const last7 = recentDays.slice(0, 7).map((d) => d.dateKey).reverse();
  const last7Labels = recentDays.slice(0, 7).map((d) => d.dayName).reverse();

  // Previous working day (for "absent yesterday" detection)
  const prevWorkingDay = allDates.find((d) => d < todayStr) || null;

  const meta = students.map((st) => {
    const repToday = st.summerReports.find((r) => r.dateKey === selectedDateKey) || null;
    const lastPresent = st.summerReports.find((r) => r.status === "PRESENT") || null;
    const recorded = new Set(st.summerReports.map((r) => r.dateKey));
    const missing = allDates.filter((d) => !recorded.has(d));
    const present = st.summerReports.filter((r) => r.status === "PRESENT");
    const absent = st.summerReports.filter((r) => r.status === "ABSENT");
    const total = st.summerReports.length;
    const rate = total > 0 ? Math.round((present.length / total) * 100) : 0;
    const behav = present.length > 0 ? present[0].behaviorGrade : null;
    const dots = last7.map((dk) => {
      if (dk > todayStr) return "future" as const;
      const r = st.summerReports.find((x) => x.dateKey === dk);
      if (!r) return "missing" as const;
      return r.status === "PRESENT" ? ("present" as const) : ("absent" as const);
    });

    // Smart Priority
    const wasAbsentYesterday = prevWorkingDay ? st.summerReports.some((r) => r.dateKey === prevWorkingDay && r.status === "ABSENT") : false;
    const isDone = Boolean(repToday);
    let priority: "urgent" | "normal" | "done";
    const reasons: string[] = [];

    if (isDone) {
      priority = "done";
    } else if (missing.length > 0 || wasAbsentYesterday || absent.length >= 3) {
      priority = "urgent";
      if (missing.length > 0) reasons.push(`${missing.length} ${missing.length <= 2 ? "يوم ناقص" : "أيام ناقصة"}`);
      if (wasAbsentYesterday) reasons.push("غائب أمس");
      if (absent.length >= 3 && !wasAbsentYesterday) reasons.push("غياب متكرر");
    } else {
      priority = "normal";
    }

    return {
      student: { id: st.id, fullName: st.fullName, studentCode: st.studentCode, summerGroup: st.summerGroup },
      reportForSelectedDate: repToday,
      lastPresentReport: lastPresent ? { dateKey: lastPresent.dateKey, quranNew: lastPresent.quranNew, quranRevision: lastPresent.quranRevision, noorLearned: lastPresent.noorLearned } : null,
      missingDateKeys: missing, attendanceRate: rate, totalReports: total, absentCount: absent.length, lastBehaviorGrade: behav, recentDots: dots,
      priority, priorityReasons: reasons,
    };
  });

  const filled = meta.filter((s) => Boolean(s.reportForSelectedDate)).length;
  const remaining = students.length - filled;
  const pct = students.length > 0 ? Math.round((filled / students.length) * 100) : 0;
  const absentToday = meta.filter((s) => s.reportForSelectedDate?.status === "ABSENT").length;
  const totalMissing = meta.reduce((s, m) => s + m.missingDateKeys.length, 0);

  // Activity (with actual timestamps)
  const activity = students
    .flatMap((st) => st.summerReports.map((r) => ({ name: st.fullName, status: r.status as string, createdAt: r.createdAt })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Timeline
  const timeline = recentDays.slice(0, 7).reverse().map((day) => {
    const future = day.dateKey > todayStr;
    const isToday = day.dateKey === todayStr;
    const done = students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === day.dateKey));
    return { ...day, status: future ? "future" : isToday ? (done ? "complete" : "current") : done ? "complete" : "incomplete" };
  });

  // Performance
  const completedDays = allDates.filter((dk) => dk < todayStr && students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === dk)));
  const durations: number[] = [];
  for (const dk of completedDays) {
    const times = students.flatMap((st) => st.summerReports.filter((r) => r.dateKey === dk)).map((r) => new Date(r.createdAt).getTime());
    if (times.length < 2) continue;
    const dur = Math.round((Math.max(...times) - Math.min(...times)) / 60000);
    if (dur > 0 && dur < 300) durations.push(dur);
  }
  const avgMin = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  let streak = 0;
  for (const dk of allDates) {
    if (dk > todayStr) continue;
    if (dk === todayStr) { if (pct === 100) streak++; continue; }
    if (students.length > 0 && students.every((st) => st.summerReports.some((r) => r.dateKey === dk))) streak++;
    else break;
  }

  // Sort: urgent → normal → done
  const urgentStudents = meta.filter((s) => s.priority === "urgent").sort((a, b) => b.missingDateKeys.length - a.missingDateKeys.length || a.student.fullName.localeCompare(b.student.fullName, "ar"));
  const normalStudents = meta.filter((s) => s.priority === "normal").sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "ar"));
  const doneStudents = meta.filter((s) => s.priority === "done");

  const pendingAll = [...urgentStudents, ...normalStudents];
  const firstPending = pendingAll[0] || null;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : "مساء الخير";
  const name1 = teacher.fullName?.split(" ")[0] || "أستاذ";
  const gamif = (() => {
    if (students.length === 0 || pct === 0) return null;
    if (pct === 100) return "✅ تم الإكمال";
    if (pct >= 90) return `🏆 بقي ${remaining === 1 ? "طالب واحد" : remaining}!`;
    if (pct >= 61) return `🎉 بقي ${remaining}`;
    if (pct >= 31) return `⚡ أكثر من النصف`;
    return `🔥 ${filled}/${students.length}`;
  })();
  const barColor = pct >= 90 ? "#059669" : pct >= 61 ? "#0C5C5E" : pct >= 31 ? "#D97706" : "#DC2626";

  const stats = [
    { label: "إجمالي", value: students.length, color: "#0C5C5E" },
    { label: "تم الرصد", value: filled, color: "#059669" },
    { label: "المتبقي", value: remaining, color: remaining > 0 ? "#0C5C5E" : "#9CA3AF" },
    { label: "غائبون", value: absentToday, color: absentToday > 0 ? "#DC2626" : "#9CA3AF" },
    { label: "أيام ناقصة", value: totalMissing, color: totalMissing > 0 ? "#D97706" : "#9CA3AF" },
  ];

  // Format time for activity
  const fmtTime = (d: Date) => {
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <div className="min-h-screen pb-10 bg-[#FAFAF9]">
      {/* Header */}
      <header className="bg-[#0C5C5E] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex items-center justify-between h-[52px]">
            <div className="flex items-center gap-2">
              <Image src="/images/alrahma_tahfeez_logo.png" alt="تحفيظ الرحمة" width={30} height={30} className="h-[30px] w-[30px] rounded-lg object-contain" />
              <h1 className="text-[13px] font-bold font-heading">تحفيظ الرحمة</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/60 hidden sm:block">{teacher.fullName}</span>
              <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold border border-white/20">{teacher.fullName?.charAt(0) || "أ"}</div>
              <LogoutButton redirectUrl="/onsite/summer" className="h-7 w-7 rounded-lg bg-transparent hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors duration-150" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-3 space-y-2.5">

        {/* ── 1. Compact Hero ── */}
        <div className="bg-[#EDF5F4] rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[14px] sm:text-[16px] font-bold font-heading text-[#0C5C5E] truncate">{greeting} أستاذ {name1}</h2>
              {gamif && <span className="text-[11px] text-[#374151] font-semibold">{gamif}</span>}
            </div>
            {students.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/70 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-150 ease-out" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }} />
                </div>
                <span className="text-[13px] font-extrabold text-[#0C5C5E] tabular-nums shrink-0" dir="ltr">{pct}%</span>
              </div>
            )}
          </div>
          <CircularProgress percentage={pct} size={64} strokeWidth={5} filledCount={filled} totalCount={students.length} />
        </div>

        {/* ── 2. Day Picker ── */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {recentDays.map((day) => {
            const sel = day.dateKey === selectedDateKey;
            return (
              <Link key={day.dateKey} href={day.isToday ? "/onsite/summer/teacher" : `/onsite/summer/teacher?dateKey=${day.dateKey}`}
                className={`shrink-0 flex flex-col items-center justify-center w-[42px] h-[44px] rounded-lg transition-all duration-150 border ${
                  sel ? "bg-[#0C5C5E] text-white border-[#0C5C5E]" : "bg-white text-[#374151] border-[#E5E3DF] hover:border-[#0C5C5E]/30"
                }`}>
                <span className={`text-[9px] font-medium ${sel ? "text-white/60" : "text-[#9CA3AF]"}`}>{day.dayName}</span>
                <span className={`text-[13px] font-bold ${sel ? "text-white" : "text-[#1F2937]"}`}>{day.dayNum}</span>
                {day.isToday && <div className={`w-1 h-1 rounded-full ${sel ? "bg-white" : "bg-[#0C5C5E]"}`} />}
              </Link>
            );
          })}
          {availableDates.length > 7 && (
            <form method="GET" className="shrink-0 flex items-center gap-1">
              <select name="dateKey" defaultValue="" className="h-[44px] rounded-lg border border-[#E5E3DF] bg-white px-2 text-[10px] text-[#9CA3AF] outline-none focus:border-[#0C5C5E] cursor-pointer">
                <option value="">سابق</option>
                {availableDates.slice(7).map((d) => <option key={d.dateKey} value={d.dateKey}>{d.label}</option>)}
              </select>
              <button type="submit" className="h-[44px] rounded-lg bg-[#0C5C5E] px-2 text-white hover:bg-[#0A4D4F] transition-colors duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </form>
          )}
        </div>

        {isPastDate && (
          <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#92400E]">⚠️ رصد ليوم سابق: {selectedDateKey}</span>
            <Link href="/onsite/summer/teacher" className="font-semibold text-[#0C5C5E] hover:underline">العودة لليوم</Link>
          </div>
        )}

        {/* ── 3. Stats ── */}
        {students.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-lg border border-[#E5E3DF] p-2 text-center" style={{ borderTopWidth: '2px', borderTopColor: s.color }}>
                <p className="text-[9px] font-medium text-[#9CA3AF]">{s.label}</p>
                <p className="text-[18px] font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── 4. Completion ── */}
        {pct === 100 && students.length > 0 && (
          <div className="rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-2.5 text-center">
            <p className="text-[12px] font-bold text-[#065F46]">بارك الله فيك — تم إكمال رصد جميع الطلاب ✅</p>
          </div>
        )}

        {/* ── 5. Students ── */}
        {meta.length === 0 ? (
          <div className="rounded-xl bg-white border border-dashed border-[#E5E3DF] p-8 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p className="text-[12px] font-bold text-[#374151]">لا يوجد طلاب في حلقتك</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">سيظهر طلابك هنا عند إسنادهم من قبل الإدارة</p>
          </div>
        ) : (
          <>
            {/* Pending: urgent first, then normal */}
            {pendingAll.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-bold font-heading text-[#1F2937]">بانتظار الرصد</h3>
                    <span className="bg-[#0C5C5E]/10 text-[#0C5C5E] text-[10px] font-bold px-1.5 py-0.5 rounded">{pendingAll.length}</span>
                    {urgentStudents.length > 0 && (
                      <span className="bg-[#FEE2E2] text-[#DC2626] text-[9px] font-bold px-1.5 py-0.5 rounded">{urgentStudents.length} عاجل</span>
                    )}
                  </div>
                  {firstPending && (
                    <Link href={`/onsite/summer/teacher/reports/${firstPending.student.id}?dateKey=${selectedDateKey}`}
                      className="rounded-lg bg-[#0C5C5E] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0A4D4F] transition-colors duration-150 shadow-sm">
                      ⚡ رصد أسرع طالب
                    </Link>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pendingAll.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 25}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student} selectedDateKey={selectedDateKey} todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate} lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys} attendanceRate={item.attendanceRate}
                        totalReports={item.totalReports} absentCount={item.absentCount}
                        lastBehaviorGrade={item.lastBehaviorGrade} recentDots={item.recentDots} recentDotLabels={last7Labels}
                        priority={item.priority} priorityReasons={item.priorityReasons}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {doneStudents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[13px] font-bold font-heading text-[#1F2937]">تم الرصد</h3>
                  <span className="bg-[#059669]/10 text-[#059669] text-[10px] font-bold px-1.5 py-0.5 rounded">{doneStudents.length}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {doneStudents.map((item, i) => (
                    <div key={item.student.id} style={{ animationDelay: `${i * 15}ms` }} className="animate-fadeIn">
                      <TeacherStudentCard
                        student={item.student} selectedDateKey={selectedDateKey} todayStr={todayStr}
                        reportForSelectedDate={item.reportForSelectedDate} lastPresentReport={item.lastPresentReport}
                        missingDateKeys={item.missingDateKeys} attendanceRate={item.attendanceRate}
                        totalReports={item.totalReports} absentCount={item.absentCount}
                        lastBehaviorGrade={item.lastBehaviorGrade} recentDots={item.recentDots} recentDotLabels={last7Labels}
                        priority={item.priority} priorityReasons={item.priorityReasons}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── 6. Subtle footer: Timeline + Activity ── */}
        {students.length > 0 && (
          <div className="grid gap-2 lg:grid-cols-2 pt-1">
            {/* Timeline */}
            <div className="bg-white/70 rounded-lg border border-[#E5E3DF]/60 p-2.5">
              <p className="text-[9px] font-semibold text-[#9CA3AF] mb-1.5">تقدم الأسبوع</p>
              <div className="flex items-center gap-1 mb-1.5">
                {timeline.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-px">
                    <div className={`w-full h-5 rounded flex items-center justify-center text-[8px] font-bold ${
                      d.status === "complete" ? "bg-[#059669] text-white" : d.status === "current" ? "bg-[#0C5C5E] text-white" : d.status === "incomplete" ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#F3F4F6] text-[#D1D5DB]"
                    }`}>{d.status === "complete" ? "✔" : d.status === "current" ? "◯" : d.status === "incomplete" ? "✗" : "—"}</div>
                    <span className="text-[7px] text-[#D1D5DB]">{d.dayName}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[9px] text-[#9CA3AF]">
                {avgMin !== null && <span>⏱ متوسط <strong className="text-[#6B7280]">{avgMin}د</strong></span>}
                {streak >= 2 && <span>🔥 <strong className="text-[#6B7280]">{streak}</strong> أيام متتالية</span>}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white/70 rounded-lg border border-[#E5E3DF]/60 p-2.5">
              <p className="text-[9px] font-semibold text-[#9CA3AF] mb-1.5">النشاط الأخير</p>
              {activity.length === 0 ? (
                <p className="text-[10px] text-[#D1D5DB] py-2 text-center">ابدأ برصد أول طالب ✏️</p>
              ) : (
                <div className="border-r-2 border-[#E5E3DF] pr-3 mr-1 space-y-0">
                  {activity.map((a, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -right-[17px] top-0.5 w-2 h-2 rounded-full border-2 border-white ${a.status === "ABSENT" ? "bg-[#DC2626]" : "bg-[#059669]"}`} />
                      <div className="pb-2">
                        <span className="text-[9px] text-[#9CA3AF] font-mono" dir="ltr">{fmtTime(new Date(a.createdAt))}</span>
                        <p className="text-[10px] text-[#6B7280] leading-tight">
                          {a.status === "ABSENT" ? "❌" : "✅"}{" "}
                          {a.status === "ABSENT" ? `تسجيل غياب ${a.name}` : `تقرير ${a.name}`}
                        </p>
                      </div>
                      {i < activity.length - 1 && <div className="border-b border-[#F3F4F6] mb-1" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
