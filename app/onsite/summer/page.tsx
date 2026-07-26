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
    <main className="min-h-screen bg-[#faf8f4] text-[#1a2e23] relative overflow-hidden dir-rtl" dir="rtl">
      {/* Decorative Islamic Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#d4a853_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

      {/* Header bar */}
      <div className="bg-[#0c5c5e] w-full px-4 py-4 shadow-md relative z-20">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link
            href="/onsite"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-[#d4a853] hover:bg-white/20 transition-all"
          >
            ← العودة للتعليم الحضوري
          </Link>
          <span className="text-sm sm:text-base font-bold text-[#d4a853]">
            ☀️ الدورة الصيفية لتحفيظ الرحمة للقرآن الكريم
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl relative z-10 px-4 py-8 sm:py-12 space-y-8">
        {/* Motivational Islamic Calligraphy Banner */}
        <div className="rounded-2xl border border-[#d4a853]/30 bg-white p-8 sm:p-10 text-center space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="inline-block rounded-full bg-[#faf8f4] border border-[#d4a853]/20 px-5 py-1.5 text-sm font-bold text-[#d4a853] font-serif mb-1">
            ✨ بوابَةُ الدَّورَةِ الصَّيْفِيَّةِ ✨
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#0c5c5e] font-ruqaa leading-tight tracking-wide">
            «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
          </h1>
          <p className="text-base sm:text-xl text-[#1a2e23] font-serif max-w-3xl mx-auto leading-relaxed pt-2">
            مرحباً بكم في المنظومة الرقمية لإدارة متابعة وتقارير طلاب الدورة الصيفية لتحفيظ الرحمة لتعليم القرآن الكريم ونور البيان
          </p>
        </div>

        {/* Main Selection Cards (Admin vs Teacher) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Admin Card */}
          <Link
            href="/onsite/summer/admin/login"
            className="group relative bg-white border border-[#d4a853]/20 rounded-2xl p-8 sm:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div className="space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-[#faf8f4] border border-[#d4a853]/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform p-3 shadow-sm">
                🏛️
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0c5c5e] font-serif">
                  لوحة التحكم الإدارية
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                  متابعة التقارير اليومية، بطاقات الأداء الأسبوعية، إدارة الحلقات، توزيع الطلاب، وإرسال التقارير عبر الواتساب.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#d4a853]/10 flex items-center justify-between text-base font-bold text-[#d4a853] relative z-10">
              <span>تسجيل دخول الإدارة</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>

          {/* Teacher Card */}
          <Link
            href="/onsite/summer/teacher/login"
            className="group relative bg-white border border-[#d4a853]/20 rounded-2xl p-8 sm:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            <div className="space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-[#faf8f4] border border-[#d4a853]/30 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform p-3 shadow-sm">
                📖
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0c5c5e] font-serif">
                  واجهة كادر المعلمين
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                  إدخال الحضور والغياب اليومي للطلاب، تسجيل نطاق الحفظ والمراجعة والتلقين، وتقييم الأداء والسلوك بسهولة.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#d4a853]/10 flex items-center justify-between text-base font-bold text-[#d4a853] relative z-10">
              <span>تسجيل دخول المعلم</span>
              <span className="transform group-hover:-translate-x-2 transition-transform text-xl">←</span>
            </div>
          </Link>
        </div>

        {/* Footer Brand Info */}
        <div className="pt-6 text-center text-sm font-bold text-[#6b7280]">
          إدارة تحفيظ الرحمة للقرآن الكريم © {new Date().getFullYear()}
        </div>
      </div>
    </main>
  );
}
