import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import SummerReportForm from "@/components/teacher/SummerReportForm";
import LogoutButton from "@/components/LogoutButton";
import { getTodayDateKey } from "@/lib/date-utils";

type ReportPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    dateKey?: string;
  }>;
};

export default async function OnsiteSummerTeacherReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/onsite/summer/teacher/login");
  }

  const teacher = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, fullName: true, role: true },
  });

  if (!teacher) {
    redirect("/onsite/summer/teacher/login");
  }

  const { studentId } = await params;
  const sParams = (await searchParams) || {};
  const todayStr = getTodayDateKey();
  const targetDateKey = sParams.dateKey && /^\d{4}-\d{2}-\d{2}$/.test(sParams.dateKey) ? sParams.dateKey : todayStr;

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
        where: { dateKey: targetDateKey },
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

  // Fetch all teacher's students to calculate progress stats
  const allStudents = await prisma.student.findMany({
    where: {
      isActive: true,
      studyMode: "ONSITE_SUMMER",
      OR: [
        { teacherId: userId },
        { studentCode: "7500" },
      ],
    },
    select: {
      id: true,
      summerReports: {
        where: { dateKey: targetDateKey },
        select: { id: true },
      },
    },
  });

  const totalCount = allStudents.length;
  const filledCount = allStudents.filter((s) => s.summerReports.length > 0).length;
  const remainingCount = totalCount - filledCount;

  // Fetch the last actual PRESENT report for pre-filling default quranNew from last quranTaqeen
  const lastPresentReport = await prisma.summerReport.findFirst({
    where: {
      studentId: student.id,
      status: "PRESENT",
      dateKey: { lt: targetDateKey },
    },
    orderBy: { dateKey: "desc" },
    select: {
      dateKey: true,
      quranTaqeen: true,
      quranRevision: true,
      noorLearned: true,
    },
  });

  const existingReport = student.summerReports[0] || null;
  const initialStartProgress = student.teacherProgressRecords[0] || null;

  return (
    <div className="min-h-screen pb-16">
      {/* ═══════════════ SIGNATURE HEADER ═══════════════ */}
      <header className="bg-[#0C5C5E] text-white sticky top-0 z-40">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Right: Logo + Back */}
            <div className="flex items-center gap-3">
              <Link href="/onsite/summer/teacher" className="flex items-center gap-2 hover:opacity-90 transition">
                <Image
                  src="/images/alrahma_tahfeez_logo.png"
                  alt="تحفيظ الرحمة"
                  width={38}
                  height={38}
                  className="h-[38px] w-[38px] rounded-lg object-contain"
                />
                <div className="hidden sm:block h-8 w-px bg-white/20" />
                <div>
                  <h1 className="text-[15px] font-bold font-heading text-white leading-tight">
                    تحفيظ الرحمة
                  </h1>
                  <p className="text-[11px] font-medium text-white/60 hidden sm:block">
                    رصد تقرير طالب
                  </p>
                </div>
              </Link>
            </div>

            {/* Left: Teacher info + Logout */}
            <div className="flex items-center gap-3">
              <div className="text-left hidden sm:block">
                <span className="block text-[13px] font-semibold text-white/90">
                  {teacher.fullName}
                </span>
                <span className="block text-[11px] text-white/50">
                  تاريخ التقرير: {targetDateKey}
                </span>
              </div>
              <LogoutButton
                redirectUrl="/onsite/summer"
                className="h-9 w-9 rounded-lg bg-transparent hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition border border-transparent hover:border-white/20"
              />
            </div>
          </div>
        </div>

        {/* Decorative strip */}
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #0C5C5E, #1A8A8D, #0C5C5E)',
          }}
        />
      </header>

      {/* ═══════════════ WORKSPACE CONTAINER ═══════════════ */}
      <main className="mx-auto max-w-[800px] px-4 sm:px-6 pt-6 space-y-4">
        {/* Navigation & Daily Progress Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-xl p-4 border border-[#E5E3DF] shadow-xs">
          <Link
            href={`/onsite/summer/teacher?dateKey=${targetDateKey}`}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-[#0C5C5E] hover:text-[#0A4D4F] transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 19 12 12 5"/></svg>
            <span>العودة لقائمة طلاب الحلقة</span>
          </Link>

          {/* Daily progress counter */}
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#6B7280]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>تم رصد <b className="text-[#059669] font-bold">{filledCount}</b> من <b className="text-[#1F2937] font-bold">{totalCount}</b> طلاب</span>
            {remainingCount > 0 && (
              <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-2 py-0.5 rounded-md mr-1">
                بقي {remainingCount}
              </span>
            )}
          </div>
        </div>

        {/* The Form Component */}
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
          dateKey={targetDateKey}
        />
      </main>
    </div>
  );
}
