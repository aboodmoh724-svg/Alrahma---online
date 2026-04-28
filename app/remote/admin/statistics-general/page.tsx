import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RemoteAdminStatisticsGeneralPage() {
  const [
    studentsCount,
    teachersCount,
    circlesCount,
    pendingRegistrations,
    forwardedRegistrations,
    teacherRequestsCount,
    supervisionTasksCount,
  ] = await Promise.all([
    prisma.student.count({ where: { studyMode: "REMOTE", isActive: true } }),
    prisma.user.count({ where: { studyMode: "REMOTE", role: "TEACHER", isActive: true } }),
    prisma.circle.count({ where: { studyMode: "REMOTE" } }),
    prisma.registrationRequest.count({ where: { status: "PENDING" } }),
    prisma.registrationRequest.count({
      where: {
        forwardedToSupervisionAt: { not: null },
        supervisionStatus: { in: ["PENDING", "UNDER_REVIEW", "ON_HOLD"] },
      },
    }),
    prisma.teacherRequest.count({
      where: { status: { in: ["NEW", "IN_REVIEW"] } },
    }),
    prisma.supervisionTask.count({
      where: { status: { in: ["NEW", "IN_PROGRESS", "WAITING"] } },
    }),
  ]);

  const cards = [
    ["الطلاب", studentsCount],
    ["المعلمون", teachersCount],
    ["الحلقات", circlesCount],
    ["طلبات التسجيل الجديدة", pendingRegistrations],
    ["طلبات بانتظار الإشراف", forwardedRegistrations],
    ["طلبات المعلمين المفتوحة", teacherRequestsCount],
    ["المهام الإشرافية المفتوحة", supervisionTasksCount],
  ];

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">إحصائيات عامة</h1>
          </div>
          <Link href="/remote/admin/dashboard" className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#1c2d31]">
            الرجوع إلى الإدارة
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">{label}</p>
              <p className="mt-2 text-4xl font-black text-[#173d42]">{value}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
