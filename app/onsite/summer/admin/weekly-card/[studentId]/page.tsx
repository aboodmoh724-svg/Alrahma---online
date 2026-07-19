import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintCardButton from "@/components/annual-reports/PrintCardButton";
import { getIstanbulDateKey } from "@/lib/school-day";

type CardPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

// Icons definitions
const ICON_PATHS: Record<string, string> = {
  book: '<path d="M12 7v13"/><path d="M3 5.6C5 5.1 9 5 12 7c3-2 7-1.9 9-1.4V19c-2-.5-6-.6-9 1.4-3-2-7-1.9-9-1.4z"/>',
  eye: '<path d="M2 12s3.5-6.6 10-6.6S22 12 22 12s-3.5 6.6-10 6.6S2 12 2 12z"/><circle cx="12" cy="12" r="2.4"/>',
  heart: '<path d="M12 20s-6.6-4.2-9.1-8.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9.1 4.7C18.6 15.8 12 20 12 20z"/>',
  star: '<path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.9 6.9 19.6l1-5.7-4.1-4 5.7-.8z"/>',
  check: '<circle cx="12" cy="12" r="8.4"/><path d="M8.4 12.3l2.4 2.3 4.7-4.9"/>',
  medal: '<circle cx="12" cy="14.5" r="5.4"/><path d="M8.8 9.8 6.2 3.4M15.2 9.8 17.8 3.4"/><path d="m12 11.9 1 2 2.1.2-1.6 1.5.5 2.1L12 17.5l-2 1.2.5-2.1-1.6-1.5 2.1-.2z"/>',
  pen: '<path d="m4 20 4-1 9.6-9.6a2 2 0 0 0-2.8-2.8L5 16.2 4 20z"/><path d="M14.5 6.6 17.4 9.5"/>',
  mosque: '<path d="M4 21h16M5.5 21v-7m13 7v-7"/><path d="M6 14a6 6 0 0 1 12 0"/><path d="M12 8V5.2m0 0a1.4 1.4 0 1 0 0-.1z"/>',
  quote: '<path d="M10 7.5C7.5 7.5 6 9.3 6 11.5S7.5 15 9.6 15c0 2.3-1.6 3.4-3.4 3.9M20 7.5c-2.5 0-4 1.8-4 4s1.5 3.5 3.6 3.5c0 2.3-1.6 3.4-3.4 3.9"/>',
};

function Icon({ name, size = 24, stroke = 1.6, color = "currentColor", className }: { name: string; size?: number; stroke?: number; color?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || "" }}
    />
  );
}

