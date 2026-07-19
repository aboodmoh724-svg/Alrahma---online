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

function khatamBg(hex: string, opacity = 0.06) {
  const col = encodeURIComponent(hex);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='${col}' stroke-width='1' opacity='${opacity}'><rect x='20' y='20' width='24' height='24'/><rect x='20' y='20' width='24' height='24' transform='rotate(45 32 32)'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Function to calculate Tuesday-Sunday range for the current week
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
  
  // Generate date list (Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
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

  // Fetch reports for these dates
  const reports = await prisma.summerReport.findMany({
    where: {
      studentId: student.id,
      dateKey: { in: dateKeys },
    },
  });

  const reportsMap = new Map<string, typeof reports[0]>();
  reports.forEach((r) => reportsMap.set(r.dateKey, r));

  // Compute stats
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

  // Compile achievements text
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

  // Unique elements for clean display
  achievementsList = Array.from(new Set(achievementsList)).slice(0, 5);
  const compiledBehaviorNotes = behaviorNotesList.length > 0 
    ? behaviorNotesList.join(" | ")
    : "سلوك متميز والتزام تام بالآداب الصفية ولله الحمد.";

  // Rating label based on behavior and achievements
  let finalRating = "ممتاز";
  const ratingScore = isQuran ? averageBehavior : (averageBehavior + averageParticipation + (totalHwAssigned > 0 ? (totalHwSubmitted / totalHwAssigned) * 10 : 10)) / 3;
  if (ratingScore >= 9) finalRating = "ممتاز";
  else if (ratingScore >= 8) finalRating = "جيد جداً";
  else if (ratingScore >= 6.5) finalRating = "جيد";
  else finalRating = "مقبول";

  const C = {
    ink: "#1c2d31",
    inkSoft: "#2f484f",
    gold: "#bd8f2d",
    goldHi: "#d8bf83",
    cream: "#fffbf2",
    paper: "#fffefb",
    line: "#e6ddca",
    mute: "#5a646e",
  };

  const studentFirstName = student.fullName.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-[#f3f0e6] py-10 px-4 flex flex-col items-center">
      {/* Google fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=El+Messiri:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Admin Action Bar */}
      <div className="w-full max-w-[760px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/summer/admin"
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition shadow-sm"
          style={{ background: C.ink }}
        >
          ← العودة للوحة الدورة الصيفية
        </Link>
        <PrintCardButton />
      </div>

      {/* Certificate Weekly Card */}
      <div
        className="w-full max-w-[760px] min-h-[1280px] relative overflow-hidden shadow-2xl p-[36px_40px_36px] flex flex-col justify-between print-card rounded-3xl"
        style={{
          background: C.cream,
          backgroundImage: khatamBg(C.gold, 0.05),
          backgroundSize: "60px 60px",
          boxSizing: "border-box",
        }}
        dir="rtl"
      >
        {/* Double gold borders */}
        <div className="absolute inset-4 pointer-events-none rounded-2xl" style={{ border: `1px solid ${C.gold}`, opacity: 0.4 }} />
        <div className="absolute inset-[20px] pointer-events-none rounded-2xl" style={{ border: `1px solid ${C.gold}`, opacity: 0.18 }} />

        {/* Content */}
        <div className="relative flex flex-col flex-grow">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-2 mt-2">
            <img src="/logo.png" alt="شعار التحفيظ" className="w-[54px] h-[54px] object-contain" />
            <div className="text-lg font-black tracking-wide" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              تحفيظ الرحمة للقرآن الكريم
            </div>
          </div>

          {/* Card Header Title */}
          <div className="text-center mt-4">
            <div className="flex items-center gap-2.5 justify-center mb-3">
              <span className="w-6 h-px opacity-60" style={{ background: C.gold }} />
              <Icon name="star" size={12} color={C.gold} stroke={1.4} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gold, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                البطاقة التلخيصية الأسبوعية
              </span>
              <Icon name="star" size={12} color={C.gold} stroke={1.4} />
              <span className="w-6 h-px opacity-60" style={{ background: C.gold }} />
            </div>

            <h1 className="text-3xl font-black leading-tight" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              {student.fullName}
            </h1>
            
            <div className="flex justify-center gap-4 mt-3 text-xs flex-wrap font-bold" style={{ color: C.inkSoft, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              <span><span style={{ color: C.mute }}>المعلم: </span>{student.teacher?.fullName || "غير معين"}</span>
              <span style={{ color: C.line }}>|</span>
              <span><span style={{ color: C.mute }}>الحلقة: </span>{student.circle?.name || "بدون حلقة"}</span>
              <span style={{ color: C.line }}>|</span>
              <span>
                <span style={{ color: C.mute }}>الفترة: </span>
                {tuesday.toLocaleDateString("ar-EG", { month: "numeric", day: "numeric" })} - {sunday.toLocaleDateString("ar-EG", { month: "numeric", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Ribbon Award Badge */}
          <div className="flex justify-center mt-5 mb-2 relative">
            <div className="absolute top-12 flex gap-5 z-0">
              <span className="w-3.5 h-8 transform -rotate-6" style={{ background: C.gold, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }} />
              <span className="w-3.5 h-8 transform rotate-6" style={{ background: C.goldHi, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }} />
            </div>
            <div
              className="relative z-10 w-[84px] h-[84px] rounded-full flex items-center justify-center shadow-md"
              style={{
                background: `conic-gradient(${C.goldHi}, ${C.gold}, ${C.goldHi}, ${C.gold}, ${C.goldHi})`,
              }}
            >
              <div
                className="w-[70px] h-[70px] rounded-full flex flex-col items-center justify-center gap-0.5"
                style={{ background: C.ink, border: `2px solid ${C.goldHi}` }}
              >
                <Icon name="star" size={12} color={C.goldHi} stroke={1.4} />
                <span className="font-bold text-white text-base leading-none" style={{ fontFamily: '"El Messiri", serif' }}>
                  {finalRating}
                </span>
                <span className="text-[8px] tracking-wider" style={{ color: C.goldHi }}>تقدير الأسبوع</span>
              </div>
            </div>
          </div>

          {/* Weekly Attendance Grid */}
          <div className="mt-4">
            <div className="flex items-center gap-2 pb-2.5 mb-3.5" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Icon name="check" size={16} color={C.gold} stroke={1.6} />
              <span className="text-sm font-bold" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                جدول رصد حضور وغياب الأسبوع
              </span>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {weekdaysArabic.map((day) => {
                const report = reportsMap.get(day.key);
                const isReported = !!report;
                const isPresent = report?.status === "PRESENT";

                return (
                  <div
                    key={day.label}
                    className="rounded-xl py-3 text-center border flex flex-col justify-between h-20"
                    style={{
                      background: C.paper,
                      borderColor: isReported ? (isPresent ? "#a7f3d0" : "#fca5a5") : C.line,
                    }}
                  >
                    <span className="text-xs font-bold text-slate-500">{day.label}</span>
                    <span
                      className={`text-sm font-black mt-1.5 ${
                        isReported ? (isPresent ? "text-green-700" : "text-red-700") : "text-slate-400"
                      }`}
                    >
                      {isReported ? (isPresent ? "🟢 حضور" : "🔴 غياب") : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Stats Block */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-2xl p-3.5 text-center border" style={{ background: C.paper, borderColor: C.line }}>
              <span className="text-3xl font-black" style={{ color: C.ink }}>{attendanceCount}</span>
              <p className="text-[11px] font-bold mt-1 text-slate-400">أيام الحضور</p>
            </div>
            <div className="rounded-2xl p-3.5 text-center border" style={{ background: C.paper, borderColor: C.line }}>
              <span className="text-3xl font-black" style={{ color: C.ink }}>{averageBehavior}</span>
              <p className="text-[11px] font-bold mt-1 text-slate-400">تقييم السلوك والأدب</p>
            </div>
            <div className="rounded-2xl p-3.5 text-center border" style={{ background: C.paper, borderColor: C.line }}>
              {isQuran ? (
                <>
                  <span className="text-3xl font-black" style={{ color: C.ink }}>{presentDays.filter(r => r.quranNew?.trim()).length}</span>
                  <p className="text-[11px] font-bold mt-1 text-slate-400">مقررات الحفظ المنجزة</p>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black" style={{ color: C.ink }}>{totalHwAssigned > 0 ? `${totalHwSubmitted}/${totalHwAssigned}` : "—"}</span>
                  <p className="text-[11px] font-bold mt-1 text-slate-400">تسليم الواجبات</p>
                </>
              )}
            </div>
          </div>

          {/* Academic Achievements (حصاد الأسبوع الدراسي) */}
          <div className="mt-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Icon name="book" size={16} color={C.gold} stroke={1.6} />
              <span className="text-sm font-bold" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                حصاد التحصيل العلمي هذا الأسبوع
              </span>
            </div>

            {achievementsList.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-slate-400 border border-dashed border-[#e6ddca] text-xs">
                لم يتم تسجيل إنجازات دراسية هذا الأسبوع لعدم رصد الحضور.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {achievementsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl p-3 border bg-[#fffdfa]"
                    style={{ borderColor: C.line }}
                  >
                    <Icon name="star" size={14} color={C.gold} stroke={1.5} className="shrink-0 mt-0.5" />
                    <span className="text-xs font-bold leading-normal text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Behavior Notes & Remarks */}
          <div className="mt-5">
            <div className="flex items-center gap-2 pb-2.5 mb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
              <Icon name="heart" size={16} color={C.gold} stroke={1.6} />
              <span className="text-sm font-bold" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                التوجيه والملاحظات السلوكية
              </span>
            </div>
            <div
              className="rounded-2xl p-4 border border-dashed"
              style={{ borderColor: C.gold, background: "rgba(189,143,45, 0.03)" }}
            >
              <p className="text-xs leading-relaxed text-slate-600 font-bold">
                {compiledBehaviorNotes}
              </p>
            </div>
          </div>

          {/* Closing Message / Message to parents */}
          <div className="mt-5 relative rounded-2xl p-5 text-white" style={{ background: C.ink }}>
            <div className="absolute top-4 left-4 opacity-15">
              <Icon name="quote" size={24} color={C.goldHi} />
            </div>
            <span className="text-xs font-black mb-1.5 block" style={{ color: C.goldHi }}>
              رسالة معلم الحلقة
            </span>
            <p className="text-xs leading-relaxed" style={{ color: "#f3eee3" }}>
              نثمن شراكتكم وجهودكم في متابعة الطالب *{studentFirstName}* معنا، ومراجعة الدروس اليومية معه بالمنزل مما يثمر في تسريع خطاه التعليمية وتميزه، بارك الله فيكم وفي جهوده.
            </p>
          </div>

        </div>

        {/* Space wrapper */}
        <div className="flex-grow min-h-[16px]" />

        {/* Footer Verse & Blessing */}
        <div
          className="text-center rounded-2xl p-4 border"
          style={{ background: "rgba(189,143,45,.03)", border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <span className="w-10 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.gold})` }} />
            <span className="relative w-2 h-2 transform rotate-45 shrink-0" style={{ border: `1px solid ${C.gold}` }} />
            <span className="w-10 h-px" style={{ background: `linear-gradient(270deg, transparent, ${C.gold})` }} />
          </div>

          {/* Poem Verse */}
          <div className="my-2.5 flex justify-center items-baseline gap-8 flex-wrap text-lg font-black leading-normal" style={{ color: C.gold, fontFamily: '"Amiri", serif' }}>
            <span>هَنِيئًا مَرِيئًا وَالِدَاكَ عَلَيْهِمَا</span>
            <span>مَلَابِسُ أَنْوَارٍ مِنَ التَّاجِ وَالْحُلَلِ</span>
          </div>

          <p className="max-w-[560px] mx-auto text-xs leading-relaxed font-bold mt-2" style={{ color: C.ink }}>
            حفظ الله الطالب الكريم *{studentFirstName}* وجعله من أهل القرآن العاملين به وجعله قرة عين لوالديه.
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
            padding: 20px !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
