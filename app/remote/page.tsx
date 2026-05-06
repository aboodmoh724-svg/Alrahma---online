import Link from "next/link";
import BrandHeroMedia from "@/components/brand/BrandHeroMedia";
import BrandLockup from "@/components/brand/BrandLockup";

const entries = [
  {
    href: "/remote/admin/login",
    title: "دخول الإدارة",
    description: "الماليات، الرسائل، طلبات التسجيل، وإدارة المشرفين والصلاحيات.",
    icon: "إ",
    tone: "bg-[#0a3f2a] text-white",
  },
  {
    href: "/remote/supervision/login",
    title: "دخول الإشراف",
    description: "المهام الإشرافية، متابعة الطلاب والمعلمين، والطلبات المحولة من الإدارة.",
    icon: "ش",
    tone: "bg-[#fffaf4] text-[#0a3f2a]",
  },
  {
    href: "/remote/teacher/login",
    title: "دخول المعلم",
    description: "إضافة التقارير اليومية ومتابعة سجل الطلاب والتنبيهات.",
    icon: "م",
    tone: "bg-[#f6eee7] text-[#8a661f]",
  },
];

export default function RemotePage() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] shadow-sm ring-1 ring-[#bd8f2d]/15">
            الرئيسية
          </Link>
          <span className="rounded-full bg-[#0f5a35]/12 px-4 py-2 text-sm font-bold text-[#0f5a35]">
            تعليم عن بعد
          </span>
        </div>

        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rahma-muted-pattern relative hidden min-h-[360px] overflow-hidden bg-[#0a3f2a] lg:block lg:min-h-[680px]">
            <BrandHeroMedia src="/images/rahma-scene-mosque.jpg" opacity="opacity-62" />
            <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#bd8f2d]/20" />
            <div className="absolute bottom-16 right-10 h-96 w-96 rounded-full bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b1d] via-[#0a3f2a]/72 to-[#0f5a35]/35" />
            <div className="absolute bottom-8 right-8 max-w-md text-white">
              <BrandLockup light />
              <h1 className="text-4xl font-black">اختر بوابة الدخول</h1>
              <p className="mt-3 text-sm leading-7 text-white/78">
                لكل دور واجهته المستقلة: الإدارة، الإشراف، أو المعلم.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-6 md:p-12">
            <div className="w-full max-w-xl space-y-3 sm:space-y-5">
              <div className="relative mb-2 overflow-hidden rounded-3xl bg-[#0a3f2a] p-5 text-white ring-1 ring-[#d8bf83] lg:hidden">
                <BrandHeroMedia src="/images/rahma-scene-mosque.jpg" opacity="opacity-35" />
                <div className="relative">
                  <p className="text-sm font-bold text-[#f1d28a]">تعليم عن بعد</p>
                  <h1 className="mt-2 text-2xl font-black">اختر بوابة الدخول</h1>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    لكل دور واجهته المستقلة: الإدارة، الإشراف، أو المعلم.
                  </p>
                </div>
              </div>
              {entries.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`group flex items-center justify-between rounded-3xl p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 sm:p-6 ${entry.tone}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-lg font-black text-[#0f5a35] sm:h-14 sm:w-14 sm:text-xl">
                      {entry.icon}
                    </span>
                    <div>
                      <h2 className="text-lg font-black sm:text-xl">{entry.title}</h2>
                      <p className="mt-1 text-xs leading-6 opacity-75 sm:text-sm">{entry.description}</p>
                    </div>
                  </div>
                  <span className="text-2xl transition group-hover:-translate-x-1">←</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
