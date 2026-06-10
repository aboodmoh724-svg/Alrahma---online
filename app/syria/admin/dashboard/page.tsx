import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { prisma } from "@/lib/prisma";

const sections = [
  {
    href: "/syria/admin/registrations",
    title: "طلبات التسجيل",
    description: "مراجعة الطلاب المسجلين حديثا، قبولهم، ثم إرسال رسائل القبول فرديا أو جماعيا.",
    tone: "bg-[#fffaf4] text-[#0a3f2a]",
  },
  {
    href: "/syria/admin/circles",
    title: "الحلقات والطلاب",
    description: "إدارة الحلقات ومعلميها وطلابها من شاشة واحدة: إضافة حلقة، تعيين معلم، عرض الطلاب، نقل طالب أو حذفه.",
    tone: "bg-[#0f5a35] text-white",
  },
  {
    href: "/syria/admin/students",
    title: "قاعدة الطلاب",
    description: "بحث سريع باسم الطالب أو رقمه، وتحديث رقم ولي الأمر أو نقل الطالب عند الحاجة.",
    tone: "bg-[#bd8f2d] text-white",
  },
  {
    href: "/syria/admin/education-supervision",
    title: "الإشراف التعليمي",
    description: "متابعة تقارير حلقات القرآن الكريم يومي الجمعة والثلاثاء، مع أداء الحلقات والتقارير الشهرية.",
    tone: "bg-[#0a3f2a] text-white",
  },
  {
    href: "/syria/admin/absences",
    title: "غياب اليوم",
    description: "عرض الطلاب الغائبين وإرسال رسائل الغياب الجماعية مباشرة إلى أولياء الأمور.",
    tone: "bg-amber-600 text-white",
  },
  {
    href: "/syria/admin/absence-statistics",
    title: "إحصائيات الغائبين",
    description: "معرفة عدد مرات غياب كل طالب والأيام التي غاب فيها.",
    tone: "bg-[#8a661f] text-white",
  },
  {
    href: "/syria/admin/broadcasts",
    title: "الرسائل الجماعية",
    description: "إرسال رسالة موحدة إلى أولياء الأمور أو المعلمين أو أولياء أمور محددين في الحضوري.",
    tone: "bg-[#fffaf4] text-[#0a3f2a]",
  },
  {
    href: "/syria/admin/data-workflow",
    title: "سير العمل",
    description: "متابعة تنظيف بيانات الطلاب المؤقتين، جمع أرقام أولياء الأمور، ثم إرسال استمارة تحديث البيانات خطوة بخطوة.",
    tone: "bg-[#1c2d31] text-white",
  },
];

async function getCurrentOnsiteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE_SYRIA",
      isActive: true,
    },
    select: {
      id: true,
    },
  });
}

export default async function OnsiteAdminDashboardPage() {
  const admin = await getCurrentOnsiteAdmin();

  if (!admin) {
    redirect("/syria/admin/login");
  }

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <BrandHeroMedia src="/images/rahma-scene-awards.jpeg" opacity="opacity-50" />
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                لوحة الإدارة (حضوري)
              </p>
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4] disabled:opacity-60" />
              <Link
                href="/syria"
                className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
              >
                صفحة الحضوري
              </Link>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              اختر القسم الذي تريد إدارته.
            </h1>
            <p className="mt-4 text-sm leading-8 text-white/72">
              هذه لوحة حضوري مخصصة لإدارة طلاب المركز والمعلمين والحلقات والرسائل اليومية.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-48 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d8bf83] transition hover:-translate-y-0.5 ${section.tone}`}
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
