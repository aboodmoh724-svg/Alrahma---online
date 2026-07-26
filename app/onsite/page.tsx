import Link from "next/link";
import Image from "next/image";

export default function OnsitePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a4a4d] via-[#1f5558] to-[#1a4a4d] text-[#fbf6ef] px-4 py-8 sm:py-12 relative overflow-hidden dir-rtl" dir="rtl">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbb292_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10 space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#cbb292]/30 pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#1a4a4d]/80 px-5 py-2.5 text-sm sm:text-base font-bold text-[#cbb292] border border-[#cbb292]/40 shadow-md hover:bg-[#cbb292] hover:text-[#162a2c] transition-all"
          >
            ← العودة للصفحة الرئيسية
          </Link>
          <span className="rounded-full bg-[#cbb292]/20 px-5 py-2 text-sm sm:text-base font-bold text-[#f2e8d5] border border-[#cbb292]/40">
            🏛️ التعليم الحضوري - أفيون
          </span>
        </div>

        {/* Banner with Student Photo */}
        <div className="rounded-3xl border-2 border-[#cbb292]/70 bg-[#153e40]/90 p-8 sm:p-10 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <Image src="/images/afyon-children-smile.jpeg" alt="" fill sizes="100vw" className="absolute inset-0 object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#153e40]/80 via-[#153e40]/90 to-[#153e40]/95" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-block rounded-full bg-[#cbb292]/20 border border-[#cbb292]/50 px-5 py-1.5 text-sm font-bold text-[#f2e8d5] font-serif">
              ✨ بوابة التعليم الحضوري ✨
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#cbb292] font-ruqaa leading-tight tracking-wide">
              مركز تحفيظ الرحمة - أفيون
            </h1>
            <p className="text-sm sm:text-base text-slate-200/90 font-serif max-w-2xl mx-auto leading-relaxed pt-2">
              واجهة المركز لإدارة الحلقات والطلاب والمعلمين والحضور والغياب اليومي
            </p>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Admin Card */}
          <Link
            href="/onsite/admin/login"
            className="group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#1f5558] to-[#153e40] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cbb292] hover:shadow-2xl hover:shadow-[#cbb292]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full group-hover:bg-[#cbb292]/20 transition-all" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                🏛️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-serif group-hover:text-white transition-colors">
                  لوحة التحكم الإدارية
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  إدارة الحلقات والطلاب والمعلمين، متابعة الحضور والغياب، التقارير السنوية، ورسائل أولياء الأمور.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10">
              <span>تسجيل دخول الإدارة</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Teacher Card */}
          <Link
            href="/onsite/teacher/login"
            className="group relative rounded-3xl border-2 border-[#cbb292]/40 bg-gradient-to-br from-[#22595c] to-[#153e40] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#cbb292] hover:shadow-2xl hover:shadow-[#cbb292]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#cbb292]/10 rounded-full group-hover:bg-[#cbb292]/20 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#cbb292]/20 border border-[#cbb292]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                📖
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2e8d5] font-serif group-hover:text-white transition-colors">
                  واجهة كادر المعلمين
                </h2>
                <p className="text-sm sm:text-base text-slate-300/90 mt-3 leading-relaxed">
                  إدخال تقارير الطلاب اليومية، متابعة سجل الحفظ والمراجعة، وتقييم الأداء والسلوك.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#cbb292]/20 flex items-center justify-between text-base font-bold text-[#cbb292] group-hover:text-[#f2e8d5] relative z-10">
              <span>تسجيل دخول المعلم</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>
        </div>

        {/* Summer Program Link */}
        <div className="text-center">
          <Link
            href="/onsite/summer"
            className="inline-flex items-center gap-2 rounded-full bg-[#cbb292]/20 border border-[#cbb292]/40 px-6 py-3 text-sm font-bold text-[#f2e8d5] hover:bg-[#cbb292] hover:text-[#162a2c] transition-all"
          >
            ☀️ الدورة الصيفية المكثفة
            <span>←</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-sm font-bold text-slate-400/70">
          إدارة تحفيظ الرحمة للقرآن الكريم © {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
