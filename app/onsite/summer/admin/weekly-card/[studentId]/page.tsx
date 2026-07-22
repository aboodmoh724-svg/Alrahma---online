import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSummerEducationTopics } from "@/lib/summer-education-plan";
import PrintCardButton from "@/components/annual-reports/PrintCardButton";

type CardPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

// ── Single-stroke icons matching Canva bundle ──
const ICON_PATHS: Record<string, string> = {
  book: '<path d="M12 7v13"/><path d="M3 5.6C5 5.1 9 5 12 7c3-2 7-1.9 9-1.4V19c-2-.5-6-.6-9 1.4-3-2-7-1.9-9-1.4z"/>',
  kaaba: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2z"/><path d="M4 7.2l8 4.2 8-4.2M12 11.4V21"/>',
  eye: '<path d="M2 12s3.5-6.6 10-6.6S22 12 22 12s-3.5 6.6-10 6.6S2 12 2 12z"/><circle cx="12" cy="12" r="2.4"/>',
  heart: '<path d="M12 20s-6.6-4.2-9.1-8.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9.1 4.7C18.6 15.8 12 20 12 20z"/>',
  mosque: '<path d="M4 21h16M5.5 21v-7m13 7v-7"/><path d="M6 14a6 6 0 0 1 12 0"/><path d="M12 8V5.2m0 0a1.4 1.4 0 1 0 0-.1z"/>',
  spark: '<path d="M12 3l1.9 6.4L20 11l-6.1 1.6L12 19l-1.9-6.4L4 11l6.1-1.6z"/>',
  target: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>',
  check: '<circle cx="12" cy="12" r="8.4"/><path d="M8.4 12.3l2.4 2.3 4.7-4.9"/>',
  medal: '<circle cx="12" cy="14.5" r="5.4"/><path d="M8.8 9.8 6.2 3.4M15.2 9.8 17.8 3.4"/><path d="m12 11.9 1 2 2.1.2-1.6 1.5.5 2.1L12 17.5l-2 1.2.5-2.1-1.6-1.5 2.1-.2z"/>',
  quote: '<path d="M10 7.5C7.5 7.5 6 9.3 6 11.5S7.5 15 9.6 15c0 2.3-1.6 3.4-3.4 3.9M20 7.5c-2.5 0-4 1.8-4 4s1.5 3.5 3.6 3.5c0 2.3-1.6 3.4-3.4 3.9"/>',
  arrow: '<path d="M7 17 17 7M9.2 7H17v7.8"/>',
  star: '<path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.9 6.9 19.6l1-5.7-4.1-4 5.7-.8z"/>',
};

function Icon({ name, size = 24, stroke = 1.6, color = 'currentColor', className }: { name: string; size?: number; stroke?: number; color?: string; className?: string }) {
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
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] || '' }}
    />
  );
}

