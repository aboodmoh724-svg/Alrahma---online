import Link from "next/link";

const sections = [
  {
    href: "/remote/admin/students",
    title: "الطلاب",
    description: "إضافة طالب يدويًا عند الحاجة، ومراجعة بيانات الطلاب ونقلهم بين الحلقات.",
    tone: "bg-[#0f5a35] text-white",
  },
  {
    href: "/remote/admin/teachers",
    title: "المعلمون",
    description: "إضافة حسابات المعلمين وتحديث بياناتهم وأوقاتهم ومساراتهم المتاحة.",
    tone: "bg-white text-[#0a3f2a]",
  },
  {
    href: "/remote/admin/circles",
    title: "الحلقات والمسارات",
    description: "إنشاء الحلقات وتحديد المسار والمعلم والرابط وأوقات الدخول والخروج.",
    tone: "bg-[#bd8f2d] text-white",
  },
  {
    href: "/remote/admin/resources",
    title: "ملفات المسارات",
    description: "رفع ملفات آلية سير الحلقة وملفات المسارات للمعلمين أو للتسجيل.",
    tone: "bg-[#fffaf4] text-[#0a3f2a]",
  },
  {
    href: "/remote/admin/supervision-tasks",
    title: "مهام الإشراف",
    description: "إضافة مهمة من الإدارة لتظهر للمشرف ضمن المتابعة الإشرافية.",
    tone: "bg-[#0a3f2a] text-white",
  },
  {
    href: "/remote/supervision/dashboard",
    title: "واجهة الإشراف التشغيلية",
    description: "متابعة الطلاب والمعلمين والحلقات وطلبات التسجيل المحولة من الإدارة.",
    tone: "bg-white text-[#0a3f2a]",
  },
];

export default function RemoteAdminEducationPage() {
  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#8a661f]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">إدارة التعليم والحلقات</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              تم جمع الملفات المتقاربة هنا حتى تبقى الواجهة الإدارية أخف وأسهل في الوصول.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-44 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d8bf83] transition hover:-translate-y-0.5 ${section.tone}`}
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 text-sm leading-8 opacity-75">{section.description}</p>
              <span className="mt-5 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
                فتح
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
