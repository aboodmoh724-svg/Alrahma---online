import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const operationSections = [
  {
    href: "/remote/supervision/teacher-requests",
    title: "طلبات المعلمين",
    description: "طلبات الاختبارات، الطلاب المتعثرون، الحالات الخاصة، والردود الإشرافية.",
    tone: "bg-[#173d42] text-white",
  },
  {
    href: "/remote/supervision/tasks",
    title: "المهام الإشرافية",
    description: "مهام المتابعة المفتوحة، الانتظار، والإغلاق بعد اكتمال الإجراء.",
    tone: "bg-white text-[#173d42]",
  },
  {
    href: "/remote/supervision/teacher-visits",
    title: "زيارات المعلمين",
    description: "تسجيل الزيارات وإصدار تقرير PDF وإرساله للمعلم.",
    tone: "bg-[#fffaf2] text-[#173d42]",
  },
  {
    href: "/remote/supervision/registrations",
    title: "الطلبات المحولة من الإدارة",
    description: "الطلبات الجاهزة للتقييم والتوزيع بعد تحويلها من الإدارة.",
    tone: "bg-[#1f6358] text-white",
  },
];

export default async function RemoteSupervisionOperationsPage() {
  const [teacherRequestsCount, tasksCount, registrationsCount] = await Promise.all([
    prisma.teacherRequest.count({
      where: {
        status: { in: ["NEW", "IN_REVIEW"] },
      },
    }),
    prisma.supervisionTask.count({
      where: {
        status: { in: ["NEW", "IN_PROGRESS", "WAITING"] },
      },
    }),
    prisma.registrationRequest.count({
      where: {
        forwardedToSupervisionAt: { not: null },
        supervisionStatus: { in: ["PENDING", "UNDER_REVIEW", "ON_HOLD"] },
      },
    }),
  ]);

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">المتابعة الإشرافية</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              كل ما يحتاج متابعة يومية خارج توزيع الطلاب والمعلمين في مدخل واحد.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طلبات معلمين مفتوحة</p>
            <p className="mt-2 text-4xl font-black text-[#1f6358]">{teacherRequestsCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">مهام مفتوحة</p>
            <p className="mt-2 text-4xl font-black text-[#8a6335]">{tasksCount}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">طلبات محولة</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">{registrationsCount}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {operationSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`min-h-44 rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${section.tone}`}
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 text-sm leading-8 opacity-75">{section.description}</p>
              <span className="mt-6 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
                فتح
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
