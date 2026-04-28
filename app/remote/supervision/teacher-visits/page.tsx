import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TeacherVisitsPageClient from "@/components/supervision/TeacherVisitsPageClient";
import { prisma } from "@/lib/prisma";

async function getCurrentSupervisor() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      canAccessSupervision: true,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

export default async function RemoteSupervisionTeacherVisitsPage() {
  const supervisor = await getCurrentSupervisor();

  if (!supervisor) {
    redirect("/remote/supervision/login");
  }

  const [teachers, reports] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "TEACHER",
        studyMode: "REMOTE",
        isActive: true,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
      },
    }),
    prisma.teacherVisitReport.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 30,
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
  ]);

  return (
    <TeacherVisitsPageClient
      supervisorName={supervisor.fullName}
      teachers={teachers}
      initialReports={reports}
    />
  );
}
