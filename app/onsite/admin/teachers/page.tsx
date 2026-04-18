"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Teacher = {
  id: string
  fullName: string
  email: string
  studyMode: "REMOTE" | "ONSITE"
  isActive: boolean
  createdAt: string
}

export default function OnsiteAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    fullName: "",
    email: "",
  })

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    studyMode: "ONSITE",
  })

  const fetchTeachers = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/teachers", {
        cache: "no-store",
      })

      const data = await res.json()
      const list = Array.isArray(data.teachers) ? (data.teachers as Teacher[]) : []
      setTeachers(list.filter((t) => t.studyMode === "ONSITE"))
    } catch (error) {
      console.error("FETCH ONSITE TEACHERS ERROR =>", error)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const activeTeachers = useMemo(
    () => teachers.filter((t) => t.isActive),
    [teachers]
  )

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
        body: JSON.stringify({ ...formData, studyMode: "ONSITE" }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة المعلم")
        return
      }

      alert("تمت إضافة المعلم بنجاح")

      setFormData({
        fullName: "",
        email: "",
        password: "",
        studyMode: "ONSITE",
      })

      await fetchTeachers()
    } catch (error) {
      console.error("CREATE ONSITE TEACHER SUBMIT ERROR =>", error)
      alert("حدث خطأ أثناء إضافة المعلم")
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id)
    setEditData({
      fullName: teacher.fullName,
      email: teacher.email,
    })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdateTeacher = async (teacherId: string) => {
    try {
      setSubmitting(true)

      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId,
          fullName: editData.fullName,
          email: editData.email,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "تعذر تحديث بيانات المعلم")
        return
      }

      setEditingTeacherId(null)
      await fetchTeachers()
    } catch (error) {
      console.error("UPDATE ONSITE TEACHER ERROR =>", error)
      alert("حدث خطأ أثناء تحديث بيانات المعلم")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTeacher = async (teacher: Teacher) => {
    const confirmed = window.confirm(
      `هل تريد حذف المعلم ${teacher.fullName}؟ لا يمكن حذف المعلم إذا كان مرتبطا بطلاب أو حلقات.`
    )

    if (!confirmed) return

    try {
      setSubmitting(true)

      const res = await fetch("/api/teachers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherId: teacher.id }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "تعذر حذف المعلم")
        return
      }

      await fetchTeachers()
    } catch (error) {
      console.error("DELETE ONSITE TEACHER ERROR =>", error)
      alert("حدث خطأ أثناء حذف المعلم")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              إدارة المعلمين (حضوري)
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              إضافة المعلمين وعرض جميع المعلمين المسجلين للحضوري.
            </p>
          </div>

          <Link
            href="/onsite/admin/dashboard"
            className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] lg:col-span-1">
            <h2 className="mb-4 text-lg font-black text-[#1c2d31]">
              إضافة معلم جديد
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  اسم المعلم
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="أدخل اسم المعلم"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@test.com"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  كلمة المرور
                </label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="أدخل كلمة المرور"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "جارٍ الإضافة..." : "إضافة المعلم"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1c2d31]">قائمة المعلمين</h2>
              <span className="text-sm font-bold text-[#1c2d31]/60">
                {activeTeachers.length} نشط / {teachers.length} إجمالي
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                جاري التحميل...
              </div>
            ) : teachers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                لا يوجد معلمون حضوريون حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-2xl">
                  <thead>
                    <tr className="bg-[#fffaf2] text-right text-sm text-[#1c2d31]/70">
                      <th className="px-4 py-3 font-black">الاسم</th>
                      <th className="px-4 py-3 font-black">البريد</th>
                      <th className="px-4 py-3 font-black">الحالة</th>
                      <th className="px-4 py-3 font-black">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="border-b border-[#d9c8ad]/30 text-sm"
                      >
                        <td className="px-4 py-3 font-black text-[#1c2d31]">
                          {editingTeacherId === teacher.id ? (
                            <input
                              type="text"
                              name="fullName"
                              value={editData.fullName}
                              onChange={handleEditChange}
                              className="w-full rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                            />
                          ) : (
                            teacher.fullName
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          {editingTeacherId === teacher.id ? (
                            <input
                              type="email"
                              name="email"
                              value={editData.email}
                              onChange={handleEditChange}
                              className="w-full rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                            />
                          ) : (
                            teacher.email
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {teacher.isActive ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                              نشط
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              غير نشط
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingTeacherId === teacher.id ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleUpdateTeacher(teacher.id)}
                                className="rounded-xl bg-[#1f6358] px-3 py-2 text-xs font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setEditingTeacherId(null)}
                                className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#1c2d31] ring-1 ring-[#d9c8ad] disabled:opacity-60"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(teacher)}
                                className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-200"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleDeleteTeacher(teacher)}
                                className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 disabled:opacity-60"
                              >
                                حذف
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

