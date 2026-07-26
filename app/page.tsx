import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#162a2c] via-[#1c383b] to-[#162a2c] text-[#fbf6ef] px-4 py-8 sm:py-12 relative overflow-hidden dir-rtl" dir="rtl">
      {/* Decorative Islamic Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbb292_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#cbb292]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#cbb292]/20 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl relative z-10 space-y-8">
        {/* Header with BOTH Logos (Platform + Tahfeez) */}
        <div className="flex items-center justify-between border-b border-[#cbb292]/30 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 border border-[#cbb292]/40 p-1.5 backdrop-blur-sm">
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
              <p className="text-sm font-bold text-[#f2e8d5]">إدارة تحفيظ الرحمة للقرآن الكريم</p>
              <p className="text-[11px] text-[#cbb292] font-medium">المنظومة الرقمية الشاملة</p>
            </div>
          </div>
          <Link
            href="/registration"
            className="rounded-full bg-[#162a2c]/80 px-5 py-2.5 text-sm font-bold text-[#cbb292] border border-[#cbb292]/40 shadow-md hover:bg-[#cbb292] hover:text-[#162a2c] transition-all"
          >
            ✨ تسجيل طالب جديد
          </Link>
        </div>

        {/* Motivational Islamic Calligraphy Banner */}
        <div className="rounded-3xl border-2 border-[#cbb292]/70 bg-[#0f2022]/80 p-8 sm:p-10 text-center space-y-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="inline-block rounded-full bg-[#cbb292]/20 border border-[#cbb292]/50 px-5 py-1.5 text-sm font-bold text-[#f2e8d5] font-serif mb-1">
            ✨ البوابة الرقمية الشاملة ✨
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#cbb292] font-ruqaa leading-tight tracking-wide drop-shadow-md">
            «وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ»
          </h1>
          <p className="text-xl sm:text-2xl font-black text-[#cbb292]/80 font-ruqaa tracking-wide">
            وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي
          </p>
          <p className="text-sm sm:text-base text-slate-200/90 font-serif max-w-3xl mx-auto leading-relaxed pt-2">
            مرحباً بكم في المنظومة الرقمية الشاملة لإدارة تحفيظ الرحمة للقرآن الكريم
          </p>
        </div>

        {/* 4 Main Portal Cards Grid (Same style as summer page cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

          {/* Card 1: التعليم عن بعد */}
          <Link
            href="/remote"
            className="group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#1c383b] to-[#0f2022] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cbb292] hover:shadow-2xl hover:shadow-[#cbb292]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full blur-2xl group-hover:bg-[#cbb292]/25 transition-all" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                🌐
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-serif group-hover:text-white transition-colors">
                  قسم التعليم عن بعد
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  حلقات قرآنية إلكترونية، متابعة إشرافية يومية، تقارير الطلاب، ومراسلات أولياء الأمور عبر المنصة.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10">
              <span>الدخول لبوابة التعليم عن بعد</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Card 2: التعليم الحضوري - أفيون */}
          <Link
            href="/onsite"
            className="group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#203c3f] to-[#0f2022] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cbb292] hover:shadow-2xl hover:shadow-[#cbb292]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full blur-2xl group-hover:bg-[#cbb292]/25 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                🏛️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-serif group-hover:text-white transition-colors">
                  التعليم الحضوري - أفيون
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  إدارة حلقات المركز الحضوري، الطلاب والمعلمين، متابعة الحضور والغياب، ورسائل أولياء الأمور.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10">
              <span>الدخول لبوابة التعليم الحضوري</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Card 3: قسم سوريا */}
          <Link
            href="/syria"
            className="group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#1c383b] to-[#0f2022] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cbb292] hover:shadow-2xl hover:shadow-[#cbb292]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full blur-2xl group-hover:bg-[#cbb292]/25 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                🇸🇾
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-serif group-hover:text-white transition-colors">
                  التعليم الحضوري - قسم سوريا
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  فرع ميداني مستقل ببياناته الخاصة، تسجيل أولي للطلاب، ونظام إدارة مخصص للمعلمين والطلاب.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10">
              <span>الدخول لبوابة قسم سوريا</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Card 4: الدورة الصيفية */}
          <Link
            href="/onsite/summer"
            className="group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#203c3f] to-[#0f2022] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cbb292] hover:shadow-2xl hover:shadow-[#cbb292]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full blur-2xl group-hover:bg-[#cbb292]/25 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                ☀️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-serif group-hover:text-white transition-colors">
                  الدورة الصيفية المكثفة - أفيون
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  متابعة الحضور والتقارير اليومية والأسبوعية لطلاب القرآن ونور البيان بالدورة الصيفية المكثفة.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10">
              <span>الدخول لبوابة الدورة الصيفية</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-sm font-bold text-slate-400/70">
          إدارة تحفيظ الرحمة للقرآن الكريم © {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
