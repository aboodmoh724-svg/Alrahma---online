import Link from "next/link";
import LoginForm from "@/components/login/LoginForm";

export default function Page() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[340px] overflow-hidden bg-[#0a3f2a] lg:min-h-full">
            <img
              src="/images/syria-login-hero.png"
              alt=""
              className="absolute inset-0 h-full w-full object-contain object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071b15]/92 via-[#0a3f2a]/20 to-transparent" />
            <Link
              href="/syria"
              className="absolute right-5 top-5 rounded-full bg-white/16 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/24 sm:right-8 sm:top-8"
            >
              رجوع
            </Link>
            <div className="absolute bottom-6 right-6 max-w-lg text-white sm:bottom-10 sm:right-10">
              <p className="w-fit rounded-full bg-white/18 px-4 py-2 text-sm font-bold text-[#f2d18a]">
                حضوري سوريا
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
                إدارة الحلقات من بداية واضحة
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/76">
                قسم مستقل لطلاب سوريا ومعلميها، ببيانات منفصلة ومتابعة خاصة.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 md:p-14">
            <div className="w-full max-w-md">
              <LoginForm
                title="دخول إدارة سوريا"
                subtitle="أدخل بيانات إدارة التعليم الحضوري في سوريا."
                rememberKey="alrahma_syria_admin_login"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
