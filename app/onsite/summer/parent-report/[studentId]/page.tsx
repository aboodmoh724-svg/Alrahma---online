import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  evaluateStudent,
  getCourseMeta,
  getGradeLevel,
  type StudentEvaluation,
  type Track,
  type DailyReportData,
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

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true, studyMode: "ONSITE_SUMMER" },
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

  if (!evaluation) notFound();

  const { examScores: es, dailyMetrics: dm, grade, finalScore, achievements, snapshot, autoFeedback, recommendations, needsCommitment } = evaluation;

  const trackLabel = track === "QURAN" ? "القرآن الكريم" : "نور البيان";

  // Stars renderer
  const stars = (val: number, max = 5) => {
    const full = Math.round(val);
    return "★".repeat(Math.min(full, max)) + "☆".repeat(max - Math.min(full, max));
  };

  // Subject scores for cards
  const subjectCards = track === "QURAN"
    ? [
      { label: "اختبار القرآن", score: es.quranExam, weight: "75%", icon: "📖" },
      { label: "التربية الإيمانية", score: es.tarbiyaExam, weight: "10%", icon: "🌙" },
    ]
    : [
      { label: "اختبار نور البيان", score: es.noorBayanExam, weight: "60%", icon: "📖" },
      { label: "قصار السور", score: es.qisarSuwarExam, weight: "15%", icon: "🕋" },
      { label: "التربية الإيمانية", score: es.tarbiyaExam, weight: "10%", icon: "🌙" },
    ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] print:bg-white">
      <div className="mx-auto max-w-[700px] px-4 py-6 print:px-8 print:py-4 print:max-w-none">

        {/* ═══ 1. HEADER ═══ */}
        <header className="text-center mb-6 print:mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image src="/images/alrahma_tahfeez_logo.png" alt="تحفيظ الرحمة" width={48} height={48} className="h-12 w-12 rounded-xl object-contain print:h-10 print:w-10" />
            <div>
              <h1 className="text-[20px] sm:text-[24px] font-bold font-heading text-[#0C5C5E] print:text-[18px]">تحفيظ الرحمة للقرآن الكريم</h1>
              <p className="text-[11px] text-[#6B7280] print:text-[9px]">الدورة الصيفية — تركيا 2026</p>
            </div>
          </div>
          <div className="inline-block bg-[#0C5C5E] text-white rounded-lg px-4 py-1.5 text-[13px] font-bold print:text-[11px]">
            تقرير تقدم الطالب
          </div>
        </header>

        {/* ═══ 2. STUDENT INFO ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px] print:text-[11px]">
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">اسم الطالب</span>
              <p className="font-bold text-[#1F2937]">{student.fullName}</p>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">المسار</span>
              <p className="font-bold text-[#0C5C5E]">{trackLabel}</p>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">الحلقة</span>
              <p className="font-semibold text-[#374151]">{student.circle?.name || "—"}</p>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">المعلم</span>
              <p className="font-semibold text-[#374151]">{student.teacher?.fullName || "—"}</p>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">الفترة</span>
              <p className="font-semibold text-[#374151]">9 يوليو – 7 أغسطس 2026</p>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">تاريخ التقرير</span>
              <p className="font-semibold text-[#374151]">{toLocalDateKey(new Date())}</p>
            </div>
          </div>
        </section>

        {/* ═══ 3. FINAL RESULT ═══ */}
        <section className="rounded-xl border-2 overflow-hidden mb-4 print:mb-3" style={{ borderColor: grade.color }}>
          <div className="p-5 text-center print:p-3" style={{ backgroundColor: grade.bgColor }}>
            {/* Score Circle */}
            <div className="inline-flex flex-col items-center">
              <div className="relative w-[100px] h-[100px] print:w-[80px] print:h-[80px]">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E3DF" strokeWidth="6" opacity="0.3" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={grade.color} strokeWidth="6"
                    strokeDasharray={`${(finalScore / 100) * 264} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[28px] font-extrabold font-heading print:text-[22px]" style={{ color: grade.color }}>
                    {finalScore % 1 === 0 ? finalScore : finalScore.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] -mt-1 print:text-[8px]">من 100</span>
                </div>
              </div>
              <div className="mt-2 rounded-lg px-4 py-1 text-[15px] font-bold text-white print:text-[12px]" style={{ backgroundColor: grade.color }}>
                {grade.label}
              </div>
            </div>

            {needsCommitment && (
              <p className="mt-2 text-[11px] font-semibold text-[#DC2626] print:text-[9px]">
                ⚠️ يُنصح بمتابعة خاصة لتحسين المستوى
              </p>
            )}
          </div>
        </section>

        {/* ═══ 4. STUDENT SNAPSHOT ═══ */}
        {(snapshot.strengths.length > 0 || snapshot.improvementAreas.length > 0) && (
          <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
            <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3 print:text-[12px] print:mb-2">📋 ملخص الطالب</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {snapshot.strengths.length > 0 && (
                <div className="bg-[#ECFDF5] rounded-lg p-3 print:p-2">
                  <p className="text-[11px] font-bold text-[#059669] mb-1.5 print:text-[9px]">نقاط القوة</p>
                  <ul className="space-y-1">
                    {snapshot.strengths.map((s, i) => (
                      <li key={i} className="text-[12px] text-[#065F46] flex items-start gap-1 print:text-[10px]">
                        <span className="text-[#059669] shrink-0 mt-px">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {snapshot.improvementAreas.length > 0 && (
                <div className="bg-[#FFFBEB] rounded-lg p-3 print:p-2">
                  <p className="text-[11px] font-bold text-[#D97706] mb-1.5 print:text-[9px]">فرص التحسين</p>
                  <ul className="space-y-1">
                    {snapshot.improvementAreas.map((s, i) => (
                      <li key={i} className="text-[12px] text-[#92400E] flex items-start gap-1 print:text-[10px]">
                        <span className="text-[#D97706] shrink-0 mt-px">↑</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ 5. ACADEMIC PERFORMANCE ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
          <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3 print:text-[12px] print:mb-2">📊 الأداء الأكاديمي</h2>
          <div className={`grid gap-2 ${subjectCards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {subjectCards.map((card, i) => {
              const g = getGradeLevel(card.score);
              return (
                <div key={i} className="rounded-lg border p-3 text-center print:p-2" style={{ borderColor: g.color + "30", backgroundColor: g.bgColor }}>
                  <p className="text-[20px] mb-0.5 print:text-[16px]">{card.icon}</p>
                  <p className="text-[10px] text-[#9CA3AF] print:text-[8px]">{card.label}</p>
                  <p className="text-[22px] font-extrabold font-heading mt-0.5 print:text-[18px]" style={{ color: g.color }}>
                    {card.score % 1 === 0 ? card.score : card.score.toFixed(1)}
                  </p>
                  <p className="text-[10px] font-semibold mt-0.5 print:text-[8px]" style={{ color: g.color }}>{g.label}</p>
                  <p className="text-[8px] text-[#D1D5DB] mt-0.5 print:text-[7px]">الوزن: {card.weight}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ 6. DAILY PROGRESS ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
          <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3 print:text-[12px] print:mb-2">📈 ملخص التقدم خلال الدورة</h2>
          {track === "QURAN" ? (
            <div className="grid grid-cols-3 gap-2">
              <ProgressItem label="حفظ جديد" value={`${dm.memorizationDays} يوم`} sub={`من ${dm.presentDays}`} rate={dm.memorizationRate} />
              <ProgressItem label="مراجعة" value={`${dm.revisionDays} يوم`} sub={`من ${dm.presentDays}`} rate={dm.presentDays > 0 ? Math.round((dm.revisionDays / dm.presentDays) * 100) : 0} />
              <ProgressItem label="تلقين" value={`${dm.taqeenDays} يوم`} sub={`من ${dm.presentDays}`} rate={dm.presentDays > 0 ? Math.round((dm.taqeenDays / dm.presentDays) * 100) : 0} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <ProgressItem label="عدد الدروس" value={`${dm.lessonsCount}`} sub={`من ${dm.presentDays} يوم`} rate={dm.presentDays > 0 ? Math.round((dm.lessonsCount / dm.presentDays) * 100) : 0} />
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-center print:p-2">
                <p className="text-[10px] text-[#9CA3AF] print:text-[8px]">متوسط الواجبات</p>
                <p className="text-[16px] text-[#D97706] mt-1 print:text-[13px]">{stars(dm.avgHomeworkGrade)}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5 print:text-[8px]">{dm.avgHomeworkGrade}/5</p>
              </div>
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-center print:p-2">
                <p className="text-[10px] text-[#9CA3AF] print:text-[8px]">متوسط المشاركة</p>
                <p className="text-[16px] text-[#0C5C5E] mt-1 print:text-[13px]">{stars(dm.avgParticipation)}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5 print:text-[8px]">{dm.avgParticipation}/5</p>
              </div>
            </div>
          )}
        </section>

        {/* ═══ 7. ACHIEVEMENTS ═══ */}
        {achievements.length > 0 && (
          <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
            <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3 print:text-[12px] print:mb-2">🏆 الإنجازات</h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((ach, i) => (
                <span key={i} className="inline-block rounded-lg bg-[#EDF5F4] border border-[#0C5C5E]/10 px-3 py-1.5 text-[12px] font-semibold text-[#0C5C5E] print:text-[10px] print:px-2 print:py-1">
                  {ach}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 8. TEACHER FEEDBACK ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
          <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3 print:text-[12px] print:mb-2">💬 ملاحظات المعلم</h2>
          <div className="bg-[#F9FAFB] rounded-lg p-3 border-r-3 border-[#0C5C5E] print:p-2">
            <p className="text-[13px] text-[#374151] leading-relaxed print:text-[11px]">{autoFeedback}</p>
          </div>
        </section>

        {/* ═══ 9. RECOMMENDATIONS ═══ */}
        {recommendations.length > 0 && (
          <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
            <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3 print:text-[12px] print:mb-2">💡 التوصيات</h2>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[#374151] print:text-[10px]">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#0C5C5E]/10 flex items-center justify-center text-[10px] font-bold text-[#0C5C5E] mt-px print:w-4 print:h-4 print:text-[8px]">{i + 1}</span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ═══ 10. FOOTER ═══ */}
        <footer className="text-center pt-4 border-t border-[#E5E3DF] print:pt-2">
          <p className="text-[12px] font-bold text-[#0C5C5E] print:text-[10px]">إدارة تحفيظ الرحمة للقرآن الكريم</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5 print:text-[8px]">الدورة الصيفية — تركيا 2026</p>
          <p className="text-[9px] text-[#D1D5DB] mt-1 print:text-[7px]">«خيركم من تعلم القرآن وعلمه»</p>
        </footer>

      </div>
    </div>
  );
}

// ── Sub-component ──
function ProgressItem({ label, value, sub, rate }: { label: string; value: string; sub: string; rate: number }) {
  const barColor = rate >= 80 ? "#059669" : rate >= 50 ? "#0C5C5E" : "#D97706";
  return (
    <div className="rounded-lg bg-[#F9FAFB] p-3 text-center print:p-2">
      <p className="text-[10px] text-[#9CA3AF] print:text-[8px]">{label}</p>
      <p className="text-[18px] font-bold text-[#1F2937] mt-1 print:text-[14px]">{value}</p>
      <p className="text-[9px] text-[#D1D5DB] print:text-[7px]">{sub}</p>
      <div className="mt-1.5 h-1.5 bg-[#E5E3DF] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(rate, 3)}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
