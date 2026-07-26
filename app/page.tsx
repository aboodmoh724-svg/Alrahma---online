import Link from "next/link";
import Image from "next/image";

const portals = [
  {
    title: "التعليم عن بعد",
    description: "حلقات إلكترونية، إشراف يومي، تقارير الطلاب، ومراسلات أولياء الأمور.",
    badge: "🌐 أونلاين",
    image: "/images/afyon-circle-wide.jpeg",
    accent: "from-[#062c21]/95 via-[#0c5c5e]/80 to-[#062c21]/60",
    links: [
      { href: "/remote/admin/login", label: "🔑 دخول الإدارة العامة" },
      { href: "/remote/supervision/login", label: "🔍 دخول الإشراف التعليمي" },
      { href: "/remote/teacher/login", label: "📝 دخول كادر المعلمين" },
      { href: "/registration", label: "✨ تسجيل طالب جديد" },
    ],
  },
  {
    title: "التعليم الحضوري - أفيون",
    description: "إدارة حلقات المركز الحضوري، الطلاب والمعلمين، ورسائل أولياء الأمور.",
    badge: "🏛️ أفيون",
    image: "/images/afyon-recitation-day.jpeg",
    accent: "from-[#062c21]/95 via-[#0c5c5e]/80 to-[#062c21]/60",
    links: [
      { href: "/onsite/admin/login", label: "🔑 دخول الإدارة العامة" },
      { href: "/onsite/teacher/login", label: "📝 دخول كادر المعلمين" },
    ],
  },
  {
    title: "التعليم الحضوري - سوريا",
    description: "فرع مستقل ببياناته الخاصة، تسجيل أولي، وإدارة منفصلة للمعلمين والطلاب.",
    badge: "🇸🇾 سوريا",
    image: "/images/syria-login-hero.png",
    accent: "from-[#062c21]/95 via-[#0c5c5e]/80 to-[#062c21]/60",
    links: [
      { href: "/syria/admin/login", label: "🔑 دخول الإدارة العامة" },
      { href: "/syria/teacher/login", label: "📝 دخول كادر المعلمين" },
      { href: "/syria/registration", label: "✨ تسجيل طالب جديد" },
    ],
  },
  {
    title: "الدورة الصيفية - أفيون",
    description: "متابعة الحضور والتقارير اليومية والأسبوعية لطلاب القرآن ونور البيان بالدورة الصيفية.",
    badge: "☀️ الدورة الصيفية 2026",
    image: "/images/afyon-awards-wide.jpeg",
    accent: "from-[#062c21]/95 via-[#0c5c5e]/80 to-[#062c21]/60",
    links: [
      { href: "/onsite/summer/admin/login", label: "🔑 لوحة التحكم الإدارية" },
      { href: "/onsite/summer/teacher/login", label: "📝 واجهة كادر المعلمين" },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#062c21] text-white dir-rtl font-sans py-8 px-4 sm:px-6 relative overflow-hidden" dir="rtl">
      {/* Background Geometric Pattern Accent */}
      <div className="absolute top-0 right-0 h-full w-full pointer-events-none opacity-15 bg-[radial-gradient(#bd8f2d_1.5px,transparent_1.5px)] [background-size:16px_16px]" />

      <div className="mx-auto max-w-7xl relative z-10 space-y-8">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between rounded-2xl bg-[#0c5c5e]/80 border border-[#bd8f2d]/40 px-6 py-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-1 shadow-md ring-2 ring-[#bd8f2d]">
              <Image
                src="/images/summer_quran_logo_v2.jpg"
                alt="شعار تحفيظ الرحمة"
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                إدارة تحفيظ الرحمة للقرآن الكريم
              </h1>
              <p className="text-xs text-[#f2d18a] font-medium">
                المنظومة الرقمية المركزية لإدارة التقارير والتعليم
              </p>
            </div>
          </div>

          <Link
            href="/registration"
            className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#bd8f2d] to-[#9e7623] px-5 py-2.5 text-xs font-black text-[#062c21] transition hover:brightness-110 shadow-md"
          >
            <span>✨</span> تسجيل التعليم عن بعد
          </Link>
        </header>

        {/* Hero Hadith & Greeting Banner (Matching User's Screenshot) */}
        <div className="rounded-3xl border-2 border-[#bd8f2d]/50 bg-[#0c5c5e]/90 p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#bd8f2d]/20 border border-[#bd8f2d]/40 px-4 py-1.5 text-xs font-bold text-[#f2d18a] mb-5">
            <span>✨</span> البوابة الرقمية الشاملة <span>✨</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-[#f2d18a] leading-tight drop-shadow-md">
            «وَلِحَامِلِ الْقُرْآنِ شَرَفٌ وَمَرْتَقَى»
          </h2>

          <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-emerald-100/90 font-medium leading-relaxed">
            مرحباً بكم في المنظومة الرقمية الشاملة لإدارة متابعة وتقارير طلاب تحفيظ الرحمة للقرآن الكريم
          </p>
        </div>

        {/* 4 Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portals.map((portal) => (
            <div
              key={portal.title}
              className="rounded-3xl border-2 border-[#bd8f2d]/40 bg-[#0c5c5e]/80 overflow-hidden shadow-xl hover:border-[#bd8f2d] transition-all flex flex-col justify-between"
            >
              {/* Card Banner with Background Image */}
              <div className="relative p-6 text-white min-h-[160px] flex flex-col justify-between overflow-hidden">
                <Image
                  src={portal.image}
                  alt={portal.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="absolute inset-0 object-cover opacity-25"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${portal.accent}`} />

                <div className="relative z-10">
                  <span className="inline-block rounded-full bg-[#bd8f2d]/30 border border-[#bd8f2d]/50 px-3 py-1 text-xs font-bold text-[#f2d18a] mb-3">
                    {portal.badge}
                  </span>
                  <h3 className="text-2xl font-bold font-serif text-white">{portal.title}</h3>
                  <p className="mt-2 text-xs text-emerald-100/80 leading-relaxed max-w-md">
                    {portal.description}
                  </p>
                </div>
              </div>

              {/* Action Links List */}
              <div className="p-5 bg-[#062c21]/90 space-y-2.5 border-t border-[#bd8f2d]/30">
                {portal.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl bg-[#0c5c5e]/80 border border-[#bd8f2d]/30 px-4 py-3 text-xs font-bold text-[#fbf6ef] hover:bg-[#bd8f2d] hover:text-[#062c21] transition-all group shadow-sm"
                  >
                    <span>{link.label}</span>
                    <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center py-4 border-t border-[#bd8f2d]/20 text-xs text-emerald-200/60 font-medium">
          إدارة تحفيظ الرحمة للقرآن الكريم © {new Date().getFullYear()}
        </footer>

      </div>
    </main>
  );
}
