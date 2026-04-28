import Link from "next/link";

const entries = [
  {
    href: "/remote/admin/login",
    title: "دخول الإدارة",
    description: "الماليات، الرسائل، طلبات التسجيل، وإدارة المشرفين والصلاحيات.",
    icon: "إ",
    tone: "bg-[#173d42] text-white",
  },
  {
    href: "/remote/supervision/login",
    title: "دخول الإشراف",
    description: "المهام الإشرافية، متابعة الطلاب والمعلمين، والطلبات المحولة من الإدارة.",
    icon: "ش",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/teacher/login",
    title: "دخول المعلم",
    description: "إضافة التقارير اليومية ومتابعة سجل الطلاب والتنبيهات.",
    icon: "م",
    tone: "bg-[#f3eadc] text-[#8a6335]",
  },
];

export default function RemotePage() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] shadow-sm ring-1 ring-[#c39a62]/15">
            الرئيسية
          </Link>
          <span className="rounded-full bg-[#1f6358]/12 px-4 py-2 text-sm font-bold text-[#1f6358]">
            تعليم عن بعد
          </span>
        </div>

        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rahma-muted-pattern relative hidden min-h-[360px] overflow-hidden bg-[#173d42] lg:block lg:min-h-[680px]">
            <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#c39a62]/20" />
            <div className="absolute bottom-16 right-10 h-96 w-96 rounded-full bg-white/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#112a30] via-[#173d42]/70 to-[#1f6358]/35" />
            <div className="absolute bottom-8 right-8 max-w-md text-white">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 text-3xl font-black text-[#f1d39d] backdrop-blur">
                ر
              </div>
              <h1 className="text-4xl font-black">اختر بوابة الدخول</h1>
              <p className="mt-3 text-sm leading-7 text-white/78">
                لكل دور واجهته المستقلة: الإدارة، الإشراف، أو المعلم.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 sm:p-6 md:p-12">
            <div className="w-full max-w-xl space-y-3 sm:space-y-5">
              <div className="mb-2 rounded-3xl bg-[#fffaf2] p-5 text-[#1c2d31] ring-1 ring-[#d9c8ad] lg:hidden">
                <p className="text-sm font-bold text-[#9b7039]">تعليم عن بعد</p>
                <h1 className="mt-2 text-2xl font-black">اختر بوابة الدخول</h1>
                <p className="mt-2 text-sm leading-6 text-[#1c2d31]/65">
                  لكل دور واجهته المستقلة: الإدارة، الإشراف، أو المعلم.
                </p>
              </div>
              {entries.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={`group flex items-center justify-between rounded-3xl p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 sm:p-6 ${entry.tone}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/90 text-lg font-black text-[#1f6358] sm:h-14 sm:w-14 sm:text-xl">
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
