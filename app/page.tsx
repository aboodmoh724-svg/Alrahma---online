import Link from "next/link";

const modes = [
  {
    href: "/remote",
    label: "التعليم عن بعد",
    description: "حلقات مباشرة، روابط زوم، وتقارير يومية للمعلمين.",
    badge: "Online",
    tone: "from-[#1f6358] to-[#163f43]",
  },
  {
    href: "/onsite",
    label: "التعليم الحضوري",
    description: "إدارة الحلقات والطلاب داخل المركز بنفس قاعدة البيانات.",
    badge: "Center",
    tone: "from-[#c39a62] to-[#9b7039]",
  },
];

export default function HomePage() {
  return (
    <main className="rahma-shell min-h-screen overflow-hidden px-3 py-3 sm:px-5 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col sm:min-h-[calc(100vh-3rem)]">
        <header className="flex items-center justify-between rounded-3xl bg-white px-4 py-3 shadow-sm ring-1 ring-[#c39a62]/15 sm:rounded-full sm:px-5">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="شعار تحفيظ الرحمة" width={40} height={40} className="object-contain" />
            <div>
              <p className="text-xs font-bold text-[#1c2d31] sm:text-sm">تحفيظ الرحمة للقرآن الكريم</p>
              <p className="text-[11px] text-[#1c2d31]/55 sm:text-xs">منصة التقارير والحلقات</p>
            </div>
          </div>
          <span className="hidden rounded-full bg-[#1f6358]/10 px-4 py-2 text-xs font-semibold text-[#1f6358] sm:inline-flex">
            مجموعة القرآن
          </span>
        </header>

        <section className="grid flex-1 items-center gap-5 py-5 sm:gap-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5 sm:space-y-8">
            <div className="rounded-[1.75rem] bg-white/86 p-5 shadow-sm ring-1 ring-[#d9c8ad]/70 sm:bg-transparent sm:p-0 sm:shadow-none sm:ring-0">
              <span className="inline-flex rounded-full bg-[#c39a62]/15 px-4 py-2 text-sm font-semibold text-[#9b7039]">
                مرحبًا بك
              </span>
              <h1 className="max-w-2xl text-4xl font-black leading-tight text-[#1c2d31] sm:text-5xl md:text-7xl">
                اختر نوع التعليم
              </h1>
              <p className="max-w-xl text-sm leading-7 text-[#1c2d31]/68 sm:text-lg sm:leading-8">
                إدارة حلقات القرآن للمعلمين والإدارة، بتقارير يومية وسجل مختصر لكل طالب.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {modes.map((mode) => (
                <Link
                  key={mode.href}
                  href={mode.href}
                  className="group rahma-card relative overflow-hidden rounded-[1.5rem] p-4 transition duration-200 hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-6"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${mode.tone} text-white sm:mb-6 sm:h-16 sm:w-16`}>
                    <span className="text-xl sm:text-2xl">◆</span>
                  </div>
                  <span className="mb-3 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#1f6358]">
                    {mode.badge}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#1c2d31] sm:text-2xl">{mode.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#1c2d31]/62 sm:mt-3 sm:min-h-14 sm:leading-7">{mode.description}</p>
                  <div className="mt-4 rounded-2xl bg-[#1f6358] px-4 py-3 text-center text-sm font-bold text-white transition group-hover:bg-[#173d42] sm:mt-6">
                    الدخول
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rahma-card rahma-muted-pattern relative min-h-[380px] overflow-hidden rounded-[2.5rem] p-8 md:min-h-[560px]">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1f6358]/10" />
              <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#c39a62]/16" />
              <div className="relative flex h-full min-h-[320px] flex-col justify-between rounded-[2rem] border border-white bg-white/72 p-8">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#1f6358]/10 px-4 py-2 text-sm font-bold text-[#1f6358]">
                    منصة الرحمة
                  </span>
                  <img src="/logo.webp" alt="" width={72} height={72} className="object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#9b7039]">حلقات القرآن الكريم</p>
                  <p className="mt-3 max-w-md text-4xl font-black leading-tight text-[#1c2d31]">
                    متابعة يومية تحفظ الجهد وتوضح الإنجاز.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
