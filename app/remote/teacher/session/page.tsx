import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CircleSessionClient from "./CircleSessionClient";

type SessionPageProps = {
  searchParams?: Promise<{
    circleId?: string;
  }>;
};

export default async function RemoteCircleSessionPage({
  searchParams,
}: SessionPageProps) {
  const cookieStore = await cookies();
  const teacherId = cookieStore.get("alrahma_user_id")?.value;
  const params = await searchParams;
  const circleId = params?.circleId || "";

  if (!teacherId) {
    redirect("/remote/teacher/login");
  }

  // 1. Verify Teacher and Circle
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      studyMode: "REMOTE",
      isActive: true,
    },
  });

  if (!teacher) {
    redirect("/remote/teacher/login");
  }

  if (!circleId) {
    return (
      <main className="rahma-shell min-h-screen px-4 py-8" dir="rtl">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
          <p className="text-lg font-black">الرجاء اختيار حلقة للبدء.</p>
          <Link
            href="/remote/teacher/dashboard"
            className="mt-4 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
          >
            الذهاب للوحة المعلم واختيار حلقة
          </Link>
        </div>
      </main>
    );
  }

  const circle = await prisma.circle.findFirst({
    where: {
      id: circleId,
      teacherId: teacher.id,
      studyMode: "REMOTE",
    },
  });

  if (!circle) {
    return (
      <main className="rahma-shell min-h-screen px-4 py-8" dir="rtl">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-red-200 bg-red-50 p-6 text-center text-red-800">
          <p className="text-lg font-black">هذه الحلقة غير تابعة لك أو غير موجودة.</p>
          <Link
            href="/remote/teacher/dashboard"
            className="mt-4 inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            العودة للوحة المعلم
          </Link>
        </div>
      </main>
    );
  }

  // 2. Fetch Students with their last reports
  const studentsRaw = await prisma.student.findMany({
    where: {
      circleId: circle.id,
      isActive: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });

  // For each student, get their previous report to display today's expected task
  const students = await Promise.all(
    studentsRaw.map(async (student) => {
      const lastReport = await prisma.report.findFirst({
        where: {
          studentId: student.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          lessonName: true,
          lessonSurah: true,
          pageFrom: true,
          pageTo: true,
          review: true,
          reviewSurah: true,
          reviewFrom: true,
          reviewTo: true,
          nextHomework: true,
          nextLessonHomework: true,
          nextReviewHomework: true,
          note: true,
        },
      });

      return {
        id: student.id,
        fullName: student.fullName,
        parentWhatsapp: student.parentWhatsapp,
        parentEmail: student.parentEmail,
        lastReport,
      };
    })
  );

  return (
    <CircleSessionClient
      circle={circle}
      students={students}
      teacher={teacher}
    />
  );
}
