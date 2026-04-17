import Link from "next/link";

export default function OnsitePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-3 text-center text-4xl font-bold text-slate-800">
          التعليم الحضوري
        </h1>
        <p className="mb-10 text-center text-slate-500">
          اختر نوع الدخول
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/onsite/admin/login"
            className="rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-slate-800">
              دخول الإداري
            </h2>
          </Link>

          <Link
            href="/onsite/teacher/login"
            className="rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-slate-800">
              دخول المعلم
            </h2>
          </Link>
        </div>
      </div>
    </main>
  );
}