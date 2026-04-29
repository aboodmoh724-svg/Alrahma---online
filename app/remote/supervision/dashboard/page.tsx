import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/auth/LogoutButton";
import { prisma } from "@/lib/prisma";

const sections = [
  {
    href: "/remote/supervision/students",
    title: "الطلاب",
    description: "عرض بيانات الطلاب وتوزيعهم على الحلقات والمعلمين فقط.",
    tone: "bg-[#1f6358] text-white",
  },
  {
    href: "/remote/supervision/teachers",
    title: "المعلمون والحلقات",
    description: "بطاقات المعلمين مع الحلقات والطلاب وروابط الدروس والمسارات.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/supervision/operations",
    title: "المتابعة الإشرافية",
    description: "طلبات المعلمين والمهام والزيارات والطلبات المحولة من الإدارة في مكان واحد.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/supervision/reports",
    title: "تقارير الطلاب",
    description: "متابعة السير العام للطلاب والتعثر والغيابات والتواصل مع أولياء الأمور.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/supervision/statistics",
    title: "الإحصائيات والمتابعة",
    description: "نظرة عامة على المعلمين والطلاب والحلقات والطلاب بلا حلقة.",
    tone: "bg-[#173d42] text-white",
  },
];

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
      fullName: true,
      canAccessFinance: true,
    },
  });
}

export default async function RemoteSupervisionDashboardPage() {
  const supervisor = await getCurrentSupervisor();

  const [
    studentsCount,
    teachersCount,
    circlesCount,
    openTeacherRequestsCount,
    forwardedRegistrationsCount,
    supervisionTasksCount,
  ] = await Promise.all([
    prisma.student.count({ where: { studyMode: "REMOTE", isActive: true } }),
    prisma.user.count({ where: { studyMode: "REMOTE", role: "TEACHER", isActive: true } }),
    prisma.circle.count({ where: { studyMode: "REMOTE" } }),
    prisma.teacherRequest.count({
      where: {
        status: { in: ["NEW", "IN_REVIEW"] },
      },
    }),
    prisma.registrationRequest.count({
      where: {
        forwardedToSupervisionAt: { not: null },
        supervisionStatus: { in: ["PENDING", "UNDER_REVIEW", "ON_HOLD"] },
      },
    }),
    prisma.supervisionTask.count({
      where: {
        status: { in: ["NEW", "IN_PROGRESS", "WAITING"] },
      },
    }),
  ]);

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                لوحة الإشراف
              </p>
              <Link
                href="/remote"
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42]"
              >
                بوابات الدخول
              </Link>
              {supervisor?.canAccessFinance ? (
                <Link
                  href="/remote/admin/dashboard"
                  className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42]"
                >
                  لوحة الإدارة
                </Link>
              ) : null}
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2] disabled:opacity-60" />
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              واجهة إشراف مستقلة لمتابعة الطلاب والمعلمين والمهام اليومية.
            </h1>
            <p className="mt-4 text-sm leading-8 text-white/72">
              {supervisor?.fullName
                ? `أهلًا بك ${supervisor.fullName}. هذه الواجهة مخصصة للمتابعة الإشرافية اليومية بعد أن تجهز الإدارة الطلبات والدفعات.`
                : "هذه الواجهة مخصصة للمتابعة الإشرافية اليومية بعد أن تجهز الإدارة الطلبات والدفعات."}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الطلاب</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">{studentsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المعلمون</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">{teachersCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الحلقات</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">{circlesCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طلبات المعلمين المفتوحة</p>
            <p className="mt-2 text-4xl font-black text-[#1f6358]">{openTeacherRequestsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طلبات بانتظار الإشراف</p>
            <p className="mt-2 text-4xl font-black text-[#8a6335]">{forwardedRegistrationsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المهام الإشرافية المفتوحة</p>
            <p className="mt-2 text-4xl font-black text-[#8a6335]">{supervisionTasksCount}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const badge =
              section.href === "/remote/supervision/students"
                ? studentsCount
                : section.href === "/remote/supervision/teachers"
                  ? circlesCount
                  : section.href === "/remote/supervision/operations"
                    ? openTeacherRequestsCount + forwardedRegistrationsCount + supervisionTasksCount
                    : null;

            return (
              <Link
                key={section.href}
                href={section.href}
                className={`relative min-h-48 overflow-hidden rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${section.tone}`}
              >
                {badge !== null && badge > 0 ? (
                  <span className="absolute left-5 top-5 rounded-full bg-[#c39a62] px-3 py-1 text-xs font-black text-white shadow-sm">
                    +{badge}
                  </span>
                ) : null}
                <h2 className="text-2xl font-black">{section.title}</h2>
                <p className="mt-4 text-sm leading-8 opacity-75">{section.description}</p>
                <span className="mt-6 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
                  فتح القسم
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
