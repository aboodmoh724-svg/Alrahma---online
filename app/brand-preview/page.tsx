import Image from "next/image";
import Link from "next/link";

const brand = {
  green: "#0f5a35",
  greenDeep: "#0a3f2a",
  gold: "#bd8f2d",
  cream: "#f6eee7",
  paper: "#fffaf4",
  ink: "#18322a",
};

const stats = [
  ["طلبات جديدة", "12"],
  ["تقارير اليوم", "48"],
  ["حلقات نشطة", "9"],
  ["رسائل متابعة", "6"],
];

export default function BrandPreviewPage() {
  return (
    <main
      className="min-h-screen bg-[#f6eee7] text-[#18322a]"
      dir="rtl"
      style={{
        background:
          "radial-gradient(circle at 12% 12%, rgba(189,143,45,0.14), transparent 26%), linear-gradient(135deg, #fbf6ef 0%, #f6eee7 48%, #eef6ef 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-[#d8bf83]/45 bg-[#fffaf4]/90 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-[#d8bf83]/45">
              <Image
                src="/images/brand-preview-logo.jpeg"
                alt="شعار منصة الرحمة"
                width={68}
                height={68}
                className="h-16 w-16 rounded-2xl object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-black text-[#bd8f2d]">معاينة الهوية الجديدة</p>
              <h1 className="mt-1 text-2xl font-black text-[#0f5a35] sm:text-3xl">
                منصة الرحمة لتعليم القرآن الكريم
              </h1>
              <p className="mt-1 text-sm font-bold tracking-[0.2em] text-[#0f5a35]/70" dir="ltr">
                AL-RAHMA QURAN PLATFORM
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-sm font-black text-[#0f5a35] transition hover:bg-[#f6eee7]"
          >
            الرجوع للمنصة
          </Link>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f5a35] p-7 text-white shadow-xl sm:p-9">
            <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#bd8f2d]/20" />
            <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-white/10" />
            <div className="relative max-w-2xl">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                تجربة بصرية فقط
              </p>
              <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
                هوية أهدأ، أوضح، وأقرب لروح العمل القرآني.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/78">
                هذا التصور يحافظ على دفء المنصة الحالي، ويضيف حضور الشعار الجديد
                مع أخضر عميق وذهبي هادئ ومساحات بيضاء أكثر راحة.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-[#bd8f2d] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#a97d25]">
                  إجراء رئيسي
                </button>
                <button className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0f5a35] transition hover:bg-[#f6eee7]">
                  إجراء ثانوي
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[#d8bf83]/60 bg-[#fffaf4]/92 p-6 shadow-sm">
            <h3 className="text-xl font-black text-[#0f5a35]">لوحة مختصرة</h3>
            <p className="mt-2 text-sm leading-7 text-[#18322a]/62">
              نموذج سريع لكيف ستظهر البطاقات والأرقام داخل لوحات الإدارة والإشراف.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.5rem] border border-[#d8bf83]/50 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-bold text-[#18322a]/55">{label}</p>
                  <p className="mt-2 text-3xl font-black text-[#0f5a35]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] bg-[#0a3f2a] p-4 text-white">
              <p className="text-sm font-black text-[#f2d18a]">تنبيه جديد</p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                وصل طلب متابعة من ولي أمر ويحتاج مراجعة المشرف.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-[#d8bf83]/60 bg-[#fffaf4]/92 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#bd8f2d]">نموذج التسجيل</p>
                <h3 className="mt-1 text-2xl font-black text-[#0f5a35]">بيانات ولي الأمر</h3>
              </div>
              <span className="rounded-full bg-[#0f5a35]/10 px-4 py-2 text-sm font-black text-[#0f5a35]">
                آمن
              </span>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-black">اسم الطالب</span>
                <input
                  readOnly
                  value="محمد أحمد"
                  className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-black">رقم ولي الأمر</span>
                <div className="grid grid-cols-[130px_1fr] gap-2" dir="ltr">
                  <div className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-left text-sm font-black">
                    🇹🇷 +90
                  </div>
                  <input
                    readOnly
                    value="5xxxxxxxxx"
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-left text-sm outline-none"
                  />
                </div>
              </label>
              <button className="rounded-2xl bg-[#0f5a35] px-5 py-4 text-sm font-black text-white transition hover:bg-[#0a3f2a]">
                إرسال طلب التسجيل
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-[#d8bf83]/60 bg-[#fffaf4]/92 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-[#bd8f2d]">واجهة المعلم</p>
                <h3 className="mt-1 text-2xl font-black text-[#0f5a35]">متابعة اليوم</h3>
              </div>
              <Image
                src="/images/brand-preview-logo.jpeg"
                alt=""
                width={54}
                height={54}
                className="h-14 w-14 rounded-2xl object-contain"
              />
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-[#d8bf83]/55 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[#18322a]">تنبيهات المعلم</p>
                  <span className="rounded-full bg-[#0f5a35] px-3 py-1 text-xs font-black text-white">
                    2 جديد
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#18322a]/60">
                  آخر المستجدات والردود المختصرة في مساحة واحدة.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-red-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-[#18322a]">طلب دخول فوري</p>
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                    طارئ
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#18322a]/60">
                  يظهر عند الحاجة دون أن يطغى على واجهة الطلاب.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[#0f5a35] p-4 text-white">
                <p className="font-black">طلاب الحلقة</p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  بطاقة الطالب والتقرير اليومي بنفس ألوان الهوية الجديدة.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2.5rem] border border-[#d8bf83]/60 bg-[#fffaf4]/92 p-6 shadow-sm">
          <h3 className="text-2xl font-black text-[#0f5a35]">ألوان الهوية المقترحة</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {Object.entries(brand).map(([name, color]) => (
              <div key={name} className="rounded-2xl border border-[#d8bf83]/45 bg-white p-3">
                <div className="h-16 rounded-xl" style={{ backgroundColor: color }} />
                <p className="mt-3 text-sm font-black text-[#18322a]">{name}</p>
                <p className="text-xs font-bold text-[#18322a]/55" dir="ltr">
                  {color}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
