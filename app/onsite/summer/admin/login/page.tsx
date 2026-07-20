import Link from "next/link";
import LoginForm from "@/components/login/LoginForm";

export default function Page() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
          {/* Right/Top Side: Hero with green/gold theme */}
          <div className="relative min-h-[320px] overflow-hidden bg-[#0a3f2a] lg:min-h-full">
            <img
              src="/images/afyon-awards-wide.jpeg"
              alt="الدورة الصيفية"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-45 blur-[1px]"
            />
            <div className="absolute inset-0 bg-[#0a3f2a]/34" />
            <Link
              href="/onsite"
              className="absolute right-5 top-5 rounded-full bg-white/16 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/24 sm:right-8 sm:top-8"
            >
              رجوع
            </Link>
          </div>

          {/* Left/Bottom Side: LoginForm */}
          <div className="flex items-center justify-center p-5 sm:p-8 md:p-14">
            <div className="w-full max-w-md">
              <div className="mb-7">
                <p className="w-fit rounded-full bg-[#0f5a35]/10 px-4 py-2 text-sm font-black text-[#0f5a35]">
                  إدارة الدورة الصيفية
                </p>
                <h1 className="mt-4 text-3xl font-black leading-tight text-[#0a3f2a] sm:text-4xl">
                  متابعة حلقات الدورة الصيفية
                </h1>
                <p className="mt-3 text-sm leading-7 text-[#1c2d31]/65">
                  إدارة الطلاب والمعلمين والحلقات وإرسال التقارير اليومية والأسبوعية للدورة الصيفية بأفيون.
                </p>
              </div>
              <LoginForm
                title="دخول إدارة الدورة الصيفية"
                subtitle="أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة إدارة الدورة الصيفية."
                rememberKey="alrahma_summer_admin_login"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