// Khatam star background pattern matching Canva HTML
function khatamBg(hex: string, opacity = 0.07) {
  const col = encodeURIComponent(hex);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><g fill='none' stroke='${col}' stroke-width='1' opacity='${opacity}'><rect x='20' y='20' width='24' height='24'/><rect x='20' y='20' width='24' height='24' transform='rotate(45 32 32)'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default async function SummerWeeklyCardPage({ params }: CardPageProps) {
  const { studentId } = await params;

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

  // Get last 7 days reports for this student
  const reports = await prisma.summerReport.findMany({
    where: { studentId: student.id },
    orderBy: { dateKey: "desc" },
    take: 7,
  });

  const topics = await getSummerEducationTopics();
  const studentCategory = student.summerGroup === "NOOR_AL_BAYAN" ? "SIGHAR" : "KIBAR";
  const filteredTopics = topics.filter((t) => t.category === studentCategory);
  const currentTopic = filteredTopics[0] || topics[0];

  const presentReports = reports.filter((r) => r.status === "PRESENT");
  const attendanceRate = reports.length > 0 ? Math.round((presentReports.length / reports.length) * 100) : 100;
  
  const avgBehaviorNum = presentReports.length > 0
    ? presentReports.reduce((acc, r) => acc + (r.behaviorGrade || 5), 0) / presentReports.length
    : 5;
  const avgBehavior = avgBehaviorNum.toFixed(1);

  const finalRating = avgBehaviorNum >= 4.7 ? "ممتاز ⭐" : avgBehaviorNum >= 4.0 ? "جيد جداً 🌟" : "جيد 👍";

  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

  // Exact luxury colors from Canva source code
  const C = {
    ink: '#1f3139',
    inkSoft: '#33474e',
    gold: '#a8895a',
    goldHi: '#c7af90',
    cream: '#f6f2e9',
    paper: '#fffefb',
    line: '#e6ddca',
    mute: '#5a646e',
  };

  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 justify-center mb-3">
      <span className="w-6 h-px opacity-60" style={{ background: C.gold }} />
      <Icon name="star" size={13} color={C.gold} stroke={1.4} />
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gold, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
        {children}
      </span>
      <Icon name="star" size={13} color={C.gold} stroke={1.4} />
      <span className="w-6 h-px opacity-60" style={{ background: C.gold }} />
    </div>
  );

  const Stat = ({ label, value, sub }: { label: string; value: any; sub?: string }) => (
    <div className="flex-1 text-center py-2 px-1">
      <div className="text-[36px] font-bold tracking-tight leading-none" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
        {value}
      </div>
      <div className="text-xs mt-1.5 font-bold" style={{ color: C.mute, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
        {label}
      </div>
      {sub && (
        <div className="text-[11px] font-bold mt-1" style={{ color: C.gold, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
          {sub}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f0e6] py-10 px-4 flex flex-col items-center" dir="rtl">
      {/* Google fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=El+Messiri:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Admin Control Bar */}
      <div className="w-full max-w-[780px] mb-6 flex flex-wrap justify-between items-center gap-3 no-print">
        <Link
          href="/onsite/summer/admin"
          className="rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
          style={{ background: C.ink }}
        >
          🡪 العودة إلى لوحة التحكم الصيفية
        </Link>
        <PrintCardButton />
      </div>

      {/* The Luxury Certificate Card (Exact Canva Template Match) */}
      <div
        className="w-full max-w-[780px] min-h-[1200px] relative overflow-hidden shadow-2xl p-[34px_46px_36px] flex flex-col justify-between print-card rounded-2xl"
        style={{
          background: C.cream,
          backgroundImage: khatamBg(C.gold, 0.07),
          backgroundSize: '58px 58px',
          boxSizing: 'border-box',
          border: `1px solid ${C.line}`,
        }}
        dir="rtl"
      >
        {/* Double borders with opacity */}
        <div className="absolute inset-4 pointer-events-none rounded" style={{ border: `1px solid ${C.gold}`, opacity: 0.45 }} />
        <div className="absolute inset-[21px] pointer-events-none rounded" style={{ border: `1px solid ${C.gold}`, opacity: 0.22 }} />

        {/* Content Wrapper */}
        <div className="relative flex flex-col flex-grow">
          {/* Logo Lockup */}
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <img src="/images/summer_quran_logo_v2.jpg" alt="شعار الدورة الصيفية" className="w-[64px] h-[64px] object-contain rounded-xl border border-[#d8bf83]" />
            <div className="text-[20px] font-bold tracking-wide text-center" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              تحفيظ الرحمة — الدورة الصيفية الأولى
            </div>
          </div>

          {/* Hero Header */}
          <div className="text-center mt-3">
            <Eyebrow>بطاقة التقرير الأسبوعي المميز 🌟</Eyebrow>
            <h1 className="text-[40px] font-bold leading-tight" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
              {student.fullName}
            </h1>
            <div className="flex justify-center gap-[16px] mt-2 text-xs flex-wrap font-bold" style={{ color: C.inkSoft, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
              <span><span style={{ color: C.mute }}>المعلّم: </span><b>{student.teacher?.fullName || "غير محدد"}</b></span>
              <span style={{ color: C.line }}>|</span>
              <span><span style={{ color: C.mute }}>الحلقة: </span><b>{student.circle?.name || "-"}</b></span>
              <span style={{ color: C.line }}>|</span>
              <span><span style={{ color: C.mute }}>المسار: </span><b style={{ color: C.gold }}>{isNoor ? "نور البيان والتمهيدي" : "القرآن الكريم"}</b></span>
            </div>
          </div>

          {/* Ribbon Medal Badge */}
          <div className="flex justify-center mt-4 mb-2 relative">
            <div className="absolute top-14 flex gap-6 z-0">
              <span className="w-4 h-9 transform -rotate-6" style={{ background: C.gold, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }} />
              <span className="w-4 h-9 transform rotate-6" style={{ background: C.goldHi, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)' }} />
            </div>
            <div
              className="relative z-10 w-[92px] h-[92px] rounded-full flex items-center justify-center shadow-md"
              style={{
                background: `conic-gradient(${C.goldHi}, ${C.gold}, ${C.goldHi}, ${C.gold}, ${C.goldHi})`,
                boxShadow: '0 6px 18px rgba(168,137,90,.4)'
              }}
            >
              <div
                className="w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center gap-0.5"
                style={{ background: C.ink, border: `2px solid ${C.goldHi}` }}
              >
                <Icon name="star" size={13} color={C.goldHi} stroke={1.4} />
                <span
                  className="font-bold text-white leading-none text-center px-1"
                  style={{ fontFamily: '"El Messiri", serif', fontSize: '18px' }}
                >
                  {finalRating}
                </span>
                <span className="text-[9px] tracking-wider" style={{ color: C.goldHi }}>التقدير الأسبوعي</span>
              </div>
            </div>
          </div>

          {/* Stat Strip */}
          <div
            className="flex items-center rounded-2xl mt-4 shadow-sm divide-x divide-x-reverse"
            style={{ background: C.paper, border: `1px solid ${C.line}` }}
          >
            <Stat label="نسبة الحضور الأسبوعي" value={`${attendanceRate}%`} />
            <Stat label="معدل السلوك والانضباط" value={`${avgBehavior} / 5`} />
            <Stat label="الحصص المنجزة" value={`${presentReports.length} حصص`} />
          </div>

          {/* Weekly Memorized & Accomplished Block */}
          <div
            className="mt-4 rounded-xl p-[14px_18px] text-white flex items-start gap-3 shadow-sm"
            style={{ background: C.ink }}
          >
            <Icon name="book" size={22} color={C.goldHi} stroke={1.5} className="shrink-0 mt-1" />
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: C.goldHi }}>
                {isNoor ? "ما تم إنجازه في نور البيان هذا الأسبوع:" : "ما تم إنجازه في القرآن الكريم هذا الأسبوع:"}
              </div>
              {presentReports.length === 0 ? (
                <p className="text-xs text-white/80 font-bold">بانتظار رصد الحصص القادمة.</p>
              ) : (
                <div className="space-y-1 text-xs font-bold">
                  {presentReports.map((r, idx) => (
                    <div key={r.id || idx} className="flex justify-between gap-2 border-b border-white/10 pb-1">
                      <span className="font-mono text-emerald-200">{r.dateKey}</span>
                      <span className="text-white">
                        {isNoor
                          ? `الدرس: ${r.noorLearned || "حاضر"} (الواجب: ${r.noorHomework ? "مكتمل ✅" : "معلق ⏳"})`
                          : `الحفظ: ${r.quranNew || "لا يوجد"} | المراجعة: ${r.quranRevision || "لا يوجد"}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Islamic Education Lesson Box (الدرس التربوي الأسبوعي) */}
          {currentTopic && (
            <div className="mt-4">
              <Eyebrow>درس التربية والآداب الإسلامية لهذا الأسبوع</Eyebrow>
              <div
                className="rounded-xl p-4 shadow-2xs"
                style={{ background: C.paper, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold rounded-full px-2.5 py-0.5 text-white" style={{ background: C.gold }}>
                    الدرس #{currentTopic.weekNumber} | {currentTopic.category === "SIGHAR" ? "خطة الصغار" : "خطة الكبار"}
                  </span>
                  <span className="text-xs font-bold" style={{ color: C.ink, fontFamily: '"El Messiri", serif' }}>
                    {currentTopic.title}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-semibold mt-1">
                  {currentTopic.details}
                </p>
                {currentTopic.homeworkRequirement && (
                  <div className="mt-2 text-[11px] font-bold p-2 rounded-lg bg-[#f6f2e9] border border-[#e6ddca]" style={{ color: C.inkSoft }}>
                    📝 الواجب السلوكي المطلوب: {currentTopic.homeworkRequirement}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strengths & Behaviors (بم يتميز & السلوك والتفاعل) */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b" style={{ borderColor: C.line }}>
                <Icon name="spark" size={16} color={C.gold} stroke={1.7} />
                <span className="text-xs font-bold" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                  نقاط التميز والانضباط
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg p-2.5 bg-[#fffefb] border border-[#e6ddca] text-xs font-bold" style={{ color: C.ink }}>
                  <Icon name="check" size={15} color={C.gold} stroke={1.6} />
                  <span>الالتزام بالحضور بالحلقة</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2.5 bg-[#fffefb] border border-[#e6ddca] text-xs font-bold" style={{ color: C.ink }}>
                  <Icon name="star" size={15} color={C.gold} stroke={1.6} />
                  <span>حسن السلوك واحترام المعلم</span>
                </div>
              </div>
            </div>

            {/* Behaviors Progress Level */}
            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b" style={{ borderColor: C.line }}>
                <Icon name="target" size={16} color={C.gold} stroke={1.7} />
                <span className="text-xs font-bold" style={{ color: C.ink, fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>
                  السلوك والتفاعل
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span style={{ color: C.inkSoft }}>الانضباط داخل الحلقة</span>
                    <span style={{ color: C.gold }}>ممتاز</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: C.ink, width: "100%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span style={{ color: C.inkSoft }}>التفاعل والمشاركة</span>
                    <span style={{ color: C.gold }}>ممتاز</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: C.ink, width: "95%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="mt-6 pt-4 border-t flex justify-between items-center text-xs font-bold" style={{ borderColor: C.line, color: C.mute }}>
            <div className="text-center">
              <span>توقيع المعلم المسؤول</span>
              <span className="block mt-1 font-serif text-[#1f3139]">{student.teacher?.fullName || "أستاذ الحلقة"}</span>
            </div>
            <div className="text-center">
              <span>ختم وإدارة الدورة الصيفية</span>
              <span className="block mt-1 font-serif text-[#1f3139]">أستاذ محمد سيف الدين</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
