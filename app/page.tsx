import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

async function getStats() {
  try {
    const [studentCount, teacherCount, circleCount] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true, role: { in: ["TEACHER", "ADMIN"] } } }),
      prisma.circle.count(),
    ]);
    return { studentCount, teacherCount, circleCount };
  } catch {
    return { studentCount: 0, teacherCount: 0, circleCount: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a4a4d] via-[#1f5558] to-[#1a4a4d] text-[#fbf6ef] px-4 py-8 sm:py-12 relative overflow-hidden dir-rtl" dir="rtl">
      {/* Decorative Islamic Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbb292_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

      {/* Islamic Geometric Corner Decorations */}
      <svg className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 opacity-[0.06] pointer-events-none" viewBox="0 0 200 200">
        <pattern id="islamicCorner" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="#cbb292" strokeWidth="1"/>
          <circle cx="20" cy="20" r="5" fill="none" stroke="#cbb292" strokeWidth="0.5"/>
        </pattern>
        <rect width="200" height="200" fill="url(#islamicCorner)"/>
      </svg>
      <svg className="absolute bottom-0 left-0 w-48 h-48 sm:w-72 sm:h-72 opacity-[0.06] pointer-events-none rotate-180" viewBox="0 0 200 200">
        <pattern id="islamicCorner2" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="#cbb292" strokeWidth="1"/>
          <circle cx="20" cy="20" r="5" fill="none" stroke="#cbb292" strokeWidth="0.5"/>
        </pattern>
        <rect width="200" height="200" fill="url(#islamicCorner2)"/>
      </svg>

      <div className="mx-auto max-w-6xl relative z-10 space-y-8">
        {/* Header with BOTH Logos */}
        <div className="flex items-center justify-between border-b border-[#cbb292]/30 pb-5 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/15 border border-[#cbb292]/40 p-1.5">
              <Image
                src="/logo.webp"
                alt="شعار تحفيظ الرحمة"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain bg-white p-0.5"
                priority
              />
              <div className="h-7 w-px bg-[#cbb292]/40" />
              <Image
                src="/images/brand-preview-logo.jpeg"
                alt="شعار منصة الرحمة"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain bg-white p-0.5"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-[#f2e8d5]" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                إدارة تحفيظ الرحمة للقرآن الكريم
              </p>
              <p className="text-[11px] text-[#cbb292] font-medium">المنظومة الرقمية الشاملة</p>
            </div>
          </div>
          <Link
            href="/registration"
            className="rounded-full bg-[#1a4a4d]/80 px-5 py-2.5 text-sm font-bold text-[#cbb292] border border-[#cbb292]/40 shadow-md hover:bg-[#cbb292] hover:text-[#162a2c] transition-all duration-300"
          >
            ✨ تسجيل طالب جديد
          </Link>
        </div>

        {/* Motivational Islamic Calligraphy Banner with Geometric Ornaments */}
        <div className="rounded-3xl border-2 border-[#cbb292]/60 bg-[#153e40]/90 p-8 sm:p-12 text-center space-y-4 shadow-2xl relative overflow-hidden animate-fade-in-scale">
          {/* Background Student Photo */}
          <Image
            src="/images/afyon-awards-wide.jpeg"
            alt=""
            fill
            sizes="100vw"
            className="absolute inset-0 object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#153e40]/80 via-[#153e40]/90 to-[#153e40]/95" />
          
          {/* Geometric decorative borders */}
          <div className="absolute top-3 left-3 right-3 h-px bg-gradient-to-l from-transparent via-[#cbb292]/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 h-px bg-gradient-to-l from-transparent via-[#cbb292]/40 to-transparent" />
          <div className="absolute top-3 bottom-3 left-3 w-px bg-gradient-to-b from-transparent via-[#cbb292]/30 to-transparent" />
          <div className="absolute top-3 bottom-3 right-3 w-px bg-gradient-to-b from-transparent via-[#cbb292]/30 to-transparent" />
          
          {/* Corner diamonds */}
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border border-[#cbb292]/50 rotate-45" />
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border border-[#cbb292]/50 rotate-45" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border border-[#cbb292]/50 rotate-45" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border border-[#cbb292]/50 rotate-45" />

          <div className="relative z-10 space-y-4">
            <div className="inline-block rounded-full bg-[#cbb292]/20 border border-[#cbb292]/50 px-5 py-1.5 text-sm font-bold text-[#f2e8d5] font-amiri mb-1">
              ✨ البوابة الرقمية الشاملة ✨
            </div>
            
            {/* Decorative line above verse */}
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="w-16 sm:w-24 h-px bg-gradient-to-l from-[#cbb292]/60 to-transparent" />
              <div className="w-2 h-2 rounded-full bg-[#cbb292]/50 animate-float" />
              <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-[#cbb292]/60 to-transparent" />
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#cbb292] font-ruqaa leading-tight tracking-wide">
              «وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ»
            </h1>
            <p className="text-xl sm:text-2xl font-black text-[#cbb292]/80 font-ruqaa tracking-wide">
              وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي
            </p>

            {/* Decorative line below verse */}
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="w-16 sm:w-24 h-px bg-gradient-to-l from-[#cbb292]/60 to-transparent" />
              <div className="w-2 h-2 rotate-45 bg-[#cbb292]/50" />
              <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-[#cbb292]/60 to-transparent" />
            </div>

            <p className="text-sm sm:text-base text-slate-200/90 font-amiri max-w-3xl mx-auto leading-relaxed pt-2">
              مرحباً بكم في المنظومة الرقمية الشاملة لإدارة تحفيظ الرحمة للقرآن الكريم
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {(stats.studentCount > 0 || stats.teacherCount > 0) && (
          <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative overflow-hidden rounded-2xl border border-[#cbb292]/30 bg-[#153e40]/70 p-4 sm:p-5 text-center">
              <div className="stat-shimmer absolute inset-0" />
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl font-black text-[#cbb292] font-ruqaa">{stats.studentCount.toLocaleString('ar-SA')}</p>
                <p className="text-xs sm:text-sm text-slate-300/80 font-bold mt-1">📚 طالب مسجّل</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[#cbb292]/30 bg-[#153e40]/70 p-4 sm:p-5 text-center">
              <div className="stat-shimmer absolute inset-0" />
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl font-black text-[#cbb292] font-ruqaa">{stats.teacherCount.toLocaleString('ar-SA')}</p>
                <p className="text-xs sm:text-sm text-slate-300/80 font-bold mt-1">👨‍🏫 معلم ومشرف</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[#cbb292]/30 bg-[#153e40]/70 p-4 sm:p-5 text-center">
              <div className="stat-shimmer absolute inset-0" />
              <div className="relative z-10">
                <p className="text-2xl sm:text-3xl font-black text-[#cbb292] font-ruqaa">{stats.circleCount.toLocaleString('ar-SA')}</p>
                <p className="text-xs sm:text-sm text-slate-300/80 font-bold mt-1">🕌 حلقة قرآنية</p>
              </div>
            </div>
          </div>
        )}

        {/* 4 Main Portal Cards Grid with Gold Glow + Staggered Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

          {/* Card 1: التعليم عن بعد */}
          <Link
            href="/remote"
            className="portal-card-1 portal-gold-glow group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#1f5558] to-[#153e40] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between"
          >
            <Image src="/images/afyon-circle-wide.jpeg" alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="absolute inset-0 object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full group-hover:bg-[#cbb292]/20 transition-all" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300 p-3">
                🌐
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-amiri group-hover:text-white transition-colors">
                  قسم التعليم عن بعد
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  حلقات قرآنية إلكترونية، متابعة إشرافية يومية، تقارير الطلاب، ومراسلات أولياء الأمور عبر المنصة.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10 transition-colors">
              <span>الدخول لبوابة التعليم عن بعد</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Card 2: التعليم الحضوري - أفيون */}
          <Link
            href="/onsite"
            className="portal-card-2 portal-gold-glow group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#22595c] to-[#153e40] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between"
          >
            <Image src="/images/afyon-recitation-day.jpeg" alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="absolute inset-0 object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full group-hover:bg-[#cbb292]/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300 p-3">
                🏛️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-amiri group-hover:text-white transition-colors">
                  التعليم الحضوري - أفيون
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  إدارة حلقات المركز الحضوري، الطلاب والمعلمين، متابعة الحضور والغياب، ورسائل أولياء الأمور.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10 transition-colors">
              <span>الدخول لبوابة التعليم الحضوري</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Card 3: قسم سوريا */}
          <Link
            href="/syria"
            className="portal-card-3 portal-gold-glow group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#1f5558] to-[#153e40] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between"
          >
            <Image src="/images/syria-login-hero.png" alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="absolute inset-0 object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full group-hover:bg-[#cbb292]/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300 p-3">
                🕌
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-amiri group-hover:text-white transition-colors">
                  التعليم الحضوري - قسم سوريا
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  فرع ميداني مستقل ببياناته الخاصة، تسجيل أولي للطلاب، ونظام إدارة مخصص للمعلمين والطلاب.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10 transition-colors">
              <span>الدخول لبوابة قسم سوريا</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Card 4: الدورة الصيفية */}
          <Link
            href="/onsite/summer"
            className="portal-card-4 portal-gold-glow group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#22595c] to-[#153e40] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between"
          >
            <Image src="/images/afyon-awards-wide.jpeg" alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="absolute inset-0 object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full group-hover:bg-[#cbb292]/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300 p-3">
                ☀️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-amiri group-hover:text-white transition-colors">
                  الدورة الصيفية المكثفة - أفيون
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  متابعة الحضور والتقارير اليومية والأسبوعية لطلاب القرآن ونور البيان بالدورة الصيفية المكثفة.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10 transition-colors">
              <span>الدخول لبوابة الدورة الصيفية</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-sm font-bold text-slate-400/70 font-amiri">
          إدارة تحفيظ الرحمة للقرآن الكريم © {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
