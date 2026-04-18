import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";

const sections = [
  {
    href: "/onsite/admin/teachers",
    title: "المعلمين",
    description: "إضافة المعلمين وتفعيل/تعطيل الحسابات.",
    tone: "bg-[#173d42] text-white",
  },
  {
    href: "/onsite/admin/students",
    title: "الطلاب",
    description: "إضافة الطلاب وتحديث بيانات أولياء الأمور ونقلهم بين الحلقات.",
    tone: "bg-[#1f6358] text-white",
  },
  {
    href: "/onsite/admin/circles",
    title: "الحلقات",
    description: "إنشاء الحلقات وتعيين المعلمين وربط الطلاب.",
    tone: "bg-[#c39a62] text-white",
  },
  {
    href: "/onsite/admin/import",
    title: "استيراد Excel",
    description: "رفع ملف الطلاب من Excel (قريبًا) لإنشاء الطلاب دفعة واحدة.",
    tone: "bg-white text-[#173d42]",
  },
];

export default function OnsiteAdminDashboardPage() {
  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#173d42] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#c39a62]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                لوحة الإدارة (حضوري)
              </p>
              <LogoutButton className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42] transition hover:bg-[#fffaf2] disabled:opacity-60" />
              <Link
                href="/onsite"
                className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
              >
                صفحة الحضوري
              </Link>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
              اختر القسم الذي تريد إدارته.
            </h1>
            <p className="mt-4 text-sm leading-8 text-white/72">
              هذه لوحة حضوري مخصصة لإدارة طلاب المركز والمعلمين والحلقات.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-48 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${section.tone}`}
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 text-sm leading-8 opacity-75">
                {section.description}
              </p>
              <span className="mt-6 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
                فتح القسم
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

