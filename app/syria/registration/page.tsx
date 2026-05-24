import Link from "next/link";
import Image from "next/image";
import BrandLockup from "@/components/brand/BrandLockup";

const googleFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSf7F3SPxml1jr-ep9Au95R5G0UaKjom1e34lm9rfdZNu6W1AA/viewform?embedded=true";

export default function SyriaRegistrationPage() {
  return (
    <main className="rahma-shell min-h-screen px-3 py-4 sm:px-4 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0a3f2a] p-5 text-white shadow-xl sm:rounded-[2.5rem] sm:p-7">
          <Image
            src="/images/syria-login-hero.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-36"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#062b1d]/92 via-[#0a3f2a]/74 to-[#0a3f2a]/32" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BrandLockup light showLegacy={false} />
              <Link
                href="/syria"
                className="rounded-full bg-white/16 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/24"
              >
                رجوع
              </Link>
            </div>
            <h1 className="mt-7 text-3xl font-black sm:text-5xl">تسجيل طالب - فرع سوريا</h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-white/76 sm:text-base">
              هذه الصفحة هي رابط التسجيل الرسمي داخل موقع المنصة، وترتبط حاليا بنموذج التسجيل
              المنشور لفرع سوريا - حماة. بعد اكتمال التجربة سننقلها إلى نموذج داخلي كامل.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-[#d8bf83] sm:rounded-[2.5rem]">
          <iframe
            src={googleFormUrl}
            title="استبيان التسجيل في تحفيظ الرحمة للقرآن الكريم فرع سوريا - حماة"
            className="h-[1970px] w-full border-0"
          >
            جار التحميل...
          </iframe>
        </section>
      </div>
    </main>
  );
}
