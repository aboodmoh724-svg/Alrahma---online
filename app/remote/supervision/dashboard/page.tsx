import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import DashboardSectionLink from "@/components/supervision/DashboardSectionLink";
import { prisma } from "@/lib/prisma";

const sections = [
  {
    href: "/remote/supervision/students",
    title: "الطلاب",
    description: "توزيع الطلاب على الحلقات والمعلمين ومراجعة غير المسكنين.",
    tone: "bg-[#0f5a35] text-white",
  },
  {
    href: "/remote/supervision/teachers",
    title: "المعلمون والحلقات",
    description: "فتح الحلقات والوصول السريع إلى روابطها ومواعيدها ومساراتها.",
    tone: "bg-[#f6eee7] text-[#0a3f2a]",
  },
  {
    href: "/remote/supervision/operations",
    title: "المتابعة الإشرافية",
    description: "طلبات المعلمين والمهام والزيارات وطلبات التسجيل في مكان واحد.",
    tone: "bg-[#0a3f2a] text-white",
  },
  {
    href: "/remote/supervision/messages",
    title: "رسائل أولياء الأمور",
    description: "قوالب واتساب جاهزة للتعثر والغياب والتعميمات الإشرافية مع تعديل النص قبل الإرسال.",
    tone: "bg-[#fffaf4] text-[#0a3f2a]",
  },
  {
    href: "/remote/supervision/conversations",
    title: "مراسلات التعليم اليومية",
    description: "محادثات ولي الأمر مع المعلم أو الإشراف داخل النظام، مع عرض الأسماء والرد من الجوال بسهولة.",
    tone: "bg-white text-[#0a3f2a]",
  },
  {
    href: "/remote/supervision/reports",
    title: "تقارير الطلاب",
    description: "إحصائيات عامة وتفاصيل كل طالب في صفحة واحدة سهلة القراءة.",
    tone: "bg-white text-[#0a3f2a]",
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

  if (!supervisor) {
    redirect("/remote/supervision/login");
  }

  const [
    studentsCount,
    teachersCount,
    circlesCount,
    openTeacherRequestsCount,
    urgentTeacherRequestsCount,
    forwardedRegistrationsCount,
    supervisionTasksCount,
    unreadParentMessagesCount,
    complaintsCount,
  ] = await Promise.all([
    prisma.student.count({ where: { studyMode: "REMOTE", isActive: true } }),
    prisma.user.count({ where: { studyMode: "REMOTE", role: "TEACHER", isActive: true } }),
    prisma.circle.count({ where: { studyMode: "REMOTE" } }),
    prisma.teacherRequest.count({
      where: {
        target: "SUPERVISION",
        status: { in: ["NEW", "IN_REVIEW"] },
      },
    }),
    prisma.teacherRequest.count({
      where: {
        target: "SUPERVISION",
        priority: "URGENT",
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
    prisma.whatsAppIncomingMessage.count({
      where: {
        channel: "REMOTE",
        followUpStatus: { in: ["NEW", "IN_REVIEW"] },
      },
    }),
    prisma.whatsAppIncomingMessage.count({
      where: {
        channel: "REMOTE",
        category: "COMPLAINT",
        followUpStatus: { in: ["NEW", "IN_REVIEW"] },
      },
    }),
  ]);

  const notificationItems = [
    {
      key: "registrations",
      title: "طلبات تسجيل بانتظار الإشراف",
      description: "طلاب محولون من الإدارة يحتاجون مقابلة أو وضعا في حلقة.",
      href: "/remote/supervision/registrations",
      count: forwardedRegistrationsCount,
      tone: "amber" as const,
    },
    {
      key: "parent-messages",
      title: "رسائل أولياء الأمور",
      description: "ردود جديدة تحتاج متابعة من الإشراف.",
      href: "/remote/supervision/messages",
      count: unreadParentMessagesCount,
      tone: "green" as const,
    },
    {
      key: "complaints",
      title: "شكاوى تحتاج عناية",
      description: "رسائل مصنفة كشكوى من أولياء الأمور.",
      href: "/remote/supervision/messages",
      count: complaintsCount,
      tone: "red" as const,
    },
    {
      key: "teacher-requests",
      title: "طلبات المعلمين",
      description: urgentTeacherRequestsCount > 0 ? "توجد طلبات دخول فوري عاجلة من المعلمين." : "طلبات جديدة أو قيد المتابعة من المعلمين.",
      href: "/remote/supervision/teacher-requests",
      count: openTeacherRequestsCount,
      tone: urgentTeacherRequestsCount > 0 ? "red" as const : "neutral" as const,
    },
    {
      key: "tasks",
      title: "مهام إشرافية مفتوحة",
      description: "مهام جديدة أو قيد العمل تنتظر إجراء المشرف.",
      href: "/remote/supervision/operations",
      count: supervisionTasksCount,
      tone: "neutral" as const,
    },
  ];

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <BrandHeroMedia src="/images/rahma-scene-circle.jpeg" opacity="opacity-50" />
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                لوحة الإشراف
              </p>
              <Link
                href="/remote"
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a]"
              >
                بوابات الدخول
              </Link>
              {supervisor?.canAccessFinance ? (
                <Link
                  href="/remote/admin/dashboard"
                  className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a]"
                >
                  لوحة الإدارة
                </Link>
              ) : null}
              <NotificationDropdown items={notificationItems} />
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4] disabled:opacity-60" />
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              نرعى حروف القرآن في القلوب، حتى يصبح التعليم أثرًا وهداية.
            </h1>
            <p className="mt-4 text-sm leading-8 text-white/72">
              {supervisor?.fullName
                ? `أهلًا بك ${supervisor.fullName}. هنا تكتمل العناية بالطالب والمعلم والحلقة؛ متابعة هادئة تحفظ المقصد وتخدم كتاب الله.`
                : "هنا تكتمل العناية بالطالب والمعلم والحلقة؛ متابعة هادئة تحفظ المقصد وتخدم كتاب الله."}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الطلاب</p>
            <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{studentsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المعلمون</p>
            <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{teachersCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الحلقات</p>
            <p className="mt-2 text-4xl font-black text-[#0a3f2a]">{circlesCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طلبات المعلمين المفتوحة</p>
            <p className="mt-2 text-4xl font-black text-[#0f5a35]">{openTeacherRequestsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طلبات بانتظار الإشراف</p>
            <p className="mt-2 text-4xl font-black text-[#8a661f]">{forwardedRegistrationsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المهام الإشرافية المفتوحة</p>
            <p className="mt-2 text-4xl font-black text-[#8a661f]">{supervisionTasksCount}</p>
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
                    : section.href === "/remote/supervision/messages"
                      ? unreadParentMessagesCount + complaintsCount
                    : null;

            return <DashboardSectionLink key={section.href} {...section} badge={badge} />;
          })}
        </section>
      </div>
    </main>
  );
}
