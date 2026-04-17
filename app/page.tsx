import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/home-hero.jpg')" }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2f38]/55 via-[#143b46]/45 to-[#0d2027]/65" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-6xl text-center text-white">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-md">
            منصة الرحمة لتعليم القرآن الكريم
          </div>

          <h1 className="text-4xl font-extrabold md:text-6xl">مرحبًا بك</h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/90 md:text-xl">
            وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ
            <br />
            وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي
          </p>

          <div className="mx-auto mt-14 grid max-w-3xl gap-5 md:grid-cols-2">
            <Link
              href="/remote"
              className="group rounded-[2rem] border border-white/25 bg-white/12 px-8 py-8 text-right shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:border-[#D6B68A] hover:bg-white/18"
            >
              <div className="mb-4 text-sm font-medium text-white/80">
                النظام الأول
              </div>
              <h2 className="text-2xl font-bold text-white">التعليم عن بعد</h2>
              <div className="mt-6 text-sm font-semibold text-[#E9D2AE]">
                الدخول ←
              </div>
            </Link>

            <Link
              href="/onsite"
              className="group rounded-[2rem] border border-white/25 bg-white/12 px-8 py-8 text-right shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:border-[#D6B68A] hover:bg-white/18"
            >
              <div className="mb-4 text-sm font-medium text-white/80">
                النظام الثاني
              </div>
              <h2 className="text-2xl font-bold text-white">التعليم الحضوري</h2>
              <div className="mt-6 text-sm font-semibold text-[#E9D2AE]">
                الدخول ←
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}