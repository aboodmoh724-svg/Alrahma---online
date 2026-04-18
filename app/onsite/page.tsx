import Link from "next/link";
import Image from "next/image";

export default function OnsitePage() {
  return (
    <main className="rahma-shell min-h-screen px-5 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] shadow-sm ring-1 ring-[#c39a62]/15">
            الرئيسية
          </Link>
          <span className="rounded-full bg-[#c39a62]/15 px-4 py-2 text-sm font-bold text-[#9b7039]">
            تعليم حضوري
          </span>
        </div>

        <section className="rahma-card overflow-hidden rounded-[2.5rem] p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <Image src="/logo.webp" alt="شعار الرحمة" width={96} height={96} className="mx-auto mb-5 object-contain" />
            <h1 className="text-4xl font-black text-[#1c2d31] md:text-6xl">التعليم الحضوري</h1>
            <p className="mx-auto mt-4 max-w-xl leading-8 text-[#1c2d31]/65">
              اختر نوع الدخول لإدارة حلقات المركز والمعلمين والطلاب.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
            <Link href="/onsite/admin/login" className="rounded-[2rem] bg-[#173d42] p-8 text-center text-xl font-black text-white shadow-md transition hover:-translate-y-0.5">
              دخول الإدارة
            </Link>
            <Link href="/onsite/teacher/login" className="rounded-[2rem] bg-[#c39a62] p-8 text-center text-xl font-black text-white shadow-md transition hover:-translate-y-0.5">
              دخول المعلم
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
