import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/auth/LogoutButton";
import { prisma } from "@/lib/prisma";

const sections = [
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
    href: "/remote/admin/statistics#unassigned-students",
    title: "طلاب بلا حلقة",
    description: "قسم مهم لمتابعة الطلاب الذين لم يتم ربطهم بحلقة بعد.",
    tone: "bg-[#fffaf2] text-[#9b7039]",
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

export default async function RemoteAdminDashboardPage() {
  const currentAdmin = await getCurrentRemoteAdmin();
  const visibleSections = sections.filter(
    (section) => !section.requiresFinanceAccess || currentAdmin?.canAccessFinance
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
              <h2 className="text-2xl font-black">{section.title}</h2>
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
