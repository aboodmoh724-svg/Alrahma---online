import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/auth/LogoutButton";
import { prisma } from "@/lib/prisma";

const REGISTRATION_REQUESTS_LAST_SEEN_KEY = "registration_requests:last_seen_at";

type DashboardSection = {
  href: string;
  requiresFinanceAccess?: boolean;
  title: string;
  description: string;
  tone: string;
};

const ADMIN_DASHBOARD_HIDDEN_SECTION_HREFS = new Set([
  "/remote/admin/statistics",
  "/remote/admin/students",
  "/remote/admin/circles",
  "/remote/admin/teachers",
  "/remote/admin/teacher-requests",
  "/remote/admin/reports",
  "/remote/admin/statistics#unassigned-students",
]);

const sections: DashboardSection[] = [
  {
    href: "/remote/admin/supervisors",
    requiresFinanceAccess: true,
    title: "المشرفون والصلاحيات",
    description: "إضافة مشرفين مستقلين عن الإدارة وتحديد من يملك الإشراف أو المالية أو كليهما.",
    tone: "bg-[#8a6335] text-white",
  },
  {
    href: "/remote/admin/statistics-general",
    title: "إحصائيات عامة",
    description: "ملخص سريع للحالات العامة والطلبات المفتوحة والمهام المحولة للإشراف.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/admin/supervision-tasks",
    requiresFinanceAccess: true,
    title: "مهام الإشراف",
    description: "إضافة مهمة من الإدارة لتظهر للمشرف في الجديدة ثم قيد المتابعة أو الانتظار أو المنتهية.",
    tone: "bg-[#1f6358] text-white",
  },
  {
    href: "/finance",
    requiresFinanceAccess: true,
    title: "الحسابات المالية",
    description: "متابعة دخل الطلاب، المصروفات، الرصيد، والفائض أو العجز.",
    tone: "bg-[#102f34] text-white",
  },
  {
    href: "/remote/admin/admins",
    requiresFinanceAccess: true,
    title: "الإداريون والصلاحيات",
    description: "إضافة إداريين للأونلاين وتحديد من يستطيع دخول الحسابات المالية.",
    tone: "bg-[#8a6335] text-white",
  },
  {
    href: "/remote/admin/statistics",
    title: "الإحصائيات",
    description: "أعداد المعلمين والطلاب والحلقات وإجمالي التقارير والطلاب بلا حلقة.",
    tone: "bg-[#173d42] text-white",
  },
  {
    href: "/remote/admin/students",
    title: "إدارة الطلاب",
    description: "إضافة الطلاب، عرض أرقامهم، ونقلهم بين الحلقات.",
    tone: "bg-[#1f6358] text-white",
  },
  {
    href: "/remote/admin/circles",
    title: "الحلقات والمسارات",
    description: "إنشاء الحلقات، تحديد المسار، تعيين المعلمين، وروابط الزوم.",
    tone: "bg-[#c39a62] text-white",
  },
  {
    href: "/remote/admin/teachers",
    title: "إدارة المعلمين",
    description: "إضافة حسابات المعلمين ومتابعة بياناتهم الأساسية.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/admin/teacher-requests",
    title: "طلبات المعلمين",
    description: "متابعة طلبات الاختبارات والطلاب المتعثرين والحالات الخاصة والرد عليها من مكان واحد.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/admin/reports",
    title: "قسم التقارير",
    description: "البحث عن طالب بالاسم أو الرقم وعرض ملخص مستواه.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/admin/registrations",
    title: "طلبات التسجيل",
    description: "مراجعة طلبات التسجيل الجديدة وقبول الطالب في الحلقة المناسبة.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/admin/resources",
    title: "ملفات المسارات",
    description: "رفع ملفات آلية سير الحلقة وملفات المسارات للمعلمين.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/admin/broadcasts",
    title: "الرسائل الجماعية",
    description: "كتابة رسالة موحدة وإرسالها إلى أولياء الأمور في الأونلاين أو الحضوري أو الجميع.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/admin/messages",
    title: "قوالب الرسائل",
    description: "تعديل قالب رسالة المعلم، ورسالة التقرير، ورسالة التسجيل، وضبط التذكير التلقائي للمعلمين.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/admin/statistics#unassigned-students",
    title: "طلاب بلا حلقة",
    description: "قسم مهم لمتابعة الطلاب الذين لم يتم ربطهم بحلقة بعد.",
    tone: "bg-[#fffaf2] text-[#9b7039]",
  },
  {
    href: "/remote/supervision/dashboard",
    title: "لوحة الإشراف",
    description: "واجهة تشغيلية موحدة لإدارة الطلاب والمعلمين والحلقات وطلبات المعلمين والتقارير وحالات التسجيل المحولة.",
    tone: "bg-[#173d42] text-white",
  },
];

