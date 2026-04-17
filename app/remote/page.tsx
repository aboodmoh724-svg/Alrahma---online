import Link from "next/link";

export default function RemotePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/remote-hero.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#143b46]/45 via-[#102a33]/50 to-[#0b1c22]/65" />

      <div className="relative z-10 min-h-screen px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-center justify-between">
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              ← الرئيسية
            </Link>

            <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
              التعليم عن بعد
            </div>
          </div>

          <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-white/15 bg-white/12 p-8 text-center text-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] backdrop-blur-lg md:p-12">
              <h1 className="text-4xl font-extrabold md:text-5xl">مرحبًا بك</h1>
              <p className="mt-4 text-base text-white/85 md:text-lg">
                اختر طريقة الدخول
              </p>

              <div className="mt-12 flex flex-col gap-4">
                <Link
                  href="/remote/admin/login"
                  className="rounded-2xl bg-[#0f5c60] py-5 text-lg font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#0c4c4f]"
                >
                  دخول الإدارة
                </Link>

                <Link
                  href="/remote/teacher/login"
                  className="rounded-2xl bg-[#c49a64] py-5 text-lg font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#b18753]"
                >
                  دخول المعلم
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}