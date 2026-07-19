import Link from "next/link";
import Image from "next/image";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import BrandLockup from "@/components/brand/BrandLockup";
import { getAppBaseUrl } from "@/lib/app-url";

const portals = [
  {
    title: "التعليم عن بعد",
    description: "حلقات إلكترونية، إشراف يومي، تقارير الطلاب، ومراسلات أولياء الأمور.",
    badge: "Online",
    image: "/images/afyon-circle-wide.jpeg",
    accent: "from-[#062b1d]/94 via-[#0a3f2a]/76 to-[#0f5a35]/42",
    links: [
      { href: "/remote/admin/login", label: "دخول الإدارة" },
      { href: "/remote/supervision/login", label: "دخول الإشراف" },
      { href: "/remote/teacher/login", label: "دخول المعلم" },
    ],
  },
  {
    title: "التعليم الحضوري - أفيون",
    description: "إدارة حلقات المركز، الطلاب والمعلمين، الغياب، ورسائل أولياء الأمور.",
    badge: "Afyon",
    image: "/images/afyon-recitation-day.jpeg",
    accent: "from-[#1c2d31]/90 via-[#0a3f2a]/58 to-[#bd8f2d]/34",
    links: [
      { href: "/onsite/admin/login", label: "دخول الإدارة" },
      { href: "/onsite/teacher/login", label: "دخول المعلم" },
    ],
  },
  {
    title: "التعليم الحضوري - سوريا",
    description: "فرع مستقل ببياناته الخاصة، تسجيل أولي، وإدارة منفصلة للمعلمين والطلاب.",
    badge: "Syria",
    image: "/images/syria-login-hero.png",
    accent: "from-[#071b15]/92 via-[#0a3f2a]/56 to-[#2f6f73]/30",
    links: [
      { href: "/syria/registration", label: "تسجيل طالب" },
      { href: "/syria/admin/login", label: "دخول الإدارة" },
      { href: "/syria/teacher/login", label: "دخول المعلم" },
    ],
  },
  {
    title: "الدورة الصيفية - أفيون",
    description: "متابعة الحضور والتقارير اليومية والأسبوعية لطلاب القرآن ونور البيان في الدورة الصيفية.",
    badge: "دورة صيف 2026",
    image: "/images/afyon-awards-wide.jpeg",
    accent: "from-[#6c4e09]/92 via-[#3a2d0d]/76 to-[#0f5a35]/40",
    links: [
      { href: "/onsite/summer/admin", label: "دخول الإدارة" },
      { href: "/onsite/summer/teacher", label: "دخول المعلم" },
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
            تسجيل التعليم عن بعد
          </Link>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0a3f2a] p-5 text-white shadow-xl sm:rounded-[2.75rem] sm:p-8">
            <BrandHeroMedia src="/images/afyon-awards-wide.jpeg" opacity="opacity-48" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b1d]/92 via-[#0a3f2a]/58 to-transparent" />
            <div className="relative flex h-full min-h-[340px] flex-col justify-between gap-8">
              <div>
                <span className="inline-flex rounded-full bg-white/14 px-4 py-2 text-sm font-black text-[#f2d18a]">
                  منصة الرحمة
                </span>
                <h1 className="mt-5 max-w-xl font-serif text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
                  تحفيظ الرحمة للقرآن الكريم
                </h1>
                <p className="mt-4 max-w-lg font-serif text-3xl font-black leading-tight text-[#f2d18a] sm:text-4xl">
                  نحو غد مشرق
                </p>
                <p className="mt-5 max-w-lg text-sm leading-8 text-white/76 sm:text-base">
                  اختر القسم المناسب مباشرة، وكل قسم مستقل ببياناته ومساره التشغيلي.
                </p>
              </div>

              <div className="rounded-[1.6rem] bg-white/12 p-4 backdrop-blur">
                <p className="text-sm font-black text-[#f2d18a]">الرابط المعتمد للنشر</p>
                <p className="mt-2 break-all text-sm text-white/82">{appBaseUrl}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {portals.map((portal) => (
              <section
                key={portal.title}
                className="rahma-card grid overflow-hidden rounded-[2rem] shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2.5rem] md:grid-cols-[0.92fr_1.08fr]"
              >
                <div className="relative min-h-[210px] overflow-hidden bg-[#0a3f2a] p-5 text-white md:min-h-full">
                  <Image
                    src={portal.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 32vw, 100vw"
                    className="absolute inset-0 object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-l ${portal.accent}`} />
                  <div className="relative flex h-full min-h-[170px] flex-col justify-between">
                    <span className="w-fit rounded-full bg-white/18 px-3 py-1 text-xs font-black text-[#f2d18a]">
                      {portal.badge}
                    </span>
                    <div>
                      <h2 className="text-2xl font-black sm:text-3xl">{portal.title}</h2>
                      <p className="mt-3 text-sm leading-8 text-white/80">{portal.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2 p-4 sm:p-5">
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
