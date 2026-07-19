import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getIstanbulDateKey } from "@/lib/school-day";
import SummerReportForm from "@/components/teacher/SummerReportForm";

type ReportPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function OnsiteSummerReportPage({ params }: ReportPageProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;

  if (!teacherId) {
    redirect("/onsite/teacher/login");
  }

  // Get and resolve parameters
  const resolvedParams = await params;
  const studentId = resolvedParams.studentId;

  // Verify the teacher exists and has access
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      isActive: true,
    },
  });

  if (!teacher) {
    redirect("/onsite/teacher/login");
  }

  // Fetch the student
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      summerGroup: true,
    },
  });

  if (!student) {
    notFound();
  }

  const todayKey = getIstanbulDateKey(new Date());

  // Fetch today's existing report if it exists
  const existingReport = await prisma.summerReport.findFirst({
    where: {
      studentId: student.id,
      dateKey: todayKey,
    },
    select: {
      id: true,
      status: true,
      quranNew: true,
      quranRevision: true,
      quranTaqeen: true,
      noorLearned: true,
      noorHomework: true,
      noorHomeworkGrade: true,
      noorParticipation: true,
      behaviorGrade: true,
      behaviorNotes: true,
    },
  });

  return (
    <main className="rahma-shell min-h-screen bg-gradient-to-br from-[#faf6ed] via-[#fff] to-[#f4eee0] p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* Navigation / Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/onsite/summer/teacher"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0f5a35] hover:underline"
          >
            ← العودة إلى لوحة التحكم
          </Link>
          <span className="text-xs font-bold text-slate-400 bg-white/60 border border-slate-200/50 rounded-full px-3 py-1">
            التاريخ اليومي: {todayKey}
          </span>
        </div>

        {/* Header summary of student */}
        <header className="rounded-3xl border border-[#d8bf83]/20 bg-[#0a3f2a] p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(189,143,45,0.12),transparent_40%)]" />
          <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#d8bf83] backdrop-blur-sm">
                {student.summerGroup === "QURAN" ? "📖 مسار القرآن الكريم" : "✨ مسار نور البيان"}
              </span>
              <h1 className="mt-3 text-2xl font-black">{student.fullName}</h1>
              <p className="mt-1 text-xs text-white/65">
                {existingReport ? "تعديل التقرير الموثق اليوم للطالب." : "تعبئة ورصد تقرير اليوم للطالب."}
              </p>
            </div>
          </div>
        </header>

        {/* Report entry Form */}
        <SummerReportForm
          student={student}
          initialReport={existingReport}
          todayKey={todayKey}
        />
      </div>
    </main>
  );
}
