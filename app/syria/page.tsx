import Link from "next/link";
import Image from "next/image";
import BrandLockup from "@/components/brand/BrandLockup";

export default function SyriaPage() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] shadow-sm ring-1 ring-[#bd8f2d]/15"
          >
            الرئيسية
          </Link>
          <span className="rounded-full bg-[#0f5a35]/12 px-4 py-2 text-sm font-bold text-[#0f5a35]">
            تعليم حضوري - سوريا
          </span>
        </div>

        <section className="rahma-card grid overflow-hidden rounded-[1.75rem] shadow-xl sm:rounded-[2.5rem] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[390px] overflow-hidden bg-[#0a3f2a] lg:min-h-[680px]">
            <Image
              src="/images/syria-login-hero.png"
              alt=""
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-contain object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062b1d]/92 via-[#0a3f2a]/18 to-transparent" />
            <div className="absolute bottom-6 right-6 max-w-xl text-white sm:bottom-10 sm:right-10">
              <BrandLockup light />
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
                التعليم الحضوري - سوريا
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-8 text-white/78 sm:text-base">
                بداية مستقلة لفرع سوريا: تسجيل أولي، إدارة منفصلة، ومعلمون وحلقات خاصة بالفرع.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 md:p-12">
            <div className="w-full max-w-md space-y-3">
              <Link
                href="/syria/registration"
                className="block rounded-[1.5rem] bg-[#0f5a35] p-5 text-center text-lg font-black text-white shadow-md transition hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-8 sm:text-xl"
              >
                تسجيل طالب
              </Link>
              <Link
                href="/syria/admin/login"
                className="block rounded-[1.5rem] bg-[#0a3f2a] p-5 text-center text-lg font-black text-white shadow-md transition hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-8 sm:text-xl"
              >
                دخول الإدارة
              </Link>
              <Link
                href="/syria/teacher/login"
                className="block rounded-[1.5rem] bg-[#bd8f2d] p-5 text-center text-lg font-black text-white shadow-md transition hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-8 sm:text-xl"
              >
                دخول المعلم
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
