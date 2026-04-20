import Link from "next/link";

export const dynamic = "force-dynamic";

export default function OnsiteAdminStudentDetailsPage() {
  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2.5rem] bg-white/90 p-8 text-center shadow-sm ring-1 ring-[#d9c8ad]">
          <p className="mx-auto inline-flex rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#9b7039] ring-1 ring-[#d9c8ad]">
            صفحة غير مفعلة
          </p>
          <h1 className="mt-5 text-3xl font-black text-[#173d42]">
            بيانات الطلاب التفصيلية مخفية حاليًا
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-8 text-[#1c2d31]/65">
            تم الاحتفاظ بالبيانات التفصيلية في قاعدة البيانات، لكنها غير
            معروضة في الواجهة الآن حفاظًا على الخصوصية. يمكن متابعة إدارة
            الطلاب ونقلهم بين الحلقات من صفحة إدارة الطلاب الأساسية.
          </p>
          <Link
            href="/onsite/admin/students"
            className="mt-6 inline-flex rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1f6358]"
          >
            الرجوع إلى إدارة الطلاب
          </Link>
        </section>
      </div>
    </main>
  );
}
