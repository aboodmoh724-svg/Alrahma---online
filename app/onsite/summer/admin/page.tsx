import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/auth/LogoutButton";
import SummerAdminDashboard from "@/components/admin/SummerAdminDashboard";

async function getCurrentOnsiteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

export default async function OnsiteSummerAdminPage() {
  const admin = await getCurrentOnsiteAdmin();

  if (!admin) {
    redirect("/onsite/summer/admin/login");
  }

  // Fetch all circles under ONSITE_SUMMER
  const circles = await prisma.circle.findMany({
    where: {
      studyMode: "ONSITE_SUMMER",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      teacher: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  // Fetch all teachers to assign students/circles
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      isActive: true,
    },
    orderBy: {
      fullName: "asc",
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  // Fetch all students under ONSITE_SUMMER
  const students = await prisma.student.findMany({
    where: {
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    },
    orderBy: {
      fullName: "asc",
    },
    select: {
      id: true,
      fullName: true,
      parentWhatsapp: true,
      summerGroup: true,
      circleId: true,
      teacherId: true,
      circle: {
        select: {
          id: true,
          name: true,
        },
      },
      teacher: {
        select: {
          id: true,
          fullName: true,
        },
      },
      summerReports: {
        orderBy: {
          createdAt: "desc",
        },
        take: 30, // Get recent reports
        select: {
          id: true,
          dateKey: true,
          status: true,
          dailySent: true,
          dailySentAt: true,
          dailySentError: true,
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
      },
    },
  });

  return (
    <main className="rahma-shell min-h-screen bg-gradient-to-br from-[#faf6ed] via-[#fff] to-[#f4eee0] p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Admin Header */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(189,143,45,0.15),transparent_45%)]" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black text-[#d8bf83] backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                لوحة التحكم الإدارية
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">إدارة الدورة الصيفية</h1>
              <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-xl">
                متابعة تقارير المعلمين وحالات الغياب، والتحكم بالطلاب والحلقات الصيفية، وإرسال التقارير اليومية والأسبوعية لأهالي الطلاب.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/onsite/admin/dashboard"
                className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-white border border-white/10 backdrop-blur transition hover:bg-white/16"
              >
                اللوحة العامة لحضوري
              </Link>
              <LogoutButton className="rounded-2xl bg-red-600/90 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 shadow-md" />
            </div>
          </div>
        </section>

        {/* Dashboard Component */}
        <SummerAdminDashboard
          initialCircles={circles}
          initialTeachers={teachers}
          initialStudents={students as any}
        />
      </div>
    </main>
  );
}
