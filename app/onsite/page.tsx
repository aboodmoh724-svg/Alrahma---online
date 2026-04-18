import Link from "next/link";
import Image from "next/image";

export default function OnsitePage() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-3 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] shadow-sm ring-1 ring-[#c39a62]/15">
            الرئيسية
          </Link>
          <span className="rounded-full bg-[#c39a62]/15 px-4 py-2 text-sm font-bold text-[#9b7039]">
            تعليم حضوري
          </span>
        </div>

        <section className="rahma-card overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.5rem] sm:p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <Image src="/logo.webp" alt="شعار الرحمة" width={72} height={72} className="mx-auto mb-4 object-contain sm:h-24 sm:w-24" />
            <h1 className="text-3xl font-black text-[#1c2d31] sm:text-4xl md:text-6xl">التعليم الحضوري</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#1c2d31]/65 sm:mt-4 sm:text-base sm:leading-8">
              اختر نوع الدخول لإدارة حلقات المركز والمعلمين والطلاب.
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:mt-12 sm:gap-5 md:grid-cols-2">
            <Link href="/onsite/admin/login" className="rounded-[1.5rem] bg-[#173d42] p-5 text-center text-lg font-black text-white shadow-md transition hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-8 sm:text-xl">
              دخول الإدارة
            </Link>
            <Link href="/onsite/teacher/login" className="rounded-[1.5rem] bg-[#c39a62] p-5 text-center text-lg font-black text-white shadow-md transition hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-8 sm:text-xl">
              دخول المعلم
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
