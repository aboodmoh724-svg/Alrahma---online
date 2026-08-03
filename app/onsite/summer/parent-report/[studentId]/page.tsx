import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  evaluateStudent,
  getCourseMeta,
  getGradeLevel,
  type DailyReportData,
  type Track,
} from "@/lib/summer-evaluation";
import { getLocalDayOfWeek, toLocalDateKey } from "@/lib/date-utils";

type Props = {
  params: Promise<{ studentId: string }>;
};

function countWorkingDays(start: string, end: string): number {
  let count = 0;
  const s = new Date(start);
  const e = new Date(end);
  const cur = new Date(s);
  while (cur <= e) {
    const dow = getLocalDayOfWeek(cur);
    if (dow !== 1) count++; // exclude Monday
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default async function ParentReportPage({ params }: Props) {
  const { studentId } = await params;

  // Flexible lookup by ID or Code (e.g. 7501, 7500, or CUID)
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: studentId },
        { studentCode: studentId },
      ],
      isActive: true,
      studyMode: "ONSITE_SUMMER",
    },
    select: {
      id: true,
      fullName: true,
      summerGroup: true,
      studentCode: true,
      teacher: { select: { fullName: true } },
      circle: { select: { name: true } },
      summerReports: {
        where: { dateKey: { gte: "2026-07-09" } },
        select: {
          dateKey: true, status: true,
          quranNew: true, quranRevision: true, quranTaqeen: true,
          noorLearned: true, noorHomework: true, noorHomeworkGrade: true, noorParticipation: true,
          behaviorGrade: true, createdAt: true,
        },
        orderBy: { dateKey: "asc" },
      },
    },
  });

  if (!student) notFound();

  const courseMeta = getCourseMeta();
  const todayStr = toLocalDateKey(new Date());
  const effectiveEnd = todayStr < courseMeta.courseEnd ? todayStr : courseMeta.courseEnd;
  const totalWorkingDays = countWorkingDays(courseMeta.courseStart, effectiveEnd);
  const track: Track = student.summerGroup === "NOOR_AL_BAYAN" ? "NOOR_AL_BAYAN" : "QURAN";

  const reports: DailyReportData[] = student.summerReports.map((r) => ({
    dateKey: r.dateKey,
    status: r.status as "PRESENT" | "ABSENT",
    quranNew: r.quranNew, quranRevision: r.quranRevision, quranTaqeen: r.quranTaqeen,
    noorLearned: r.noorLearned, noorHomework: r.noorHomework,
    noorHomeworkGrade: r.noorHomeworkGrade, noorParticipation: r.noorParticipation,
    behaviorGrade: r.behaviorGrade, createdAt: r.createdAt,
  }));

  const evaluation = evaluateStudent(
    student.id, student.fullName, track,
    student.teacher?.fullName || "", student.circle?.name || "",
    reports, totalWorkingDays
  );

  const { examScores: es, dailyMetrics: dm, grade, finalScore, snapshot, milestones, autoFeedback, recommendations } = evaluation;

  const trackLabel = track === "QURAN" ? "مسار القرآن الكريم" : "مسار نور البيان والتمهيدي";
  const firstName = student.fullName.split(" ")[0];

  const subjectCards = track === "QURAN"
    ? [
      { label: "اختبار القرآن الكريم", score: es.quranExam, weight: "75%", icon: "📖" },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam, weight: "10%", icon: "🌙" },
    ]
    : [
      { label: "اختبار القراءة والتهجئة", score: es.noorBayanExam, weight: "60%", icon: "📖" },
      { label: "حفظ قصار السور", score: es.qisarSuwarExam, weight: "15%", icon: "🕋" },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam, weight: "10%", icon: "🌙" },
    ];

  // Star Rating representation
  const starCount = finalScore >= 90 ? 5 : finalScore >= 80 ? 4 : finalScore >= 70 ? 3 : 2;

  // Progress Timeline Journey Items
  const timelineJourney = [
    { title: "بداية الدورة الصيفية", date: "9 يوليو 2026", icon: "🌱", desc: "التحاق الطالب بالحلقة وتحديد المستوى" },
    {
      title: track === "QURAN" ? "الانتظام في الحفظ والمراجعة" : "مراحل القراءة والتهجئة",
      date: `${dm.presentDays} يوماً دراسياً`,
      icon: "📚",
      desc: track === "QURAN" ? `إنجاز ${dm.memorizationDays} يوماً في الحفظ الجديد و${dm.revisionDays} يوماً بالمراجعة` : `إنجاز ${dm.lessonsCount} درساً في القراءة والتهجئة`,
    },
    { title: "الاختبارات والتصفيات", date: "أغسطس 2026", icon: "⭐", desc: `تحقيق نتيجة ${finalScore}% بتقدير ${grade.label}` },
    { title: "ختام الدورة والتكريم", date: "7 أغسطس 2026", icon: "🏆", desc: "إتمام متطلبات الدورة الصيفية بنجاح" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-14 px-3 sm:px-6 font-body text-[#1F2937] print:bg-white print:py-0 print:px-0">
      
      {/* Container simulating a Luxury Parchment Certificate */}
      <div className="mx-auto max-w-[760px] bg-white rounded-3xl border-2 border-[#E5DEC9] shadow-2xl overflow-hidden relative print:shadow-none print:border-none print:rounded-none">

        {/* Outer Gold/Emerald Decorative Border Line */}
        <div className="p-2 border-4 border-[#0C5C5E]/15 m-2 rounded-2xl print:border-none print:m-0 print:p-0">

          {/* ═══════════════════════════════════════════════════════════
              1. GRAND HERO HEADER (ترويسة الوثيقة الفاخرة)
             ═══════════════════════════════════════════════════════════ */}
          <header className="bg-gradient-to-b from-[#074749] via-[#0C5C5E] to-[#0A4D4F] text-white pt-10 pb-12 px-6 sm:px-10 text-center relative overflow-hidden rounded-xl">
            {/* Islamic Geometry Background Accents */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-xl pointer-events-none" />

            {/* Logo Badge */}
            <div className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-1.5 mb-4 border border-white/20 shadow-inner">
              <Image src="/images/alrahma_tahfeez_logo.png" alt="تحفيظ الرحمة" width={26} height={26} className="h-6 w-6 object-contain" />
              <span className="text-[13px] font-bold text-white tracking-wide font-heading">إدارة تحفيظ الرحمة للقرآن الكريم</span>
            </div>

            {/* Main Document Title (36px) */}
            <h1 className="text-[30px] sm:text-[36px] font-extrabold font-heading text-[#FDE68A] leading-tight mb-2 drop-shadow-sm">
              وثيقة إنجاز وتفوق طالب
            </h1>
            <p className="text-[13px] sm:text-[14px] text-white/85 font-medium tracking-wide">
              الدورة الصيفية لعام 1447 هـ — 2026 م
            </p>

            {/* Student Name Hero Section (28px) */}
            <div className="mt-7 pt-6 border-t border-white/15">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest block mb-1">يُشهد بأن الطالب / ـة</span>
              <h2 className="text-[28px] sm:text-[34px] font-extrabold font-heading text-white leading-tight">
                {student.fullName}
              </h2>
              <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 text-[12px] text-[#FDE68A] font-semibold bg-black/20 backdrop-blur-xs px-4 py-1.5 rounded-full border border-white/10">
                <span>{trackLabel}</span>
                <span className="text-white/40">•</span>
                <span>{student.circle?.name || "حلقة القرآن"}</span>
                <span className="text-white/40">•</span>
                <span>المعلم: {student.teacher?.fullName || "—"}</span>
              </div>
            </div>
          </header>

          <main className="p-6 sm:p-10 space-y-10">

            {/* ═══════════════════════════════════════════════════════════
                2. GIANT ACHIEVEMENT MEDAL & SCORE (دائرة النتيجة الكبرى)
               ═══════════════════════════════════════════════════════════ */}
            <section className="text-center relative -mt-16 sm:-mt-20 z-10">
              <div className="inline-flex flex-col items-center bg-white rounded-3xl p-6 sm:p-8 border-4 border-[#E5DEC9] shadow-xl relative">
                
                {/* Medal Emblem Ring */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#F3F4F6" strokeWidth="7" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke={grade.color} strokeWidth="7"
                      strokeDasharray={`${(finalScore / 100) * 276} 276`} strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">النتيجة النهائية</span>
                    <span className="text-[40px] sm:text-[50px] font-extrabold font-heading leading-none" style={{ color: grade.color }}>
                      {finalScore % 1 === 0 ? finalScore : finalScore.toFixed(1)}<span className="text-[20px]">%</span>
                    </span>
                    <span className="text-[12px] font-bold mt-0.5 text-[#374151]">{grade.label}</span>
                  </div>
                </div>

                {/* Golden Rating Stars */}
                <div className="mt-3 flex items-center gap-1 text-2xl text-[#D97706]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < starCount ? "opacity-100 scale-110" : "opacity-25"}>★</span>
                  ))}
                </div>

                {/* Grade Ribbon Tag */}
                <div className="mt-3 px-6 py-1.5 rounded-full text-[14px] font-bold text-white shadow-md font-heading" style={{ backgroundColor: grade.color }}>
                  تقدير عام: {grade.label}
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                3. HONORS & EMOTIONAL MEDALS (أوسمة التكريم)
               ═══════════════════════════════════════════════════════════ */}
            {milestones.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-[#0C5C5E]/15 pb-2">
                  <span className="text-2xl">🏅</span>
                  <h3 className="text-[18px] sm:text-[20px] font-bold font-heading text-[#0C5C5E]">
                    أوسمة التكريم والإنجاز
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-3.5 bg-gradient-to-r from-[#FAF7F0] to-white rounded-2xl border border-[#EAE3D2] p-4 shadow-xs">
                      <span className="text-3xl shrink-0 p-2 bg-white rounded-xl shadow-xs border border-[#E5DEC9]">{m.icon}</span>
                      <div>
                        <p className="text-[15px] font-bold text-[#1F2937] font-heading">{m.title}</p>
                        <p className="text-[12px] text-[#6B7280] mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════
                4. PROGRESS TIMELINE JOURNEY (رحلة الإنجاز)
               ═══════════════════════════════════════════════════════════ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-[#0C5C5E]/15 pb-2">
                <span className="text-2xl">🗺️</span>
                <h3 className="text-[18px] sm:text-[20px] font-bold font-heading text-[#0C5C5E]">
                  رحلة الطالب خلال الدورة
                </h3>
              </div>
              <div className="relative border-r-2 border-[#0C5C5E]/20 mr-4 pr-6 space-y-6">
                {timelineJourney.map((step, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -right-[31px] top-0 w-6 h-6 rounded-full bg-[#0C5C5E] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
                      {step.icon}
                    </div>
                    <div className="bg-[#FAF7F0]/80 rounded-xl border border-[#EAE3D2] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[14px] font-bold text-[#1F2937] font-heading">{step.title}</h4>
                        <span className="text-[10px] font-semibold text-[#0C5C5E] bg-[#0C5C5E]/10 px-2 py-0.5 rounded-full">{step.date}</span>
                      </div>
                      <p className="text-[12px] text-[#6B7280] mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                5. ACADEMIC DETAILS (تفاصيل الأداء الدراسي)
               ═══════════════════════════════════════════════════════════ */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-[#0C5C5E]/15 pb-2">
                <span className="text-2xl">📊</span>
                <h3 className="text-[18px] sm:text-[20px] font-bold font-heading text-[#0C5C5E]">
                  تفاصيل الأداء والمواد
                </h3>
              </div>
              <div className={`grid gap-3 ${subjectCards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {subjectCards.map((card, i) => {
                  const sGrade = (card.score >= 85 ? "ممتاز" : card.score >= 75 ? "جيد جداً" : card.score >= 60 ? "جيد" : "متابعة");
                  const sColor = (card.score >= 85 ? "#059669" : card.score >= 75 ? "#0C5C5E" : card.score >= 60 ? "#D97706" : "#DC2626");
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-[#E5E3DF] p-4 text-center shadow-xs hover:border-[#0C5C5E]/30 transition-colors">
                      <span className="text-2xl">{card.icon}</span>
                      <p className="text-[11px] text-[#9CA3AF] mt-1 font-semibold">{card.label}</p>
                      <p className="text-[26px] font-extrabold font-heading mt-0.5" style={{ color: sColor }}>
                        {card.score % 1 === 0 ? card.score : card.score.toFixed(1)}%
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: sColor + "15", color: sColor }}>
                        {sGrade}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                6. STUDENT SNAPSHOT (ملخص الطالب والمهارات)
               ═══════════════════════════════════════════════════════════ */}
            {(snapshot.strengths.length > 0 || snapshot.improvementAreas.length > 0) && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-[#0C5C5E]/15 pb-2">
                  <span className="text-2xl">📋</span>
                  <h3 className="text-[18px] sm:text-[20px] font-bold font-heading text-[#0C5C5E]">
                    ملخص مهارات الطالب
                  </h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {snapshot.strengths.length > 0 && (
                    <div className="bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] p-4">
                      <p className="text-[13px] font-bold text-[#166534] mb-2 flex items-center gap-1.5 font-heading">
                        <span>✨</span> نقاط القوة والتميز
                      </p>
                      <ul className="space-y-1.5">
                        {snapshot.strengths.map((s, i) => (
                          <li key={i} className="text-[13px] text-[#15803D] flex items-start gap-2">
                            <span className="text-[#16A34A] shrink-0 font-bold mt-px">✓</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {snapshot.improvementAreas.length > 0 && (
                    <div className="bg-[#FFFBEB] rounded-2xl border border-[#FDE68A] p-4">
                      <p className="text-[13px] font-bold text-[#92400E] mb-2 flex items-center gap-1.5 font-heading">
                        <span>🌱</span> فرص التطور والنمو
                      </p>
                      <ul className="space-y-1.5">
                        {snapshot.improvementAreas.map((s, i) => (
                          <li key={i} className="text-[13px] text-[#B45309] flex items-start gap-2">
                            <span className="text-[#D97706] shrink-0 font-bold mt-px">↑</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════
                7. TEACHER PERSONAL LETTER (كلمة المعلم الشخصية) (18px)
               ═══════════════════════════════════════════════════════════ */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-[#0C5C5E]/15 pb-2">
                <span className="text-2xl">✉️</span>
                <h3 className="text-[18px] sm:text-[20px] font-bold font-heading text-[#0C5C5E]">
                  رسالة وكلمة المعلم
                </h3>
              </div>
              <div className="bg-gradient-to-br from-[#FAF7F0] to-[#F5EFE4] rounded-2xl border-r-6 border-[#0C5C5E] p-6 shadow-xs relative">
                <span className="text-4xl text-[#0C5C5E]/20 font-serif absolute top-3 left-4 select-none">“</span>
                <p className="text-[16px] sm:text-[18px] text-[#2D3748] leading-relaxed font-body">
                  {autoFeedback}
                </p>
                <div className="mt-4 pt-3 border-t border-[#E5DEC9] flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#718096]">معلم الحلقة المباركة</span>
                  <span className="text-[14px] font-bold text-[#0C5C5E] font-heading">أستاذ: {student.teacher?.fullName || "معلم الحلقة"}</span>
                </div>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════
                8. RECOMMENDATIONS FOR FAMILY (توصيات للأسرة)
               ═══════════════════════════════════════════════════════════ */}
            {recommendations.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-[#0C5C5E]/15 pb-2">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-[18px] sm:text-[20px] font-bold font-heading text-[#0C5C5E]">
                    توصيات عمليّة للأسرة الكريمة
                  </h3>
                </div>
                <div className="bg-white rounded-2xl border border-[#E5E3DF] p-5 space-y-3 shadow-xs">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 text-[14px] sm:text-[15px] text-[#374151]">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#0C5C5E]/10 text-[#0C5C5E] font-bold text-[12px] flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════════
                9. WARM CLOSING DU'A & OFFICIAL SIGNATURE (الدعاء والختام)
               ═══════════════════════════════════════════════════════════ */}
            <section className="rounded-2xl bg-gradient-to-br from-[#ECFDF5] via-[#E6F4F1] to-[#F0FDF4] border-2 border-[#A7F3D0] p-6 text-center space-y-3 shadow-xs">
              <span className="text-4xl inline-block">🤲</span>
              <h4 className="text-[16px] sm:text-[18px] font-bold text-[#065F46] font-heading">دعاء مبارك للطالب وأسرته</h4>
              <p className="text-[14px] sm:text-[16px] text-[#047857] leading-relaxed max-w-[550px] mx-auto font-medium">
                «نسأل الله العلي القدير أن يبارك في الطالب <strong className="text-[#065F46] font-bold">{firstName}</strong>، وأن يجعله من أهل القرآن وخاصته الذين هم أهل الله وخاصته، وأن ينفع به والديه وأمته الإسلامية.»
              </p>

              <div className="pt-4 mt-2 border-t border-[#A7F3D0]/60 flex flex-wrap items-center justify-around gap-4 text-[12px] text-[#065F46]">
                <div>
                  <p className="font-semibold text-[#9CA3AF] text-[10px]">تاريخ الإصدار</p>
                  <p className="font-bold">{toLocalDateKey(new Date())}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#9CA3AF] text-[10px]">الجهة المصدرة</p>
                  <p className="font-bold font-heading text-[#0C5C5E]">إدارة تحفيظ الرحمة للقرآن الكريم</p>
                </div>
              </div>
            </section>

          </main>

          {/* Luxury Certificate Bottom Footer */}
          <footer className="bg-[#FAF7F0] border-t border-[#EAE3D2] px-6 py-5 text-center text-[12px] text-[#6B7280] rounded-b-xl">
            <p className="font-bold text-[#0C5C5E] font-heading text-[14px]">منصة تحفيظ الرحمة لتعليم القرآن الكريم</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">الدورة الصيفية — تركيا 2026</p>
            <p className="text-[10px] text-[#D1D5DB] mt-1 font-serif">«خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»</p>
          </footer>

        </div>
      </div>
    </div>
  );
}
