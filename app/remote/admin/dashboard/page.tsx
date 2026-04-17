import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function RemoteAdminDashboardPage() {
  const teachersCount = await prisma.user.count({
    where: { role: "TEACHER" },
  })

  const studentsCount = await prisma.student.count()
  const reportsCount = await prisma.report.count()

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
      <div className="w-full max-w-5xl space-y-10">
        <div className="text-center">
          <div className="mb-4 text-5xl font-bold text-[#24363D]">ALRAHMA</div>

          <h1 className="text-3xl font-bold text-[#24363D]">
            لوحة تحكم الإداري
          </h1>

          <p className="mt-2 text-[#24363D]/70">
            تحفيظ الرحمة للقرآن الكريم
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-[#C2A27A]/20 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">عدد المعلمين</p>
            <p className="mt-3 text-4xl font-bold text-[#24363D]">
              {teachersCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#C2A27A]/20 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">عدد الطلاب</p>
            <p className="mt-3 text-4xl font-bold text-[#24363D]">
              {studentsCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#C2A27A]/20 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">عدد التقارير</p>
            <p className="mt-3 text-4xl font-bold text-[#24363D]">
              {reportsCount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link
            href="/remote/admin/students"
            className="rounded-2xl bg-[#24363D] p-5 text-center font-medium text-white transition hover:opacity-90"
          >
            إدارة الطلاب
          </Link>

          <Link
            href="/remote/admin/teachers"
            className="rounded-2xl bg-[#C2A27A] p-5 text-center font-medium text-white transition hover:opacity-90"
          >
            إدارة المعلمين
          </Link>

          <Link
            href="/remote/admin/reports"
            className="rounded-2xl border border-[#24363D] p-5 text-center font-medium text-[#24363D] transition hover:bg-[#24363D] hover:text-white"
          >
            عرض التقارير
          </Link>
        </div>
      </div>
    </div>
  )
}