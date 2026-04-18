import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function trackLabel(track: string | null) {
  if (track === "HIJAA") return "مسار الهجاء";
  if (track === "RUBAI") return "المسار الرباعي";
  if (track === "FARDI") return "المسار الفردي";
  if (track === "TILAWA") return "مسار التلاوة";
  return "غير محدد";
}

export default async function RemoteAdminStatisticsPage() {
  const [
    teachersCount,
    studentsCount,
    circlesCount,
    reportsCount,
    unassignedStudentsCount,
    circlesByTrack,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "TEACHER", studyMode: "REMOTE" },
    }),
    prisma.student.count({
      where: { studyMode: "REMOTE", isActive: true },
    }),
    prisma.circle.count({
      where: { studyMode: "REMOTE" },
    }),
    prisma.report.count(),
    prisma.student.count({
      where: {
        studyMode: "REMOTE",
        isActive: true,
        circleId: null,
      },
    }),
    prisma.circle.groupBy({
      by: ["track"],
      where: { studyMode: "REMOTE" },
      _count: {
        _all: true,
      },
    }),
  ]);

  const stats = [
    { label: "عدد المعلمين", value: teachersCount },
    { label: "عدد الطلاب", value: studentsCount },
    { label: "عدد الحلقات", value: circlesCount },
    { label: "إجمالي التقارير", value: reportsCount },
    { label: "طلاب بلا حلقة", value: unassignedStudentsCount, id: "unassigned-students" },
  ];

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">الإحصائيات</h1>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              id={stat.id}
              className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
            >
              <p className="text-sm font-bold text-[#1c2d31]/55">{stat.label}</p>
              <p className="mt-2 text-4xl font-black text-[#173d42]">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <h2 className="text-xl font-black text-[#1c2d31]">توزيع الحلقات حسب المسارات</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {circlesByTrack.length === 0 ? (
              <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">
                لا توجد حلقات بعد.
              </p>
            ) : (
              circlesByTrack.map((item) => (
                <div
                  key={item.track || "none"}
                  className="rounded-2xl bg-[#fffaf2] p-4"
                >
                  <p className="font-black text-[#1c2d31]">{trackLabel(item.track)}</p>
                  <p className="mt-2 text-3xl font-black text-[#1f6358]">
                    {item._count._all}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
