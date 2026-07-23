import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SummerPortalPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      redirect("/onsite/summer/admin");
    } else if (user) {
      redirect("/onsite/summer/teacher");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b4231] via-[#135440] to-[#0b4231] text-[#fbf6ef] px-4 py-8 sm:py-12 relative overflow-hidden dir-rtl" dir="rtl">
      {/* Decorative Islamic Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#bd8f2d_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#bd8f2d]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#bd8f2d]/20 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10 space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#bd8f2d]/30 pb-5">
          <Link
            href="/onsite"
            className="inline-flex items-center gap-2 rounded-full bg-[#0b4231]/80 px-5 py-2.5 text-sm sm:text-base font-bold text-[#bd8f2d] border border-[#bd8f2d]/40 shadow-md hover:bg-[#bd8f2d] hover:text-[#0b4231] transition-all"
          >
            ← العودة للتعليم الحضوري
          </Link>
          <span className="rounded-full bg-[#bd8f2d]/20 px-5 py-2 text-sm sm:text-base font-bold text-[#f2d18a] border border-[#bd8f2d]/40">
            ☀️ الدورة الصيفية لتحفيظ الرحمة للقرآن الكريم
          </span>
        </div>

        {/* Motivational Islamic Calligraphy Banner */}
        <div className="rounded-3xl border-2 border-[#bd8f2d]/70 bg-[#062c20]/80 p-8 sm:p-10 text-center space-y-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="inline-block rounded-full bg-[#bd8f2d]/20 border border-[#bd8f2d]/50 px-5 py-1.5 text-sm font-bold text-[#f2d18a] font-serif mb-1">
            ✨ بوابَةُ الدَّورَةِ الصَّيْفِيَّةِ ✨
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#bd8f2d] font-ruqaa leading-tight tracking-wide drop-shadow-md">
            «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
          </h1>
          <p className="text-base sm:text-xl text-emerald-100 font-serif max-w-3xl mx-auto leading-relaxed pt-2">
            مرحباً بكم في المنظومة الرقمية لإدارة متابعة وتقارير طلاب الدورة الصيفية لتحفيظ الرحمة لتعليم القرآن الكريم ونور البيان
          </p>
        </div>

        {/* Main Selection Cards (Admin vs Teacher) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Admin Card */}
          <Link
            href="/onsite/summer/admin/login"
            className="group relative rounded-3xl border-2 border-[#bd8f2d]/40 bg-gradient-to-br from-[#0e4e3a] to-[#083326] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#bd8f2d] hover:shadow-2xl hover:shadow-[#bd8f2d]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#bd8f2d]/10 rounded-full blur-2xl group-hover:bg-[#bd8f2d]/25 transition-all" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#bd8f2d]/20 border border-[#bd8f2d]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                🏛️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2d18a] font-serif group-hover:text-white transition-colors">
                  لوحة التحكم الإدارية
                </h2>
                <p className="text-sm sm:text-base text-emerald-100/90 mt-3 leading-relaxed">
                  متابعة التقارير اليومية، بطاقات الأداء الأسبوعية، إدارة الحلقات، توزيع الطلاب، وإرسال التقارير عبر الواتساب.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#bd8f2d]/20 flex items-center justify-between text-base font-bold text-[#bd8f2d] group-hover:text-[#f2d18a] relative z-10">
              <span>تسجيل دخول الإدارة</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Teacher Card */}
          <Link
            href="/onsite/summer/teacher/login"
            className="group relative rounded-3xl border-2 border-[#bd8f2d]/40 bg-gradient-to-br from-[#125843] to-[#0b3c2e] p-8 sm:p-10 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#bd8f2d] hover:shadow-2xl hover:shadow-[#bd8f2d]/20 overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#bd8f2d]/10 rounded-full blur-2xl group-hover:bg-[#bd8f2d]/25 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="w-18 h-18 rounded-2xl bg-[#bd8f2d]/20 border border-[#bd8f2d]/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform p-3">
                📖
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f2d18a] font-serif group-hover:text-white transition-colors">
                  واجهة كادر المعلمين
                </h2>
                <p className="text-sm sm:text-base text-emerald-100/90 mt-3 leading-relaxed">
                  إدخال الحضور والغياب اليومي للطلاب، تسجيل نطاق الحفظ والمراجعة والتلقين، وتقييم الأداء والسلوك بسهولة.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#bd8f2d]/20 flex items-center justify-between text-base font-bold text-[#bd8f2d] group-hover:text-[#f2d18a] relative z-10">
              <span>تسجيل دخول المعلم</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>
        </div>

        {/* Footer Brand Info */}
        <div className="pt-6 text-center text-sm font-bold text-emerald-200/70">
          إدارة تحفيظ الرحمة للقرآن الكريم © {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
