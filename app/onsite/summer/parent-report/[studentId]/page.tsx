import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  evaluateStudent,
  getCourseMeta,
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

  const { examScores: es, dailyMetrics: dm, grade, finalScore, achievements, snapshot, milestones, autoFeedback, recommendations } = evaluation;

  const trackLabel = track === "QURAN" ? "مسار القرآن الكريم" : "مسار نور البيان";
  const firstName = student.fullName.split(" ")[0];

  const subjectCards = track === "QURAN"
    ? [
      { label: "اختبار القرآن الكريم", score: es.quranExam, icon: "📖" },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam, icon: "🌙" },
    ]
    : [
      { label: "اختبار القراءة والتهجئة", score: es.noorBayanExam, icon: "📖" },
      { label: "حفظ قصار السور", score: es.qisarSuwarExam, icon: "🕋" },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam, icon: "🌙" },
    ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-6 sm:py-10 px-3 sm:px-6 font-body text-[#1F2937] print:bg-white print:py-2">
      <div className="mx-auto max-w-[680px] bg-white rounded-2xl border border-[#E8E2D5] shadow-lg overflow-hidden print:shadow-none print:border-none">

        {/* Top Decorative Emerald Header Ribbon */}
        <div className="bg-gradient-to-r from-[#074749] via-[#0C5C5E] to-[#127275] text-white p-6 sm:p-8 text-center relative">
          <div className="absolute top-2 left-3 text-white/10 text-4xl select-none font-serif">🌿</div>
          <div className="absolute bottom-2 right-3 text-white/10 text-4xl select-none font-serif">🌿</div>

          <div className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 mb-3 border border-white/15">
            <Image src="/images/alrahma_tahfeez_logo.png" alt="تحفيظ الرحمة" width={22} height={22} className="h-5 w-5 object-contain" />
            <span className="text-[12px] font-bold text-white/95">إدارة تحفيظ الرحمة للقرآن الكريم</span>
          </div>

          <h1 className="text-[22px] sm:text-[26px] font-bold font-heading leading-tight mb-1 text-white">
            تقرير إنجاز الطالب
          </h1>
          <p className="text-[12px] text-white/80 font-medium">حصاد الدورة الصيفية — 2026</p>
        </div>

        <div className="p-5 sm:p-8 space-y-6">

          {/* ═══ 1. STUDENT HONOR CARD & SCORE ═══ */}
          <div className="bg-[#FAF7F0] rounded-xl border border-[#EAE3D2] p-5 sm:p-6 text-center relative overflow-hidden">
            {/* Background Emblem */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-[#0C5C5E]/10 border-2 border-[#0C5C5E]/20 flex items-center justify-center text-2xl text-[#0C5C5E] font-bold shadow-inner">
                {student.fullName.charAt(0)}
              </div>
            </div>

            <h2 className="text-[20px] font-bold font-heading text-[#0C5C5E]">{student.fullName}</h2>
            <div className="flex items-center justify-center gap-2 mt-1 text-[12px] text-[#6B7280]">
              <span>{trackLabel}</span>
              <span>•</span>
              <span>{student.circle?.name || "حلقة القرآن"}</span>
              <span>•</span>
              <span>المعلم: {student.teacher?.fullName || "—"}</span>
            </div>

            {/* Giant Score Ribbon */}
            <div className="mt-5 inline-flex flex-col items-center bg-white rounded-xl border border-[#E5E3DF] shadow-sm px-8 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">النتيجة النهائية</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[38px] font-extrabold font-heading leading-none" style={{ color: grade.color }}>
                  {finalScore % 1 === 0 ? finalScore : finalScore.toFixed(1)}%
                </span>
              </div>
              <span className="mt-1.5 px-3 py-0.5 rounded-full text-[12px] font-bold text-white shadow-xs" style={{ backgroundColor: grade.color }}>
                {grade.label} ⭐
              </span>
            </div>
          </div>

          {/* ═══ 2. EMOTIONAL MILESTONES (الأوسمة والجوائز) ═══ */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold font-heading text-[#0C5C5E] flex items-center gap-1.5">
                <span>🏅</span> أوسمة التميز والإنجاز
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-[#E5E3DF] p-3 shadow-2xs hover:border-[#0C5C5E]/30 transition-colors">
                    <span className="text-2xl shrink-0">{m.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold leading-tight text-[#1F2937]">{m.title}</p>
                      <p className="text-[10px] text-[#6B7280] mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 3. ACADEMIC PERFORMANCE (الأداء الأكاديمي) ═══ */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-bold font-heading text-[#0C5C5E] flex items-center gap-1.5">
              <span>📊</span> تفاصيل الأداء الأكاديمي
            </h3>
            <div className={`grid gap-2.5 ${subjectCards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {subjectCards.map((card, i) => {
                const sGrade = (card.score >= 85 ? "ممتاز" : card.score >= 75 ? "جيد جداً" : card.score >= 60 ? "جيد" : "متابعة");
                const sColor = (card.score >= 85 ? "#059669" : card.score >= 75 ? "#0C5C5E" : card.score >= 60 ? "#D97706" : "#DC2626");
                return (
                  <div key={i} className="bg-white rounded-xl border border-[#E5E3DF] p-3.5 text-center shadow-2xs">
                    <span className="text-xl">{card.icon}</span>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{card.label}</p>
                    <p className="text-[22px] font-extrabold font-heading mt-0.5" style={{ color: sColor }}>
                      {card.score % 1 === 0 ? card.score : card.score.toFixed(1)}%
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: sColor + "15", color: sColor }}>
                      {sGrade}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ 4. STUDENT SNAPSHOT (نقاط القوة وفرص التحسين) ═══ */}
          {(snapshot.strengths.length > 0 || snapshot.improvementAreas.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold font-heading text-[#0C5C5E] flex items-center gap-1.5">
                <span>📋</span> ملخص الطالب والمهارات
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {snapshot.strengths.length > 0 && (
                  <div className="bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] p-4">
                    <p className="text-[12px] font-bold text-[#166534] mb-2 flex items-center gap-1">
                      <span>✨</span> نقاط القوة والتميز
                    </p>
                    <ul className="space-y-1.5">
                      {snapshot.strengths.map((s, i) => (
                        <li key={i} className="text-[12px] text-[#15803D] flex items-start gap-1.5">
                          <span className="text-[#16A34A] shrink-0 font-bold">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {snapshot.improvementAreas.length > 0 && (
                  <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-4">
                    <p className="text-[12px] font-bold text-[#92400E] mb-2 flex items-center gap-1">
                      <span>🌱</span> فرص التطور والتحسين
                    </p>
                    <ul className="space-y-1.5">
                      {snapshot.improvementAreas.map((s, i) => (
                        <li key={i} className="text-[12px] text-[#B45309] flex items-start gap-1.5">
                          <span className="text-[#D97706] shrink-0 font-bold">↑</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ 5. TEACHER FEEDBACK (كلمة المعلم) ═══ */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-bold font-heading text-[#0C5C5E] flex items-center gap-1.5">
              <span>💬</span> كلمة المعلم الموجهة للأسرة
            </h3>
            <div className="bg-[#FAF7F0] rounded-xl border-r-4 border-[#0C5C5E] p-4 text-[13px] text-[#374151] leading-relaxed shadow-2xs">
              <p>"{autoFeedback}"</p>
              <p className="text-[11px] font-bold text-[#0C5C5E] mt-2 text-left">— معلم الحلقة: {student.teacher?.fullName || "معلم الحلقة"}</p>
            </div>
          </div>

          {/* ═══ 6. RECOMMENDATIONS FOR FAMILY (توصيات للأسرة) ═══ */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px] font-bold font-heading text-[#0C5C5E] flex items-center gap-1.5">
                <span>💡</span> توصيات سريعة للأسرة الكريمة
              </h3>
              <div className="bg-white rounded-xl border border-[#E5E3DF] p-4 space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[12px] text-[#374151]">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#0C5C5E]/10 text-[#0C5C5E] font-bold text-[10px] flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 7. WARM FAMILY DU'A & CLOSING (دعاء ختامي عاطفي) ═══ */}
          <div className="rounded-xl bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] border border-[#A7F3D0] p-5 text-center space-y-2">
            <span className="text-3xl inline-block">🤲</span>
            <h4 className="text-[14px] font-bold text-[#065F46] font-heading">دعاء مبارك للطالب والأسرة</h4>
            <p className="text-[13px] text-[#047857] leading-relaxed max-w-[500px] mx-auto font-medium">
              «نسأل الله العلي القدير أن يبارك في الطالب <strong className="text-[#065F46] font-bold">{firstName}</strong>، وأن يجعله من أهل القرآن وخاصته الذين هم أهل الله وخاصته، وأن ينفع به والده وأمه والأمة الإسلامية.»
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="bg-[#FAF7F0] border-t border-[#EAE3D2] px-6 py-4 text-center text-[11px] text-[#6B7280]">
          <p className="font-bold text-[#0C5C5E]">إدارة منصة تحفيظ الرحمة للقرآن الكريم</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">الدورة الصيفية — تركيا 2026</p>
        </footer>

      </div>
    </div>
  );
}
