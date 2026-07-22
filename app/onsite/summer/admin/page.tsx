import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SummerAdminDashboard from "@/components/admin/SummerAdminDashboard";
import { getSummerEducationTopics } from "@/lib/summer-education-plan";

export default async function OnsiteSummerAdminPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    redirect("/onsite/summer/admin/login");
  }

  const admin = await prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (!admin) {
    redirect("/onsite/summer/admin/login");
  }

  const [students, circles, teachers, educationTopics] = await Promise.all([
    prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
      include: {
        circle: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
        summerReports: {
          orderBy: { dateKey: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.circle.findMany({
      where: { studyMode: "ONSITE_SUMMER" },
      select: { id: true, name: true, teacherId: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER", isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    getSummerEducationTopics(),
  ]);

  return (
    <main className="min-h-screen bg-[#f6eee7] p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <SummerAdminDashboard
          initialStudents={students}
          initialCircles={circles}
          initialTeachers={teachers}
          initialEducationTopics={educationTopics}
        />
      </div>
    </main>
  );
}