// Custom modern background pattern instead of the traditional old motifs
function summerGridPattern(hexColor: string, opacity = 0.04) {
  const col = encodeURIComponent(hexColor);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='${col}' stroke-width='0.8' opacity='${opacity}'><circle cx='40' cy='40' r='18'/><path d='M0 40h80M40 0v80'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function getSummerWeekRange(now = new Date()) {
  const day = now.getDay();
  let tuesdayOffset = 0;
  let sundayOffset = 0;

  if (day === 0) { // Sunday
    tuesdayOffset = -5;
    sundayOffset = 0;
  } else if (day === 1) { // Monday
    tuesdayOffset = -6;
    sundayOffset = -1;
  } else { // Tuesday to Saturday
    tuesdayOffset = -(day - 2);
    sundayOffset = 6 - (day - 1);
  }

  const tuesdayDate = new Date(now);
  tuesdayDate.setDate(now.getDate() + tuesdayOffset);
  
  const sundayDate = new Date(now);
  sundayDate.setDate(now.getDate() + sundayOffset);

  return {
    tuesday: tuesdayDate,
    sunday: sundayDate
  };
}

export default async function SummerWeeklyCardPage({ params }: CardPageProps) {
  const resolvedParams = await params;
  const studentId = resolvedParams.studentId;

  // Fetch student info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      circle: { select: { name: true } },
      teacher: { select: { fullName: true } },
    },
  });

  if (!student || student.studyMode !== "ONSITE_SUMMER") {
    notFound();
  }

  // Calculate current week range
  const { tuesday, sunday } = getSummerWeekRange(new Date());
  
  const weekdaysArabic = [
    { label: "الثلاثاء", key: "" },
    { label: "الأربعاء", key: "" },
    { label: "الخميس", key: "" },
    { label: "الجمعة", key: "" },
    { label: "السبت", key: "" },
    { label: "الأحد", key: "" },
  ];

  const dateKeys: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(tuesday);
    d.setDate(tuesday.getDate() + i);
    const key = getIstanbulDateKey(d);
    dateKeys.push(key);
    weekdaysArabic[i].key = key;
  }

  // Fetch reports
  const reports = await prisma.summerReport.findMany({
    where: {
      studentId: student.id,
      dateKey: { in: dateKeys },
    },
  });

  const reportsMap = new Map<string, typeof reports[0]>();
  reports.forEach((r) => reportsMap.set(r.dateKey, r));

  const presentDays = reports.filter((r) => r.status === "PRESENT");
  const attendanceCount = presentDays.length;

  let averageBehavior = 10;
  if (presentDays.length > 0) {
    const totalBehavior = presentDays.reduce((acc, r) => acc + (r.behaviorGrade || 10), 0);
    averageBehavior = Math.round((totalBehavior / presentDays.length) * 10) / 10;
  }

  // Noor Al-Bayan stats
  let totalHwSubmitted = 0;
  let totalHwAssigned = 0;
  let averageHwGrade = 10;
  let averageParticipation = 10;

  if (student.summerGroup !== "QURAN" && presentDays.length > 0) {
    const hwDays = presentDays.filter((r) => r.noorHomework !== null);
    totalHwAssigned = hwDays.length;
    totalHwSubmitted = hwDays.filter((r) => r.noorHomework === true).length;

    const hwGradeDays = presentDays.filter((r) => r.noorHomeworkGrade !== null);
    if (hwGradeDays.length > 0) {
      const sumHw = hwGradeDays.reduce((acc, r) => acc + (r.noorHomeworkGrade || 10), 0);
      averageHwGrade = Math.round((sumHw / hwGradeDays.length) * 10) / 10;
    }

    const partDays = presentDays.filter((r) => r.noorParticipation !== null);
    if (partDays.length > 0) {
      const sumPart = partDays.reduce((acc, r) => acc + (r.noorParticipation || 10), 0);
      averageParticipation = Math.round((sumPart / partDays.length) * 10) / 10;
    }
  }

  const isQuran = student.summerGroup === "QURAN";
  let achievementsList: string[] = [];
  let behaviorNotesList: string[] = [];

  presentDays.forEach((r) => {
    if (isQuran) {
      if (r.quranNew?.trim()) achievementsList.push(`حفظ جديد: ${r.quranNew.trim()}`);
      if (r.quranRevision?.trim()) achievementsList.push(`مراجعة: ${r.quranRevision.trim()}`);
    } else {
      if (r.noorLearned?.trim()) achievementsList.push(r.noorLearned.trim());
    }
    if (r.behaviorNotes?.trim()) {
      behaviorNotesList.push(r.behaviorNotes.trim());
    }
  });

  achievementsList = Array.from(new Set(achievementsList)).slice(0, 5);
  const compiledBehaviorNotes = behaviorNotesList.length > 0 
    ? behaviorNotesList.join(" | ")
    : "سلوك متميز وتفاعل نشط طوال الأسبوع الدراسي، بارك الله في حرصه.";

  let finalRating = "ممتاز";
  const ratingScore = isQuran ? averageBehavior : (averageBehavior + averageParticipation + (totalHwAssigned > 0 ? (totalHwSubmitted / totalHwAssigned) * 10 : 10)) / 3;
  if (ratingScore >= 9) finalRating = "ممتاز";
  else if (ratingScore >= 8) finalRating = "جيد جداً";
  else if (ratingScore >= 6.5) finalRating = "جيد";
  else finalRating = "مقبول";

  // Summer Breeze Colors (Teal / Amber Sunburst theme)
  const Theme = {
    bgGrad: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 50%, #fffbeb 100%)",
    tealDark: "#0f766e",
    tealLight: "#0d9488",
    tealGlow: "#ccfbf1",
    amberDark: "#b45309",
    amberLight: "#d97706",
    amberGlow: "#fef3c7",
    cardBg: "rgba(255, 255, 255, 0.88)",
    borderSoft: "rgba(13, 148, 136, 0.16)",
    textDark: "#0f172a",
    textSoft: "#334155",
    textMute: "#64748b",
  };

  const studentFirstName = student.fullName.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-[#eaf4f4] py-10 px-4 flex flex-col items-center">
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=El+Messiri:wght@400;500;600;700&family=Outfit:wght@300;400;600;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Action Bar */}
      <div className="w-full max-w-[760px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/summer/admin"
          className="rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all shadow-md hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
          style={{ background: Theme.tealDark }}
        >
          ← العودة للوحة الإدارة
        </Link>
        <PrintCardButton />
      </div>

      {/* The Styled Card */}
      <div
        className="w-full max-w-[760px] min-h-[1280px] relative overflow-hidden shadow-[0_24px_50px_-12px_rgba(15,118,110,0.15)] p-12 flex flex-col justify-between print-card rounded-[32px] border"
        style={{
          background: Theme.bgGrad,
          backgroundImage: `${summerGridPattern(Theme.tealLight, 0.04)}, ${Theme.bgGrad}`,
          borderColor: "rgba(13,148,136,0.12)",
          boxSizing: "border-box",
        }}
        dir="rtl"
      >
        {/* Floating gradient light blobs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-teal-300 opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-200 opacity-35 blur-3xl pointer-events-none" />

        {/* Double stylish borders */}
        <div className="absolute inset-5 pointer-events-none rounded-[24px]" style={{ border: `2px dashed ${Theme.tealLight}`, opacity: 0.15 }} />
        <div className="absolute inset-7 pointer-events-none rounded-[20px]" style={{ border: `1px solid ${Theme.amberLight}`, opacity: 0.25 }} />

        {/* Card Body */}
        <div className="relative z-10 flex flex-col flex-grow">
          
          {/* Header Branding */}
          <div className="flex justify-between items-center mt-2 pb-4" style={{ borderBottom: `1px solid rgba(13, 148, 136, 0.1)` }}>
            <div className="flex items-center gap-3">
              <div className="w-[50px] h-[50px] rounded-2xl bg-white shadow-sm flex items-center justify-center border border-teal-50">
                <img src="/logo.png" alt="Logo" className="w-[36px] h-[36px] object-contain" />
              </div>
              <div className="text-right">
                <div className="text-sm font-black tracking-wide" style={{ color: Theme.tealDark, fontFamily: '"El Messiri", serif' }}>
                  تحفيظ الرحمة للقرآن الكريم
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: Theme.amberDark, fontFamily: '"Outfit", sans-serif' }}>
                  Summer Quran Course
                </div>
              </div>
            </div>
            
            <div className="rounded-full px-4 py-1.5 text-[10px] font-black tracking-wider shadow-sm border uppercase"
                 style={{ background: Theme.tealGlow, color: Theme.tealDark, borderColor: "rgba(13, 148, 136, 0.15)", fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              {isQuran ? "مسار تحفيظ القرآن" : "مسار نور البيان"}
            </div>
          </div>

          {/* Title Area */}
          <div className="text-center mt-8">
            <h1 className="text-4xl font-black tracking-tight leading-tight" style={{ color: Theme.textDark, fontFamily: '"El Messiri", serif' }}>
              {student.fullName}
            </h1>
            
            <div className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-2xl border" 
                 style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(13, 148, 136, 0.08)" }}>
              <span className="text-xs font-bold text-slate-500">حلقة: <span style={{ color: Theme.tealDark }}>{student.circle?.name || "عام"}</span></span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-xs font-bold text-slate-500">المعلم: <span style={{ color: Theme.tealDark }}>{student.teacher?.fullName || "غير محدد"}</span></span>
            </div>
          </div>

          {/* Ribbon Award section - Redesigned as dynamic summer sunburst badge */}
          <div className="flex flex-col items-center mt-8 mb-6">
            <div className="relative flex items-center justify-center">
              {/* Spinning star glowing background */}
              <div className="absolute w-[110px] h-[110px] rounded-full animate-pulse blur-md" style={{ background: `radial-gradient(circle, ${Theme.amberGlow} 30%, transparent 70%)` }} />
              
              <div
                className="relative z-10 w-[94px] h-[94px] rounded-full flex items-center justify-center shadow-lg border-2"
                style={{
                  background: `linear-gradient(135deg, ${Theme.amberLight}, ${Theme.amberDark})`,
                  borderColor: '#fff',
                }}
              >
                <div
                  className="w-[82px] h-[82px] rounded-full flex flex-col items-center justify-center gap-0.5"
                  style={{ background: Theme.cardBg }}
                >
                  <Icon name="medal" size={20} color={Theme.amberLight} stroke={1.8} />
                  <span className="font-black text-lg leading-none" style={{ color: Theme.tealDark, fontFamily: '"El Messiri", serif' }}>
                    {finalRating}
                  </span>
                  <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: Theme.textMute }}>تقدير الأسبوع</span>
                </div>
              </div>
            </div>
            
            <div className="text-[11px] font-bold mt-3 text-slate-400" style={{ fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              التقرير الأسبوعي للفترة: {tuesday.toLocaleDateString("ar-EG", { month: "short", day: "numeric" })} - {sunday.toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          {/* Weekly Attendance Grid */}
          <div className="mt-6">
            <div className="flex items-center gap-2 pb-2.5 mb-4" style={{ borderBottom: `1px solid rgba(13, 148, 136, 0.08)` }}>
              <Icon name="check" size={18} color={Theme.tealLight} stroke={1.8} />
              <span className="text-sm font-black" style={{ color: Theme.tealDark, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                رصد حضور وانضباط الطالب اليومي
              </span>
            </div>
            
            <div className="grid grid-cols-6 gap-3">
              {weekdaysArabic.map((day) => {
                const report = reportsMap.get(day.key);
                const isReported = !!report;
                const isPresent = report?.status === "PRESENT";

                return (
                  <div
                    key={day.label}
                    className="rounded-2xl py-3 text-center border-2 flex flex-col justify-between h-22 transition-all shadow-sm"
                    style={{
                      background: Theme.cardBg,
                      borderColor: isReported ? (isPresent ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)") : "rgba(13, 148, 136, 0.06)",
                    }}
                  >
                    <span className="text-[11px] font-black text-slate-500">{day.label}</span>
                    {isReported ? (
                      isPresent ? (
                        <div className="flex flex-col items-center">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black mb-1">✓</span>
                          <span className="text-[10px] font-black text-emerald-700">حاضر</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-[10px] font-black mb-1">✗</span>
                          <span className="text-[10px] font-black text-rose-700">غائب</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-slate-300 mb-1">—</span>
                        <span className="text-[9px] font-bold text-slate-400">لا يوجد حلقة</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="rounded-3xl p-4 text-center border shadow-sm transition-all hover:scale-[1.02]" style={{ background: Theme.cardBg, borderColor: Theme.borderSoft }}>
              <div className="w-9 h-9 rounded-2xl mx-auto flex items-center justify-center mb-1.5" style={{ background: Theme.tealGlow }}>
                <Icon name="check" size={16} color={Theme.tealLight} />
              </div>
              <span className="text-3xl font-black block" style={{ color: Theme.textDark, fontFamily: '"Outfit", sans-serif' }}>{attendanceCount}</span>
              <p className="text-[10px] font-black text-slate-400 mt-1">أيام حضور الحلقة</p>
            </div>
            
            <div className="rounded-3xl p-4 text-center border shadow-sm transition-all hover:scale-[1.02]" style={{ background: Theme.cardBg, borderColor: Theme.borderSoft }}>
              <div className="w-9 h-9 rounded-2xl mx-auto flex items-center justify-center mb-1.5" style={{ background: Theme.amberGlow }}>
                <Icon name="heart" size={16} color={Theme.amberLight} />
              </div>
              <span className="text-3xl font-black block" style={{ color: Theme.textDark, fontFamily: '"Outfit", sans-serif' }}>{averageBehavior}</span>
              <p className="text-[10px] font-black text-slate-400 mt-1">متوسط درجة السلوك</p>
            </div>
            
            <div className="rounded-3xl p-4 text-center border shadow-sm transition-all hover:scale-[1.02]" style={{ background: Theme.cardBg, borderColor: Theme.borderSoft }}>
              <div className="w-9 h-9 rounded-2xl mx-auto flex items-center justify-center mb-1.5" style={{ background: Theme.tealGlow }}>
                <Icon name="book" size={16} color={Theme.tealLight} />
              </div>
              {isQuran ? (
                <>
                  <span className="text-3xl font-black block" style={{ color: Theme.textDark, fontFamily: '"Outfit", sans-serif' }}>
                    {presentDays.filter(r => r.quranNew?.trim()).length}
                  </span>
                  <p className="text-[10px] font-black text-slate-400 mt-1">مواضع حفظ جديدة</p>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black block" style={{ color: Theme.textDark, fontFamily: '"Outfit", sans-serif' }}>
                    {totalHwAssigned > 0 ? `${totalHwSubmitted}/${totalHwAssigned}` : "—"}
                  </span>
                  <p className="text-[10px] font-black text-slate-400 mt-1">تسليم الواجبات</p>
                </>
              )}
            </div>
          </div>

          {/* Academic Achievements (حصاد الأسبوع) */}
          <div className="mt-6">
            <div className="flex items-center gap-2 pb-2.5 mb-3.5" style={{ borderBottom: `1px solid rgba(13, 148, 136, 0.08)` }}>
              <Icon name="book" size={18} color={Theme.tealLight} stroke={1.8} />
              <span className="text-sm font-black" style={{ color: Theme.tealDark, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                ما أنجزه الطالب من تحصيل دراسي هذا الأسبوع
              </span>
            </div>

            {achievementsList.length === 0 ? (
              <div className="rounded-3xl p-6 text-center text-slate-400 border border-dashed text-xs" style={{ background: Theme.cardBg, borderColor: Theme.tealLight }}>
                لم يسجل المعلم إنجازات حفظ خلال الأسبوع الحالي لغياب رصد الحضور.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {achievementsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-2xl p-3.5 border transition-all hover:bg-white"
                    style={{ background: Theme.cardBg, borderColor: Theme.borderSoft }}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: Theme.tealGlow }}>
                      <span className="text-[10px] font-black" style={{ color: Theme.tealDark }}>{idx + 1}</span>
                    </div>
                    <span className="text-xs font-bold leading-normal" style={{ color: Theme.textSoft }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks Section */}
          <div className="mt-6">
            <div className="flex items-center gap-2 pb-2.5 mb-3.5" style={{ borderBottom: `1px solid rgba(13, 148, 136, 0.08)` }}>
              <Icon name="heart" size={18} color={Theme.tealLight} stroke={1.8} />
              <span className="text-sm font-black" style={{ color: Theme.tealDark, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                الملاحظات السلوكية والتوجيهية
              </span>
            </div>
            <div
              className="rounded-3xl p-4 border border-dashed flex items-start gap-3"
              style={{ borderColor: Theme.amberLight, background: "rgba(217, 119, 6, 0.02)" }}
            >
              <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="star" size={14} color={Theme.amberLight} />
              </div>
              <p className="text-xs leading-relaxed font-bold" style={{ color: Theme.textSoft }}>
                {compiledBehaviorNotes}
              </p>
            </div>
          </div>

          {/* Teacher Message Banner */}
          <div className="mt-6 relative rounded-3xl p-5 text-white shadow-md overflow-hidden" 
               style={{ background: `linear-gradient(135deg, ${Theme.tealDark}, ${Theme.tealLight})` }}>
            <div className="absolute top-2 left-3 opacity-10">
              <Icon name="quote" size={48} color="#fff" />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black tracking-widest uppercase block mb-1" style={{ color: Theme.amberGlow }}>
                رسالة معلم الحلقة الأسبوعية
              </span>
              <p className="text-xs leading-relaxed" style={{ color: "#eefcf9" }}>
                نثمّن عالياً شراكتكم الكريمة ومتابعتكم المستمرة لأداء الطالب المتميز *{studentFirstName}* بالمنزل، مما يساهم بشكل فعال في ترسيخ المعاني وتحفيز التحصيل لديه. بارك الله في خطاكم.
              </p>
            </div>
          </div>

        </div>

        {/* Space Spacer */}
        <div className="flex-grow min-h-[20px]" />

        {/* Footer calligraphic frame & blessing */}
        <div
          className="text-center rounded-3xl p-5 border shadow-sm relative overflow-hidden"
          style={{ background: Theme.cardBg, borderColor: Theme.borderSoft }}
        >
          {/* Centering gold ornament */}
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <span className="w-12 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${Theme.amberLight})` }} />
            <Icon name="star" size={12} color={Theme.amberLight} />
            <span className="w-12 h-[1px]" style={{ background: `linear-gradient(270deg, transparent, ${Theme.amberLight})` }} />
          </div>

          {/* Poem Line */}
          <div className="my-2 flex justify-center items-baseline gap-6 flex-wrap text-xl font-black leading-normal" style={{ color: Theme.tealDark, fontFamily: '"Amiri", serif' }}>
            <span>هَنِيئًا مَرِيئًا وَالِدَاكَ عَلَيْهِمَا</span>
            <span>مَلَابِسُ أَنْوَارٍ مِنَ التَّاجِ وَالْحُلَلِ</span>
          </div>

          <p className="max-w-[560px] mx-auto text-xs leading-relaxed font-bold mt-2" style={{ color: Theme.textSoft }}>
            حفظ الله الطالب العزيز *{studentFirstName}* ورزقه التوفيق وعمل القرآن الكريم وجعله قرة عين لوالديه وذخراً للأمة.
          </p>
        </div>

      </div>

      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            border-radius: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
