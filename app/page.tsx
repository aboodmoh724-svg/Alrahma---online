import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import BrandLockup from "@/components/brand/BrandLockup";
import { getAppBaseUrl } from "@/lib/app-url";

const portals = [
  {
    title: "التعليم عن بعد",
    description: "قسم الحلقات الإلكترونية، تقارير المعلمين، متابعة الإشراف، وطلبات التسجيل.",
    badge: "Online",
    accent: "from-[#0f5a35] to-[#0a3f2a]",
    links: [
      { href: "/remote/admin/login", label: "دخول الإدارة" },
      { href: "/remote/supervision/login", label: "دخول الإشراف" },
      { href: "/remote/teacher/login", label: "دخول المعلم" },
    ],
  },
  {
    title: "التعليم الحضوري - أفيون",
    description: "قسم مركز أفيون الحضوري لإدارة الطلاب والمعلمين والحلقات والغياب اليومي.",
    badge: "Afyon",
    accent: "from-[#bd8f2d] to-[#8a661f]",
    links: [
      { href: "/onsite/admin/login", label: "دخول الإدارة" },
      { href: "/onsite/teacher/login", label: "دخول المعلم" },
    ],
  },
  {
    title: "التعليم الحضوري - سوريا",
    description: "قسم مستقل لحلقات سوريا، يبدأ ببياناته الخاصة ويُدار دون خلط مع أفيون.",
    badge: "Syria",
    accent: "from-[#2f6f73] to-[#0f5a35]",
    links: [
      { href: "/syria/admin/login", label: "دخول الإدارة" },
      { href: "/syria/teacher/login", label: "دخول المعلم" },
    ],
  },
];

export default function HomePage() {
  const appBaseUrl = getAppBaseUrl();

  return (
    <main className="rahma-shell min-h-screen overflow-hidden px-3 py-3 sm:px-5 sm:py-6" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col gap-4 sm:min-h-[calc(100vh-3rem)] sm:gap-6">
        <header className="flex items-center justify-between rounded-3xl bg-white/92 px-4 py-3 shadow-sm ring-1 ring-[#bd8f2d]/20 sm:rounded-full sm:px-5">
          <BrandLockup compact />
          <Link
            href="/registration"
            className="rounded-full bg-[#0f5a35] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0a3f2a] sm:text-sm"
          >
            تسجيل طالب
          </Link>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0a3f2a] p-5 text-white shadow-xl sm:rounded-[2.75rem] sm:p-8">
            <BrandHeroMedia src="/images/rahma-scene-circle.jpeg" opacity="opacity-60" />
            <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10" />
            <div className="relative flex h-full min-h-[320px] flex-col justify-between gap-8">
              <div>
                  <span className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                  منصة واحدة
                </span>
                <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
                  كل الحلقات في مكان واحد سريع وواضح
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-8 text-white/72 sm:text-base">
                  هذا هو مركز الدخول للكادر: التعليم عن بعد، حضوري أفيون، حضوري سوريا،
                  والإشراف، ولوحة
                  التسجيل العامة كلها من رابط واحد.
                </p>
              </div>

              <div className="rounded-[1.6rem] bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-black text-[#f2d18a]">الرابط المعتمد للنشر</p>
                <p className="mt-2 break-all text-sm text-white/80">{appBaseUrl}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {portals.map((portal) => (
              <section
                key={portal.title}
                className="rahma-card grid overflow-hidden rounded-[2rem] p-3 shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2.5rem] sm:p-4 md:grid-cols-[0.9fr_1.1fr]"
              >
                <div className={`rounded-[1.6rem] bg-gradient-to-br ${portal.accent} p-5 text-white`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                      {portal.badge}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/16 text-xl">
                      ◆
                    </span>
                  </div>
                  <h2 className="mt-6 text-2xl font-black sm:text-3xl">{portal.title}</h2>
                  <p className="mt-3 text-sm leading-8 text-white/78">
                    {portal.description}
                  </p>
                </div>

                <div className="flex flex-col justify-center gap-2 p-2 sm:p-4">
                  {portal.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-black text-[#1c2d31] ring-1 ring-[#d8bf83]/70 transition hover:bg-white hover:shadow-sm"
                    >
                      {link.label}
                      <span className="text-lg">←</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
