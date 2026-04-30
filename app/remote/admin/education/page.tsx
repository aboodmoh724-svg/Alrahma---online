import Link from "next/link";

const sections = [
  {
    href: "/remote/admin/students",
    title: "الطلاب",
    description: "إضافة طالب يدويًا عند الحاجة، ومراجعة بيانات الطلاب ونقلهم بين الحلقات.",
    tone: "bg-[#1f6358] text-white",
  },
  {
    href: "/remote/admin/teachers",
    title: "المعلمون",
    description: "إضافة حسابات المعلمين وتحديث بياناتهم وأوقاتهم ومساراتهم المتاحة.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/admin/circles",
    title: "الحلقات والمسارات",
    description: "إنشاء الحلقات وتحديد المسار والمعلم والرابط وأوقات الدخول والخروج.",
    tone: "bg-[#c39a62] text-white",
  },
  {
    href: "/remote/admin/resources",
    title: "ملفات المسارات",
    description: "رفع ملفات آلية سير الحلقة وملفات المسارات للمعلمين أو للتسجيل.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/admin/supervision-tasks",
    title: "مهام الإشراف",
    description: "إضافة مهمة من الإدارة لتظهر للمشرف ضمن المتابعة الإشرافية.",
    tone: "bg-[#173d42] text-white",
  },
  {
    href: "/remote/supervision/dashboard",
    title: "واجهة الإشراف التشغيلية",
    description: "متابعة الطلاب والمعلمين والحلقات وطلبات التسجيل المحولة من الإدارة.",
    tone: "bg-white text-[#173d42]",
  },
];

export default function RemoteAdminEducationPage() {
  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">إدارة التعليم والحلقات</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              تم جمع الملفات المتقاربة هنا حتى تبقى الواجهة الإدارية أخف وأسهل في الوصول.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-44 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${section.tone}`}
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
