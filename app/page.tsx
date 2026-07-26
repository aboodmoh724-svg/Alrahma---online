import Link from "next/link";
import Image from "next/image";

const portals = [
  {
    id: "remote",
    title: "قسم التعليم عن بعد",
    subtitle: "حلقات قرآنية إلكترونية، متابعة إشرافية، تقارير يومية، ومراسلات لأولياء الأمور",
    badge: "🌐 أونلاين",
    image: "/images/afyon-circle-wide.jpeg",
    links: [
      { href: "/remote/admin/login", label: "🔑 دخول الإدارة العامة", tag: "إدارة" },
      { href: "/remote/supervision/login", label: "🔍 دخول الإشراف التعليمي", tag: "إشراف" },
      { href: "/remote/teacher/login", label: "📝 دخول كادر المعلمين", tag: "معلمين" },
      { href: "/registration", label: "✨ تسجيل طالب جديد", tag: "طلاب" },
    ],
  },
  {
    id: "onsite",
    title: "التعليم الحضوري - أفيون",
    subtitle: "إدارة حلقات المركز الحضوري، متابعة الطلاب والمعلمين، الحضور والغياب والتواصل",
    badge: "🏛️ أفيون",
    image: "/images/afyon-recitation-day.jpeg",
    links: [
      { href: "/onsite/admin/login", label: "🔑 دخول الإدارة العامة", tag: "إدارة" },
      { href: "/onsite/teacher/login", label: "📝 دخول كادر المعلمين", tag: "معلمين" },
    ],
  },
  {
    id: "syria",
    title: "التعليم الحضوري - قسم سوريا",
    subtitle: "فرع ميداني مستقل ببياناته الخاصة، تسجيل أولي، ونظام إدارة مخصص للمعلمين",
    badge: "🇸🇾 فرع سوريا",
    image: "/images/syria-login-hero.png",
    links: [
      { href: "/syria/admin/login", label: "🔑 دخول الإدارة العامة", tag: "إدارة" },
      { href: "/syria/teacher/login", label: "📝 دخول كادر المعلمين", tag: "معلمين" },
      { href: "/syria/registration", label: "✨ تسجيل طالب جديد", tag: "تسجيل" },
    ],
  },
  {
    id: "summer",
    title: "الدورة الصيفية المكثفة - أفيون",
    subtitle: "متابعة الحضور والتقارير اليومية والأسبوعية لطلاب القرآن ونور البيان بالدورة الصيفية",
    badge: "☀️ الدورة الصيفية 2026",
    image: "/images/afyon-awards-wide.jpeg",
    links: [
      { href: "/onsite/summer/admin/login", label: "🔑 لوحة التحكم الإدارية", tag: "إدارة" },
      { href: "/onsite/summer/teacher/login", label: "📝 واجهة كادر المعلمين", tag: "معلمين" },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-slate-900 dir-rtl font-sans pb-16 pt-6 px-4 sm:px-6 lg:px-8 relative selection:bg-[#cbb292]/30" dir="rtl">
      
      {/* Background Decorative Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#cbb292_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="mx-auto max-w-7xl relative z-10 space-y-8">
        
        {/* Header Bar displaying BOTH Logos side-by-side (Primary Slate Teal & Sand Gold Theme) */}
        <header className="flex flex-col sm:flex-row items-center justify-between rounded-3xl bg-white border-2 border-[#cbb292]/35 px-6 py-4 shadow-md gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo Containers holding BOTH logos */}
            <div className="flex items-center gap-2 rounded-2xl bg-[#faf8f5] p-2 border border-[#cbb292]/40 shadow-inner">
              {/* Logo 1: تحفيظ الرحمة */}
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                <Image
                  src="/images/summer_quran_logo_v2.jpg"
                  alt="شعار تحفيظ الرحمة للقرآن الكريم"
                  fill
                  sizes="56px"
                  className="rounded-xl object-contain"
                  priority
                />
              </div>
              <div className="h-8 w-px bg-[#cbb292]/50" />
              {/* Logo 2: منصة الرحمة */}
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0">
                <Image
                  src="/images/brand-preview-logo.jpeg"
                  alt="شعار منصة الرحمة لتعليم القرآن الكريم"
                  fill
                  sizes="56px"
                  className="rounded-xl object-contain"
                  priority
                />
              </div>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#162a2c] font-serif tracking-tight">
                إدارة تحفيظ الرحمة للقرآن الكريم
              </h1>
              <p className="text-xs text-[#b3881c] font-bold mt-0.5">
                المنظومة الرقمية لتعليم القرآن الكريم والعلوم الشرعية
              </p>
            </div>
          </div>

          <Link
            href="/registration"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#162a2c] hover:bg-[#203c3f] border border-[#cbb292]/50 px-5 py-2.5 text-xs font-black text-[#f2e8d5] transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <span>✨</span>
            <span>تسجيل طالب جديد أونلاين</span>
          </Link>
        </header>

        {/* Grand Poetic Hero Banner (Styled in Slate Teal #162a2c & Sand Gold #cbb292) */}
        <section className="rounded-3xl border-2 border-[#cbb292]/50 bg-gradient-to-br from-[#162a2c] via-[#1c383b] to-[#162a2c] p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          
          {/* Subtle Decorative Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#cbb292_0%,transparent_60%)] opacity-15 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#cbb292]/20 border border-[#cbb292]/40 px-4 py-1.5 text-xs font-bold text-[#f2e8d5] shadow-xs">
              <span>✨</span> المنظومة الرقمية الشاملة <span>✨</span>
            </span>

            {/* Poetic Line Requested by User */}
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-[#f2e8d5] leading-relaxed tracking-wide drop-shadow-sm">
              «وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ ... وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي»
            </h2>

            <p className="max-w-3xl mx-auto text-sm sm:text-base text-slate-200 font-medium leading-relaxed pt-1">
              مرحباً بكم في المنظومة الرقمية المركزية المخصصة لإدارة التقارير اليومية والأسبوعية، وتسهيل متابعة وتواصل الإدارة والكادر التعليمي وأولياء الأمور
            </p>
          </div>
        </section>

        {/* 4 Interactive Master Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {portals.map((portal) => (
            <div
              key={portal.id}
              className="group rounded-3xl border-2 border-[#cbb292]/40 bg-white shadow-md hover:shadow-2xl hover:border-[#cbb292] transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Card Top Banner with Real Background Image & Dark Slate Overlay */}
              <div className="relative p-6 sm:p-7 min-h-[170px] flex flex-col justify-between overflow-hidden">
                <Image
                  src={portal.image}
                  alt={portal.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="absolute inset-0 object-cover opacity-20 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#162a2c]/95 via-[#1c383b]/90 to-[#162a2c]/85" />

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-full bg-[#cbb292]/25 border border-[#cbb292]/40 px-3 py-1 text-xs font-black text-[#f2e8d5]">
                      {portal.badge}
                    </span>
                    <span className="text-xs font-bold text-[#cbb292] opacity-80 group-hover:opacity-100 transition-opacity">
                      اختر مسار الدخول ←
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-[#f2e8d5] font-serif pt-1">
                    {portal.title}
                  </h3>
                  
                  <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                    {portal.subtitle}
                  </p>
                </div>
              </div>

              {/* Sub-Role Action Buttons Grid (Interactive Cards inside each master card) */}
              <div className="p-5 bg-[#faf8f5] border-t border-[#cbb292]/30 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 mb-2">بوابات الدخول المتاحة لهذا القسم:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {portal.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-xl bg-white border border-[#cbb292]/40 px-4 py-3 text-xs font-bold text-[#162a2c] hover:bg-[#162a2c] hover:text-[#f2e8d5] hover:border-[#162a2c] transition-all duration-200 shadow-2xs group/btn"
                    >
                      <span className="flex items-center gap-1.5">{link.label}</span>
                      <span className="text-xs text-[#b3881c] group-hover/btn:text-[#cbb292] group-hover/btn:-translate-x-1 transition-all">
                        ←
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-[#cbb292]/30 text-xs text-slate-500 font-medium space-y-1">
          <p className="font-serif font-bold text-[#162a2c]">إدارة تحفيظ الرحمة لتعليم القرآن الكريم © {new Date().getFullYear()}</p>
          <p className="text-[11px] text-[#b3881c]">جميع الحقوق محفوظة للمنظومة الرقمية الموحدة</p>
        </footer>

      </div>
    </main>
  );
}
