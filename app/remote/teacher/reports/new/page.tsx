"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Student = {
  id: string
  fullName: string
}

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const studentIdFromUrl = searchParams.get("studentId") || ""

  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    studentId: studentIdFromUrl,
    lessonName: "",
    review: "",
    homework: "",
    note: "",
    status: "PRESENT",
  })

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      studentId: studentIdFromUrl,
    }))
  }, [studentIdFromUrl])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true)

        const res = await fetch("/api/students", {
          cache: "no-store",
        })

        const text = await res.text()
        console.log("RAW STUDENTS RESPONSE =>", text)

        const data = JSON.parse(text)

        console.log("STUDENTS API RESPONSE =>", data)

        if (res.ok) {
          setStudents(Array.isArray(data.students) ? data.students : [])
        } else {
          console.error("FAILED TO LOAD STUDENTS =>", data)
          setStudents([])
        }
      } catch (error) {
        console.error("FETCH STUDENTS ERROR =>", error)
        setStudents([])
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    console.log("FIELD CHANGE =>", { name, value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      studentId: formData.studentId,
      lessonName: formData.lessonName,
      review: formData.review,
      homework: formData.homework,
      note: formData.note,
      status: formData.status,
    }

    console.log("SUBMIT PAYLOAD =>", payload)

    try {
      setSubmitting(true)

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      console.log("API RESPONSE =>", data)

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء حفظ التقرير")
        return
      }

      alert("تم حفظ التقرير بنجاح")
      router.push("/remote/teacher/dashboard")
      router.refresh()
    } catch (error) {
      console.error("SUBMIT ERROR =>", error)
      alert("حدث خطأ أثناء حفظ التقرير")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStudentExists = students.some(
    (student) => student.id === formData.studentId
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">إضافة تقرير جديد</h1>
          <p className="mt-2 text-sm text-gray-600">
            أدخل بيانات التقرير ثم اضغط حفظ
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                الطالب
              </label>

              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
                disabled={loadingStudents}
              >
                <option value="">
                  {loadingStudents ? "جاري تحميل الطلاب..." : "اختر الطالب"}
                </option>

                {formData.studentId && !selectedStudentExists && (
                  <option value={formData.studentId}>
                    الطالب المحدد من الرابط
                  </option>
                )}

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                الدرس
              </label>
              <input
                type="text"
                name="lessonName"
                value={formData.lessonName}
                onChange={handleChange}
                placeholder="أدخل اسم الدرس"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                المراجعة
              </label>
              <textarea
                name="review"
                value={formData.review}
                onChange={handleChange}
                placeholder="أدخل المراجعة"
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                الواجب
              </label>
              <textarea
                name="homework"
                value={formData.homework}
                onChange={handleChange}
                placeholder="أدخل الواجب"
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                الملاحظات
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="أدخل الملاحظات"
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                الحالة
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="PRESENT">حاضر</option>
                <option value="ABSENT">غائب</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "جارٍ الحفظ..." : "حفظ التقرير"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/remote/teacher/dashboard")}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}