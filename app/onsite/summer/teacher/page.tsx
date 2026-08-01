import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTodayDateKey, getLocalDayOfWeek, toLocalDateKey } from "@/lib/date-utils";



import LogoutButton from "@/components/LogoutButton";

import TeacherStudentCard from "@/components/teacher/TeacherStudentCard";

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
  const availableDates: Array<{ dateKey: string; label: string; isToday: boolean }> = [];
  const today = new Date();
  const startDate = new Date("2026-07-09");

  const curr = new Date(startDate);
  while (curr <= today) {
    const dayOfWeek = getLocalDayOfWeek(curr); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat

    // Skip Mondays (day 1) as Monday is a holiday in the Summer course
    if (dayOfWeek !== 1) {
      const dateStr = toLocalDateKey(curr);
      const isTodayDate = dateStr === todayStr;

      const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const dayLabel = `${dayNames[dayOfWeek]} (${dateStr})`;

      availableDates.push({
        dateKey: dateStr,
        label: isTodayDate ? `اليوم - ${dayLabel}` : dayLabel,
        isToday: isTodayDate,
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  // Reverse so newest date comes first
  availableDates.reverse();

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
  const completionPercentage =
    students.length > 0 ? Math.round((filledCount / students.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a2e23] dir-rtl font-sans pb-16" dir="rtl">
      {/* 🕌 1. Full-Width Dark Emerald Header */}
      <header className="relative bg-[#0c5c5e] text-white shadow-lg overflow-hidden border-b border-[#d4a853]/30">
        {/* Subtle Geometric Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4a853_1.5px,transparent_1.5px)] [background-size:14px_14px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-2 shadow-md ring-2 ring-[#d4a853]/60">
              <Image
                src="/images/summer_quran_logo_v2.jpg"
                alt="شعار الدورة الصيفية"
                width={52}
                height={52}
                className="h-13 w-13 rounded-xl object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-ruqaa text-[#f2d18a] tracking-wide">
                لوحة المعلم - الدورة الصيفية
              </h1>
              <p className="text-xs font-semibold text-emerald-100/80">
                إدارة تحفيظ القرآن الكريم | رصد التقارير اليومية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[#0a4d4f] px-4 py-2 border border-[#d4a853]/30 shadow-inner shrink-0">
              <div className="h-9 w-9 rounded-full bg-[#d4a853] flex items-center justify-center font-black text-sm text-[#0c5c5e] shadow-xs">
                {teacher.fullName ? teacher.fullName.charAt(0) : "أ"}
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-white font-serif">
                  أستاذ: {teacher.fullName}
                </span>
                <span className="block text-[10px] text-emerald-200/90 font-mono">
                  اليوم: {todayStr}
                </span>
              </div>
            </div>

            <LogoutButton redirectUrl="/onsite/summer" />
          </div>
        </div>
      </header>

      {/* 🏛️ 2. Main Workspace Content Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 space-y-6">
        {/* 🌟 Islamic Motivational Calligraphy Card */}
        <div className="rounded-3xl border border-[#d4a853]/30 bg-white p-6 shadow-sm text-center space-y-3 relative overflow-hidden dir-rtl" dir="rtl">
          <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[#d4a853]/10 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="inline-block rounded-full bg-[#faf8f4] border border-[#d4a853]/30 px-4 py-1 text-xs font-bold text-[#d4a853] font-serif shadow-2xs">
              ✨ بشارة لحَفَظَةِ كِتَابِ اللَّهِ ✨
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0c5c5e] font-ruqaa leading-snug tracking-wide">
              «وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ ... وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي»
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 font-serif max-w-2xl mx-auto">
              هَنِيئاً لَكُمْ هَذِهِ الرِّسَالَةَ المُبَارَكَةَ وَهَذَا الشَّرَفَ العَظِيمَ فِي خِدْمَةِ كِتَابِ اللَّهِ تَعَالَى
            </p>
          </div>
        </div>

        {/* 📅 Date Selector Bar */}
        <div className="rounded-2xl border border-[#d4a853]/25 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#faf8f4] border border-[#d4a853]/30 flex items-center justify-center text-xl shrink-0">
              📅
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0c5c5e] font-serif">
                تحديد تاريخ التقرير المراد تعبئته / استعراضه:
              </h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">
                {selectedDateKey === todayStr
                  ? "أنت تعاين تقارير اليوم الحالي (الافتراضي)."
                  : `أنت تعاين تقارير يوم سابق: ${selectedDateKey}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              href="/onsite/summer/teacher"
              className={`rounded-xl px-3.5 py-2 text-xs font-bold font-serif transition border ${
                selectedDateKey === todayStr
                  ? "bg-[#0c5c5e] text-white border-[#0c5c5e] shadow-xs"
                  : "bg-[#faf8f4] text-gray-700 hover:bg-gray-100 border-[#d4a853]/30"
              }`}
            >
              اليوم الحالي 🌟
            </Link>

            <form method="GET" className="flex items-center gap-2">
              <select
                name="dateKey"
                defaultValue={selectedDateKey}
                className="rounded-xl border border-[#d4a853]/40 bg-[#faf8f4] px-3.5 py-2 text-xs font-bold text-[#0c5c5e] outline-none font-mono focus:ring-2 focus:ring-[#0c5c5e]/20"
              >
                {availableDates.map((d) => (
                  <option key={d.dateKey} value={d.dateKey}>
                    {d.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl bg-[#0c5c5e] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a4d4f] transition font-serif shadow-xs"
              >
                انتقال ➔
              </button>
            </form>
          </div>
        </div>

        {/* Past Date Alert Banner */}
        {isPastDate && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
              <span>⚠️ تنبيه: تقوم برصد/تعديل تقرير ليوم سابق:</span>
              <span className="bg-amber-200/80 px-2.5 py-0.5 rounded-md font-mono text-amber-950">
                {selectedDateKey}
              </span>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 shrink-0 font-serif">
              تتطلب موافقة واعتماد الإدارة بعد الحفظ 📩
            </span>
          </div>
        )}

        {/* Top Progress & Completion Summary Banner */}
        <div className="rounded-2xl border border-[#d4a853]/25 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0c5c5e] font-serif">
              نسبة إنجاز تقارير الحلقة ({selectedDateKey})
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              تم رصد <b className="text-[#0c5c5e] font-serif text-sm">{filledCount}</b> من إجمالي{" "}
              <b className="text-[#d4a853] font-serif text-sm">{students.length}</b> طالباً بحلقتك
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-600">التقدم الفعلي</span>
              <span className="text-[#0c5c5e] font-serif text-base">{completionPercentage}%</span>
            </div>
            <div className="h-3.5 w-full rounded-full bg-[#faf8f4] overflow-hidden border border-[#d4a853]/20 p-0.5">
              <div
                className="h-full rounded-full bg-[#0c5c5e] transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 📋 Students List Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#0c5c5e] font-serif">
              قائمة طلابك في الحلقة ({students.length} طالباً)
            </h3>
          </div>

          {studentsWithMeta.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d4a853]/30 bg-white p-10 text-center text-sm font-bold text-gray-500">
              لا يوجد طلاب مسجلين في حلقتك حتى الآن.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {studentsWithMeta.map((item) => (
                <TeacherStudentCard
                  key={item.student.id}
                  student={item.student}
                  selectedDateKey={selectedDateKey}
                  todayStr={todayStr}
                  reportForSelectedDate={item.reportForSelectedDate}
                  lastPresentReport={item.lastPresentReport}
                  missingDateKeys={item.missingDateKeys}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
