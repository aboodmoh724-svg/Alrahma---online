"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type ReportItem = {
  id: string
  lessonName: string
  review: string | null
  homework: string
  note: string | null
  status: "PRESENT" | "ABSENT"
  createdAt: string
  student: {
    id: string
    fullName: string
    studyMode: "REMOTE" | "ONSITE"
    teacher: {
      id: string
      fullName: string
      email: string
    }
  }
}

export default function RemoteAdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/admin-reports", {
        cache: "no-store",
      })

      const data = await res.json()

      console.log("ADMIN REPORTS DATA =>", data)

      setReports(Array.isArray(data.reports) ? data.reports : [])
    } catch (error) {
      console.error("FETCH ADMIN REPORTS ERROR =>", error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">عرض التقارير</h1>
            <p className="mt-1 text-sm text-gray-600">
              جميع التقارير المحفوظة في النظام
            </p>
          </div>

          <Link
            href="/remote/admin/dashboard"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            الرجوع للداشبورد
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              قائمة التقارير
            </h2>
            <span className="text-sm text-gray-500">
              {reports.length} تقرير
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              جاري التحميل...
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              لا توجد تقارير حتى الآن
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-xl">
                <thead>
                  <tr className="bg-gray-100 text-right text-sm text-gray-600">
                    <th className="px-4 py-3 font-medium">الطالب</th>
                    <th className="px-4 py-3 font-medium">المعلم</th>
                    <th className="px-4 py-3 font-medium">الدرس</th>
                    <th className="px-4 py-3 font-medium">الواجب</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-gray-100 text-sm align-top"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {report.student.fullName}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {report.student.teacher?.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{report.lessonName}</div>
                        {report.review ? (
                          <div className="mt-1 text-xs text-gray-500">
                            مراجعة: {report.review}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{report.homework}</div>
                        {report.note ? (
                          <div className="mt-1 text-xs text-gray-500">
                            ملاحظة: {report.note}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {report.status === "PRESENT" ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            حاضر
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            غائب
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(report.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}