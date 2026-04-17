"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Teacher = {
  id: string
  fullName: string
  email: string
  studyMode: "REMOTE" | "ONSITE"
  isActive: boolean
  createdAt: string
}

export default function RemoteAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    studyMode: "REMOTE",
  })

  const fetchTeachers = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/teachers", {
        cache: "no-store",
      })

      const data = await res.json()

      console.log("TEACHERS DATA =>", data)

      setTeachers(Array.isArray(data.teachers) ? data.teachers : [])
    } catch (error) {
      console.error("FETCH TEACHERS ERROR =>", error)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
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

      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      console.log("CREATE TEACHER RESPONSE =>", data)

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة المعلم")
        return
      }

      alert("تمت إضافة المعلم بنجاح")

      setFormData({
        fullName: "",
        email: "",
        password: "",
        studyMode: "REMOTE",
      })

      await fetchTeachers()
    } catch (error) {
      console.error("CREATE TEACHER SUBMIT ERROR =>", error)
      alert("حدث خطأ أثناء إضافة المعلم")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المعلمين</h1>
            <p className="mt-1 text-sm text-gray-600">
              إضافة المعلمين وعرض جميع المعلمين المسجلين
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
                إضافة معلم جديد
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    اسم المعلم
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="أدخل اسم المعلم"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@test.com"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    كلمة المرور
                  </label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="أدخل كلمة المرور"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    required
                  />
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
                  className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "جارٍ الإضافة..." : "إضافة المعلم"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  قائمة المعلمين
                </h2>
                <span className="text-sm text-gray-500">
                  {teachers.length} معلم
                </span>
              </div>

              {loading ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  جاري التحميل...
                </div>
              ) : teachers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  لا يوجد معلمون حتى الآن
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full overflow-hidden rounded-xl">
                    <thead>
                      <tr className="bg-gray-100 text-right text-sm text-gray-600">
                        <th className="px-4 py-3 font-medium">الاسم</th>
                        <th className="px-4 py-3 font-medium">البريد</th>
                        <th className="px-4 py-3 font-medium">نوع الدراسة</th>
                        <th className="px-4 py-3 font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher) => (
                        <tr
                          key={teacher.id}
                          className="border-b border-gray-100 text-sm"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {teacher.fullName}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {teacher.email}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {teacher.studyMode === "REMOTE" ? "عن بعد" : "حضوري"}
                          </td>
                          <td className="px-4 py-3">
                            {teacher.isActive ? (
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