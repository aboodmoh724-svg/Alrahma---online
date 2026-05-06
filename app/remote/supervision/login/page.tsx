import Link from "next/link";
import LoginForm from "@/components/login/LoginForm";

export default function RemoteSupervisionLoginPage() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rahma-muted-pattern relative hidden overflow-hidden bg-[#0a3f2a] lg:block">
            <div className="absolute -left-24 top-20 h-96 w-96 rounded-full bg-[#bd8f2d]/20" />
            <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a3f2a] via-[#0a3f2a]/75 to-[#0f5a35]/40" />
            <Link href="/remote" className="absolute right-8 top-8 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white">
              رجوع
            </Link>
            <div className="absolute bottom-10 right-10 max-w-md text-white">
              <p className="rounded-full bg-[#bd8f2d]/25 px-4 py-2 text-sm font-bold text-[#f2d18a]">الإشراف</p>
              <h2 className="mt-4 text-4xl font-black">واجهة المتابعة الإشرافية</h2>
              <p className="mt-3 text-sm leading-7 text-white/78">
                لمتابعة المعلمين والطلاب والمهام الإشرافية اليومية من واجهة مستقلة.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 md:p-14">
            <div className="w-full max-w-md">
              <div className="mb-5 flex items-center justify-between lg:hidden">
                <Link href="/remote" className="text-sm font-bold text-[#1c2d31]/65">رجوع</Link>
                <span className="rounded-full bg-[#fffaf4] px-4 py-2 text-xs font-bold text-[#8a661f] ring-1 ring-[#d8bf83]">الإشراف</span>
              </div>
              <LoginForm
                title="تسجيل دخول الإشراف"
                subtitle="أدخل بيانات المشرف للوصول إلى لوحة الإشراف ومهام المتابعة."
                rememberKey="alrahma_supervision_login"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
