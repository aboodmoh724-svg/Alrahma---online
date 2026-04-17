import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function RemoteTeacherDashboardPage() {
  const teacherEmail = "teacher@test.com"

  const teacher = await prisma.user.findUnique({
    where: { email: teacherEmail },
    include: {
      students: {
        orderBy: {
          fullName: "asc",
        },
        include: {
          reports: true,
        },
      },
      zoomLinks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })

  if (!teacher) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          المعلم غير موجود
        </div>
      </div>
    )
  }

  const studentsCount = teacher.students.length

  const reportsCount = teacher.students.reduce(
  (total: number, student) => total + student.reports.length,
  0
)

  const latestZoomLink = teacher.zoomLinks[0]?.url || null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المعلم</h1>
            <p className="mt-1 text-sm text-gray-600">
              أهلاً {teacher.fullName}
            </p>
          </div>

          <Link
            href="/remote/teacher/reports/new"
            className="rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            إضافة تقرير
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">عدد الطلاب</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{studentsCount}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">عدد التقارير</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{reportsCount}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">رابط الزوم</p>
            {latestZoomLink ? (
              <a
                href={latestZoomLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-sm font-medium text-blue-600 hover:underline"
              >
                فتح الرابط
              </a>
            ) : (
              <p className="mt-2 text-sm text-gray-400">لا يوجد رابط محفوظ</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">الطلاب</h2>
            <span className="text-sm text-gray-500">{studentsCount} طالب</span>
          </div>

          {teacher.students.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              لا يوجد طلاب حتى الآن
            </div>
          ) : (
            <div className="space-y-3">
              {teacher.students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{student.fullName}</p>
                    <p className="text-sm text-gray-500">
                      عدد التقارير: {student.reports.length}
                    </p>
                  </div>

                  <Link
                    href={`/remote/teacher/reports/new?studentId=${student.id}`}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    إضافة تقرير
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}