async function getCurrentRemoteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      canAccessFinance: true,
    },
  });
}

async function getNewRegistrationRequestsCount() {
  const lastSeenSetting = await prisma.appSetting.findUnique({
    where: {
      key: REGISTRATION_REQUESTS_LAST_SEEN_KEY,
    },
    select: {
      value: true,
    },
  });

  const seenAtRaw =
    lastSeenSetting?.value &&
    typeof lastSeenSetting.value === "object" &&
    !Array.isArray(lastSeenSetting.value)
      ? (lastSeenSetting.value as { seenAt?: unknown }).seenAt
      : null;

  const seenAt = new Date(String(seenAtRaw || "1970-01-01T00:00:00.000Z"));
  const effectiveSeenAt = Number.isNaN(seenAt.getTime()) ? new Date("1970-01-01T00:00:00.000Z") : seenAt;

  return prisma.registrationRequest.count({
    where: {
      createdAt: {
        gt: effectiveSeenAt,
      },
    },
  });
}

async function getOpenTeacherRequestsCount() {
  const [teacherRequestsCount, forwardedRegistrationsCount] = await Promise.all([
    prisma.teacherRequest.count({
      where: {
        status: {
          in: ["NEW", "IN_REVIEW"],
        },
      },
    }),
    prisma.registrationRequest.count({
      where: {
        forwardedToSupervisionAt: {
          not: null,
        },
        supervisionStatus: {
          in: ["PENDING", "UNDER_REVIEW", "ON_HOLD"],
        },
      },
    }),
  ]);

  return teacherRequestsCount + forwardedRegistrationsCount;
}

export default async function RemoteAdminDashboardPage() {
  const [currentAdmin, newRegistrationsCount, openTeacherRequestsCount] = await Promise.all([
    getCurrentRemoteAdmin(),
    getNewRegistrationRequestsCount(),
    getOpenTeacherRequestsCount(),
  ]);

  const visibleSections = sections.filter(
    (section) =>
      !ADMIN_DASHBOARD_HIDDEN_SECTION_HREFS.has(section.href) &&
      (!section.requiresFinanceAccess || currentAdmin?.canAccessFinance)
  );

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                لوحة الإدارة
              </p>
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2] disabled:opacity-60" />
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              اختر القسم الذي تريد إدارته.
            </h1>
            <p className="mt-4 text-sm leading-8 text-white/72">
              بدل عرض الأرقام مباشرة هنا، جعلنا كل قسم يقودك إلى تفاصيله حتى تبقى الواجهة هادئة وواضحة.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-48 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${section.tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-black">{section.title}</h2>
                {section.href === "/remote/admin/registrations" && newRegistrationsCount > 0 ? (
                  <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                    {newRegistrationsCount}
                  </span>
                ) : section.href === "/remote/supervision/dashboard" &&
                  openTeacherRequestsCount > 0 ? (
                  <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-[#1f6358] px-3 py-1 text-xs font-black text-white">
                    {openTeacherRequestsCount}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-8 opacity-75">{section.description}</p>
              <span className="mt-6 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
                فتح القسم
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
