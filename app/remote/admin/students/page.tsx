"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Teacher = {
  id: string
  fullName: string
  email: string
}

type Student = {
  id: string
  fullName: string
  studyMode: "REMOTE" | "ONSITE"
  isActive: boolean
  createdAt: string
  teacher: {
    id: string
    fullName: string
    email: string
  }
}

export default function RemoteAdminStudentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    teacherId: "",
    studyMode: "REMOTE",
  })

  const fetchData = async () => {
    try {
      setLoading(true)

      const [teachersRes, studentsRes] = await Promise.all([
        fetch("/api/teachers", { cache: "no-store" }),
        fetch("/api/students", { cache: "no-store" }),
      ])

      const teachersData = await teachersRes.json()
      const studentsData = await studentsRes.json()

      console.log("TEACHERS DATA =>", teachersData)
      console.log("STUDENTS DATA =>", studentsData)

      setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : [])
      setStudents(Array.isArray(studentsData.students) ? studentsData.students : [])
    } catch (error) {
      console.error("FETCH PAGE DATA ERROR =>", error)
      setTeachers([])
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      console.log("CREATE STUDENT RESPONSE =>", data)

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة الطالب")
        return
      }

      alert("تمت إضافة الطالب بنجاح")

      setFormData({
        fullName: "",
        teacherId: "",
        studyMode: "REMOTE",
      })

      await fetchData()
    } catch (error) {
      console.error("CREATE STUDENT SUBMIT ERROR =>", error)
      alert("حدث خطأ أثناء إضافة الطالب")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الطلاب</h1>
            <p className="mt-1 text-sm text-gray-600">
              إضافة الطلاب وعرض جميع الطلاب المسجلين
            </p>
          </div>

          <Link
            href="/remote/admin/dashboard"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            الرجوع للداشبورد
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                إضافة طالب جديد
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    اسم الطالب
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="أدخل اسم الطالب"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    المعلم
                  </label>
                  <select
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">اختر المعلم</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    نوع الدراسة
                  </label>
                  <select
                    name="studyMode"
                    value={formData.studyMode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="REMOTE">عن بعد</option>
                    <option value="ONSITE">حضوري</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "جارٍ الإضافة..." : "إضافة الطالب"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  قائمة الطلاب
                </h2>
                <span className="text-sm text-gray-500">
                  {students.length} طالب
                </span>
              </div>

              {loading ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  جاري التحميل...
                </div>
              ) : students.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  لا يوجد طلاب حتى الآن
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full overflow-hidden rounded-xl">
                    <thead>
                      <tr className="bg-gray-100 text-right text-sm text-gray-600">
                        <th className="px-4 py-3 font-medium">اسم الطالب</th>
                        <th className="px-4 py-3 font-medium">المعلم</th>
                        <th className="px-4 py-3 font-medium">نوع الدراسة</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b border-gray-100 text-sm"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {student.fullName}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {student.teacher?.fullName || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {student.studyMode === "REMOTE" ? "عن بعد" : "حضوري"}
                          </td>
                          <td className="px-4 py-3">
                            {student.isActive ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                نشط
                              </span>
                            ) : (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                غير نشط
                              </span>
                            )}
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
      </div>
    </div>
  )
}