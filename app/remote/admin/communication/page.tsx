import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const sections = [
  {
    href: "/remote/admin/broadcasts",
    title: "إرسال الرسائل",
    description: "رسائل جماعية لأولياء الأمور أو المعلمين، مع اختيار الفئة المناسبة قبل الإرسال.",
    tone: "bg-[#0f5a35] text-white",
    label: "إرسال",
  },
  {
    href: "/remote/admin/messages",
    title: "قوالب وتنبيهات واتساب",
    description: "تعديل رسائل القبول والتفاصيل والتقارير والتنبيهات التلقائية، وتفعيلها أو إيقافها.",
    tone: "bg-white text-[#0a3f2a]",
    label: "ضبط القوالب",
  },
  {
    href: "/remote/admin/escalated-messages",
    title: "متابعات محولة للإدارة",
    description: "رسائل أو شكاوى حوّلها الإشراف للإدارة للرد أو التوجيه أو مراسلة المعلم.",
    tone: "bg-[#fffaf4] text-[#0a3f2a]",
    label: "متابعة",
  },
  {
    href: "/remote/admin/conversations",
    title: "مراقبة مراسلات التعليم",
    description: "اطلاع إداري عند الحاجة على المحادثات التعليمية المصغرة بين ولي الأمر والمعلم والإشراف.",
    tone: "bg-white text-[#0a3f2a]",
    label: "مراقبة",
  },
  {
    href: "/remote/admin/reply-memory",
    title: "ذاكرة الردود",
    description: "حفظ الردود البشرية الجيدة كنماذج مساعدة لتوحيد جودة الردود مستقبلًا.",
    tone: "bg-[#0a3f2a] text-white",
    label: "فتح",
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
      id: true,
    },
  });
}

export default async function RemoteAdminCommunicationPage() {
  const currentAdmin = await getCurrentRemoteAdmin();

  if (!currentAdmin) {
    redirect("/remote/admin/login");
  }

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#8a661f]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">مركز الرسائل والواتساب</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#1c2d31]/60">
              جمعنا أدوات الرسائل في صفحة واحدة: ما يرسل، وما يضبط، وما يحتاج متابعة من الإدارة.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-44 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d8bf83] transition hover:-translate-y-0.5 ${section.tone}`}
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 text-sm leading-8 opacity-75">{section.description}</p>
              <span className="mt-5 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
                {section.label}
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
