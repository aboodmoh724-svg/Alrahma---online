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

  const { examScores: es, grade, finalScore, snapshot, autoFeedback, recommendations } = evaluation;

  const trackLabel = track === "QURAN" ? "مسار القرآن الكريم" : "مسار نور البيان والتمهيدي";
  const firstName = student.fullName.split(" ")[0];

  const subjectItems = track === "QURAN"
    ? [
      { label: "اختبار القرآن الكريم", score: es.quranExam, weight: "75%" },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam, weight: "10%" },
    ]
    : [
      { label: "اختبار القراءة والتهجئة", score: es.noorBayanExam, weight: "60%" },
      { label: "حفظ قصار السور", score: es.qisarSuwarExam, weight: "15%" },
      { label: "التربية الإيمانية والآداب", score: es.tarbiyaExam, weight: "10%" },
    ];

  const starCount = finalScore >= 90 ? 5 : finalScore >= 80 ? 4 : finalScore >= 70 ? 3 : 2;

  return (
    <div className="min-h-screen bg-[#FAF9F5] py-8 sm:py-12 px-4 sm:px-6 font-body text-[#1F2937] print:bg-white print:py-0 print:px-0 print:m-0">
      
      {/* Inline Print Media Rules for 1-Page A4 Guarantee */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.6cm 0.8cm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-1page-container {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .print-header {
            padding-top: 1rem !important;
            padding-bottom: 3.5rem !important;
          }
          .print-score-card {
            margin-top: -3rem !important;
            padding: 0.75rem 1.25rem !important;
          }
          .print-main-space {
            padding: 1rem !important;
            row-gap: 0.75rem !important;
          }
          .print-text-sm {
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .print-[#0C5C5E] {
            color: #0C5C5E !important;
          }
        }
      ` }} />

      {/* Clean Document Frame */}
      <div className="print-1page-container mx-auto max-w-[660px] bg-white rounded-2xl border border-[#E5DEC9] shadow-md overflow-hidden print:shadow-none print:border-none print:rounded-none">

        {/* ═══════════════════════════════════════════════════════════
            1. HERO HEADER (ترويسة أنيقة مع تفاصيل الطالب)
           ═══════════════════════════════════════════════════════════ */}
        <header className="print-header bg-[#0C5C5E] text-white pt-7 pb-14 sm:pb-16 px-6 sm:px-8 text-center relative print:pt-4 print:pb-12">
          <div className="inline-flex items-center justify-center gap-2 bg-white/10 rounded-full px-3.5 py-0.5 mb-2 border border-white/15 print:mb-1">
            <Image src="/images/alrahma_tahfeez_logo.png" alt="تحفيظ الرحمة" width={18} height={18} className="h-4.5 w-4.5 object-contain" />
            <span className="text-[11px] font-semibold text-white/90 print:text-[10px]">تحفيظ الرحمة للقرآن الكريم</span>
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-bold font-heading text-white leading-tight print:text-[20px]">
            تقرير إنجاز الطالب
          </h1>
          <p className="text-[11px] text-white/75 mt-0.5 font-medium print:text-[9px]">الدورة الصيفية 2026</p>

          <div className="mt-4 pt-3 border-t border-white/15 print:mt-2 print:pt-2">
            <span className="text-[10px] text-white/70 block mb-0.5 print:text-[8px]">يُشهد بأن الطالب / ـة</span>
            <h2 className="text-[22px] sm:text-[28px] font-bold font-heading text-[#FDE68A] print:text-[20px]">{student.fullName}</h2>
            <div className="mt-1.5 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/90 font-medium bg-black/15 px-3 py-0.5 rounded-full border border-white/10 print:text-[9px]">
              <span>{trackLabel}</span>
              <span>•</span>
              <span>{student.circle?.name || "حلقة القرآن"}</span>
              <span>•</span>
              <span>المعلم: {student.teacher?.fullName || "—"}</span>
            </div>
          </div>
        </header>

        <main className="print-main-space p-5 sm:p-8 space-y-5 print:space-y-3 pt-0">

          {/* ═══════════════════════════════════════════════════════════
              2. CENTRAL FLOATING SCORE MEDAL CARD (كرت النتيجة البارز في المنتصف)
             ═══════════════════════════════════════════════════════════ */}
          <section className="text-center relative -mt-11 sm:-mt-13 z-10 print:-mt-10">
            <div className="print-score-card inline-flex flex-col items-center bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#E5DEC9] shadow-lg print:shadow-none print:border-gray-200">
              
              {/* Progress Ring with percentage */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center print:w-24 print:h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="7" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={grade.color} strokeWidth="7"
                    strokeDasharray={`${(finalScore / 100) * 264} 264`} strokeLinecap="round" />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold text-[#9CA3AF] uppercase print:text-[7px]">النتيجة النهائية</span>
                  <span className="text-[30px] sm:text-[36px] font-extrabold font-heading leading-none print:text-[24px]" style={{ color: grade.color }}>
                    {finalScore % 1 === 0 ? finalScore : finalScore.toFixed(1)}<span className="text-[16px] print:text-[12px]">%</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#374151] print:text-[8px]">{grade.label}</span>
                </div>
              </div>

              {/* Stars */}
              <div className="mt-1.5 flex items-center gap-1 text-lg text-[#D97706] print:text-sm print:mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < starCount ? "opacity-100" : "opacity-25"}>★</span>
                ))}
              </div>

              {/* Grade Ribbon Tag */}
              <div className="mt-2 px-4 py-0.5 rounded-full text-[12px] font-bold text-white shadow-xs font-heading print:text-[10px] print:mt-1" style={{ backgroundColor: grade.color }}>
                تقدير عام: {grade.label}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              3. ACADEMIC PERFORMANCE (Progress Bars للمواد)
             ═══════════════════════════════════════════════════════════ */}
          <section className="space-y-2 pt-1 print:pt-0 print:space-y-1">
            <h3 className="text-[14px] font-bold font-heading text-[#0C5C5E] print:text-[12px]">
              الأداء الأكاديمي
            </h3>
            <div className="bg-white rounded-xl border border-[#E5E3DF] p-3.5 sm:p-4 space-y-3 print:p-2.5 print:space-y-2">
              {subjectItems.map((item, i) => {
                const sColor = item.score >= 85 ? "#059669" : item.score >= 75 ? "#0C5C5E" : item.score >= 60 ? "#D97706" : "#DC2626";
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px] print:text-[10px]">
                      <span className="font-semibold text-[#374151]">{item.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: sColor }}>{item.score % 1 === 0 ? item.score : item.score.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden print:h-1.5">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.score}%`, backgroundColor: sColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              4. SNAPSHOT (نقاط القوة وفرص التحسين في صف واحد)
             ═══════════════════════════════════════════════════════════ */}
          {(snapshot.strengths.length > 0 || snapshot.improvementAreas.length > 0) && (
            <section className="grid grid-cols-2 gap-2.5 print:gap-2">
              {snapshot.strengths.length > 0 && (
                <div className="bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] p-3 print:p-2">
                  <h4 className="text-[12px] font-bold text-[#166534] mb-1 font-heading print:text-[10px]">✨ نقاط القوة</h4>
                  <ul className="space-y-1 text-[11px] text-[#15803D] print:text-[9px]">
                    {snapshot.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="font-bold text-[#16A34A]">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {snapshot.improvementAreas.length > 0 && (
                <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-3 print:p-2">
                  <h4 className="text-[12px] font-bold text-[#92400E] mb-1 font-heading print:text-[10px]">🌱 فرص التحسين</h4>
                  <ul className="space-y-1 text-[11px] text-[#B45309] print:text-[9px]">
                    {snapshot.improvementAreas.map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="font-bold text-[#D97706]">↑</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              5. TEACHER MESSAGE (رسالة المعلم)
             ═══════════════════════════════════════════════════════════ */}
          <section className="space-y-1.5 print:space-y-1">
            <h3 className="text-[14px] font-bold font-heading text-[#0C5C5E] print:text-[12px]">
              رسالة المعلم
            </h3>
            <div className="bg-[#FAF7F0] rounded-xl border-r-4 border-[#0C5C5E] p-3 sm:p-3.5 text-[12px] sm:text-[13px] text-[#374151] leading-relaxed print:p-2 print:text-[10px]">
              <p>"{autoFeedback}"</p>
              <p className="text-[10px] font-bold text-[#0C5C5E] mt-1.5 text-left print:text-[9px] print:mt-1">— المعلم: {student.teacher?.fullName || "معلم الحلقة"}</p>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              6. FAMILY RECOMMENDATIONS (توصيات للأسرة)
             ═══════════════════════════════════════════════════════════ */}
          {recommendations.length > 0 && (
            <section className="space-y-1.5 print:space-y-1">
              <h3 className="text-[14px] font-bold font-heading text-[#0C5C5E] print:text-[12px]">
                توصيات للأسرة
              </h3>
              <div className="bg-white rounded-xl border border-[#E5E3DF] p-3 space-y-1.5 text-[12px] text-[#374151] print:p-2 print:text-[9.5px] print:space-y-1">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0 w-3.5 h-3.5 rounded-full bg-[#0C5C5E]/10 text-[#0C5C5E] font-bold text-[9px] flex items-center justify-center mt-0.5 print:w-3 print:h-3 print:text-[8px]">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              7. CLOSING DU'A & FOOTER (الدعاء المباشر بدون عنوان)
             ═══════════════════════════════════════════════════════════ */}
          <section className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-3 text-center print:p-2">
            <p className="text-[12px] sm:text-[13px] text-[#047857] leading-relaxed font-medium max-w-[500px] mx-auto print:text-[9.5px]">
              «نسأل الله أن يبارك في الطالب <strong className="font-bold text-[#065F46]">{firstName}</strong>، وأن يجعله من أهل القرآن وخاصته، وأن ينفع به والده وأمه.»
            </p>
          </section>

        </main>

        {/* Clean Footer */}
        <footer className="bg-[#FAF7F0] border-t border-[#EAE3D2] px-5 py-3 text-center text-[10px] text-[#6B7280] print:py-2 print:text-[9px]">
          <p className="font-bold text-[#0C5C5E]">تحفيظ الرحمة للقرآن الكريم</p>
          <p className="text-[9px] text-[#9CA3AF] mt-0.5 print:text-[8px]">الدورة الصيفية — تركيا 2026</p>
        </footer>

      </div>
    </div>
  );
}
