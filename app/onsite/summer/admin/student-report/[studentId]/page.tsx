import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
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

export default async function AdminStudentReportPage({ params }: Props) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) redirect("/onsite/summer/admin/login");

  const admin = await prisma.user.findFirst({
    where: { id: userId, isActive: true, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) redirect("/onsite/summer/admin/login");

  const { studentId } = await params;

  const student = await prisma.student.findFirst({
    where: { id: studentId, isActive: true, studyMode: "ONSITE_SUMMER" },
    select: {
      id: true,
      fullName: true,
      summerGroup: true,
      studentCode: true,
      parentWhatsapp: true,
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

  // Admin view includes full internal metrics (Attendance & Behavior)
  const allSubjectCards = track === "QURAN"
    ? [
      { label: "اختبار القرآن", score: es.quranExam, weight: "75%", icon: "📖" },
      { label: "التربية الإيمانية", score: es.tarbiyaExam, weight: "10%", icon: "🌙" },
      { label: "درجة السلوك", score: es.behaviorScore, weight: "8%", icon: "🤝" },
      { label: "درجة الحضور", score: es.attendanceScore, weight: "7%", icon: "📅" },
    ]
    : [
      { label: "اختبار نور البيان", score: es.noorBayanExam, weight: "60%", icon: "📖" },
      { label: "قصار السور", score: es.qisarSuwarExam, weight: "15%", icon: "🕋" },
      { label: "التربية الإيمانية", score: es.tarbiyaExam, weight: "10%", icon: "🌙" },
      { label: "درجة السلوك", score: es.behaviorScore, weight: "8%", icon: "🤝" },
      { label: "درجة الحضور", score: es.attendanceScore, weight: "7%", icon: "📅" },
    ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-12">
      {/* Top Admin Action Navigation Bar */}
      <nav className="bg-[#0C5C5E] text-white px-4 py-3 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="mx-auto max-w-[800px] flex items-center justify-between">
          <Link href="/onsite/summer/admin" className="flex items-center gap-1.5 text-[12px] font-bold text-white/90 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            العودة للوحة الإدارة
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/onsite/summer/parent-report/${student.id}`} target="_blank"
              className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white transition-colors">
              👁️ رابط ولي الأمر
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[700px] px-4 py-6 print:px-8 print:py-4 print:max-w-none">

        {/* Admin Badge Header */}
        <div className="rounded-lg bg-[#0C5C5E]/10 border border-[#0C5C5E]/20 p-2.5 mb-4 text-center text-[12px] font-bold text-[#0C5C5E] flex items-center justify-between print:hidden">
          <span>👑 النسخة الإدارية الشاملة (تتضمن الحضور والسلوك)</span>
          {needsCommitment && (
            <span className="bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded text-[10px]">
              يلزم تعهد (الدرجة أقل من 75%)
            </span>
          )}
        </div>

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
            تقرير تقدم الطالب الشامل (إدارة)
          </div>
        </header>

        {/* ═══ 2. STUDENT INFO ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4 print:p-3 print:mb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-[13px] print:text-[11px]">
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">اسم الطالب</span>
              <p className="font-bold text-[#1F2937]">{student.fullName}</p>
            </div>
            <div>
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">كود الطالب</span>
              <p className="font-bold text-[#0C5C5E]">{student.studentCode || "—"}</p>
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
              <span className="text-[#9CA3AF] text-[11px] print:text-[9px]">رقم ولي الأمر</span>
              <p className="font-semibold text-[#374151]" dir="ltr">{student.parentWhatsapp || "—"}</p>
            </div>
          </div>
        </section>

        {/* ═══ 3. FINAL RESULT ═══ */}
        <section className="rounded-xl border-2 overflow-hidden mb-4 print:mb-3" style={{ borderColor: grade.color }}>
          <div className="p-5 text-center print:p-3" style={{ backgroundColor: grade.bgColor }}>
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
          </div>
        </section>

        {/* ═══ 4. INTERNAL ATTENDANCE & BEHAVIOR SUMMARY (Admin Only) ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4">
          <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3">🛡️ التقييم الداخلي والسلوك (خاص بالإدارة)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-[#EDF5F4] rounded-lg p-2.5">
              <p className="text-[10px] text-[#9CA3AF]">نسبة الحضور</p>
              <p className="text-[18px] font-bold text-[#0C5C5E] mt-0.5">{dm.attendanceRate}%</p>
              <p className="text-[9px] text-[#6B7280]">{dm.presentDays} من أصل {dm.totalWorkingDays} يوم</p>
            </div>
            <div className="bg-[#FEF2F2] rounded-lg p-2.5">
              <p className="text-[10px] text-[#9CA3AF]">أيام الغياب</p>
              <p className="text-[18px] font-bold text-[#DC2626] mt-0.5">{dm.absentDays}</p>
              <p className="text-[9px] text-[#6B7280]">أيام غياب مسجلة</p>
            </div>
            <div className="bg-[#FFFBEB] rounded-lg p-2.5">
              <p className="text-[10px] text-[#9CA3AF]">متوسط السلوك</p>
              <p className="text-[18px] font-bold text-[#D97706] mt-0.5">{dm.avgBehavior} / 5</p>
              <p className="text-[9px] text-[#6B7280]">تقييم المعلم اليومي</p>
            </div>
            <div className="bg-[#F0FDF4] rounded-lg p-2.5">
              <p className="text-[10px] text-[#9CA3AF]">درجة الانضباط</p>
              <p className="text-[18px] font-bold text-[#059669] mt-0.5">{dm.consistencyScore}%</p>
              <p className="text-[9px] text-[#6B7280]">مقياس الانتظام</p>
            </div>
          </div>
        </section>

        {/* ═══ 5. ACADEMIC PERFORMANCE (All Components) ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4">
          <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3">📊 مكونات الدرجة الكلية</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allSubjectCards.map((card, i) => {
              const g = getGradeLevel(card.score);
              return (
                <div key={i} className="rounded-lg border p-2.5 text-center" style={{ borderColor: g.color + "30", backgroundColor: g.bgColor }}>
                  <p className="text-[18px] mb-0.5">{card.icon}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{card.label}</p>
                  <p className="text-[20px] font-extrabold font-heading mt-0.5" style={{ color: g.color }}>
                    {card.score % 1 === 0 ? card.score : card.score.toFixed(1)}
                  </p>
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: g.color }}>{g.label}</p>
                  <p className="text-[8px] text-[#D1D5DB] mt-0.5">الوزن: {card.weight}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ 6. STUDENT SNAPSHOT ═══ */}
        {(snapshot.strengths.length > 0 || snapshot.improvementAreas.length > 0) && (
          <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4">
            <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3">📋 ملخص الطالب</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {snapshot.strengths.length > 0 && (
                <div className="bg-[#ECFDF5] rounded-lg p-3">
                  <p className="text-[11px] font-bold text-[#059669] mb-1.5">نقاط القوة</p>
                  <ul className="space-y-1">
                    {snapshot.strengths.map((s, i) => (
                      <li key={i} className="text-[12px] text-[#065F46] flex items-start gap-1">
                        <span className="text-[#059669] shrink-0 mt-px">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {snapshot.improvementAreas.length > 0 && (
                <div className="bg-[#FFFBEB] rounded-lg p-3">
                  <p className="text-[11px] font-bold text-[#D97706] mb-1.5">فرص التحسين</p>
                  <ul className="space-y-1">
                    {snapshot.improvementAreas.map((s, i) => (
                      <li key={i} className="text-[12px] text-[#92400E] flex items-start gap-1">
                        <span className="text-[#D97706] shrink-0 mt-px">↑</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ 7. ACHIEVEMENTS ═══ */}
        {achievements.length > 0 && (
          <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4">
            <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3">🏆 الإنجازات</h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((ach, i) => (
                <span key={i} className="inline-block rounded-lg bg-[#EDF5F4] border border-[#0C5C5E]/10 px-3 py-1.5 text-[12px] font-semibold text-[#0C5C5E]">
                  {ach}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 8. TEACHER FEEDBACK ═══ */}
        <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4">
          <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3">💬 ملاحظات المعلم التلقائية</h2>
          <div className="bg-[#F9FAFB] rounded-lg p-3 border-r-3 border-[#0C5C5E]">
            <p className="text-[13px] text-[#374151] leading-relaxed">{autoFeedback}</p>
          </div>
        </section>

        {/* ═══ 9. RECOMMENDATIONS ═══ */}
        {recommendations.length > 0 && (
          <section className="bg-white rounded-xl border border-[#E5E3DF] p-4 mb-4">
            <h2 className="text-[14px] font-bold font-heading text-[#0C5C5E] mb-3">💡 التوصيات المقترحة</h2>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-[#374151]">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#0C5C5E]/10 flex items-center justify-center text-[10px] font-bold text-[#0C5C5E] mt-px">{i + 1}</span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ═══ 10. FOOTER ═══ */}
        <footer className="text-center pt-4 border-t border-[#E5E3DF]">
          <p className="text-[12px] font-bold text-[#0C5C5E]">إدارة تحفيظ الرحمة للقرآن الكريم</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">الدورة الصيفية — تركيا 2026</p>
        </footer>

      </div>
    </div>
  );
}
