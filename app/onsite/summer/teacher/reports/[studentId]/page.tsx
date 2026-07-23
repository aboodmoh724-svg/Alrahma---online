import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SummerReportForm from "@/components/teacher/SummerReportForm";

type ReportPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function OnsiteSummerTeacherReportPage({
  params,
}: ReportPageProps) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/onsite/summer/teacher/login");
  }

  const { studentId } = await params;
  const todayStr = new Date().toISOString().split("T")[0];

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      studyMode: "ONSITE_SUMMER",
      OR: [
        { teacherId: userId },
        { studentCode: "7500" },
      ],
    },
    include: {
      circle: { select: { name: true } },
      summerReports: {
        where: { dateKey: todayStr },
        take: 1,
      },
      teacherProgressRecords: {
        where: { teacherId: userId },
        take: 1,
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Fetch the last actual PRESENT report for pre-filling default quranNew from last quranTaqeen
  const lastPresentReport = await prisma.summerReport.findFirst({
    where: {
      studentId: student.id,
      status: "PRESENT",
      dateKey: { lt: todayStr },
    },
    orderBy: { dateKey: "desc" },
    select: {
      quranTaqeen: true,
      quranRevision: true,
      noorLearned: true,
    },
  });

  const existingReport = student.summerReports[0] || null;
  const initialStartProgress = student.teacherProgressRecords[0] || null;

  return (
    <main
      className="min-h-screen bg-[#f6eee7] text-[#18322a] p-4 sm:p-6"
      dir="rtl"
      style={{
        background:
          "radial-gradient(circle at 12% 12%, rgba(189,143,45,0.14), transparent 26%), linear-gradient(135deg, #fbf6ef 0%, #f6eee7 48%, #eef6ef 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/onsite/summer/teacher"
            className="inline-flex items-center gap-1 text-sm font-black text-[#0f5a35] hover:underline"
          >
            ➜ العودة لقائمة الطلاب
          </Link>
          <span className="text-xs font-bold text-[#bd8f2d]">
            تقرير الدورة الصيفية اليومي
          </span>
        </div>

        <SummerReportForm
          student={{
            id: student.id,
            fullName: student.fullName,
            summerGroup: student.summerGroup,
            circleName: student.circle?.name,
          }}
          existingReport={existingReport}
          lastPresentReport={lastPresentReport}
          initialStartProgress={initialStartProgress}
          dateKey={todayStr}
        />
      </div>
    </main>
  );
}
