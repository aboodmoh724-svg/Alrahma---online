import Link from "next/link";
import LoginForm from "@/components/login/LoginForm";

export default function Page() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr] border border-[#9cc4c0]/25 shadow-lg">
          {/* Right/Top Side: Hero with Summer Theme */}
          <div className="relative min-h-[320px] overflow-hidden bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#14b8a6] lg:min-h-full">
            <img
              src="/images/afyon-recitation-day.jpeg"
              alt="الدورة الصيفية"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-25 blur-[1px]"
            />
            {/* Soft amber radial glow to represent summer sunshine */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.3),transparent_60%)]" />
            <Link
              href="/onsite"
              className="absolute right-5 top-5 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/30 sm:right-8 sm:top-8"
            >
              رجوع
            </Link>
            
            <div className="absolute bottom-8 right-8 max-w-md text-white sm:bottom-12 sm:right-12 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-black text-amber-300 backdrop-blur border border-white/5 uppercase">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                الدورة الصيفية (أفيون)
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl text-white">
                رصد التسميع والتحصيل اليومي
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-teal-50/80">
                مساحة المعلم الخاصة بالدورة الصيفية لإدخال تقارير التسميع، متابعة الحضور والغياب، وتقييم السلوك لطلاب مساري القرآن ونور البيان.
              </p>
            </div>
          </div>

          {/* Left/Bottom Side: LoginForm */}
          <div className="flex items-center justify-center p-5 sm:p-8 md:p-14 bg-white/90 backdrop-blur">
            <div className="w-full max-w-md">
              <LoginForm
                title="دخول معلمي الدورة الصيفية"
                subtitle="أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة معملي الدورة الصيفية."
                rememberKey="alrahma_summer_teacher_login"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
