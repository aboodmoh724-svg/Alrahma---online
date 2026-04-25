"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
  createdAt: string;
};

export default function RemoteAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ fullName: "", email: "", whatsapp: "" });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    whatsapp: "",
    studyMode: "REMOTE",
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teachers?studyMode=REMOTE", {
        cache: "no-store",
      });
      const data = await res.json();
      const list = Array.isArray(data.teachers) ? (data.teachers as Teacher[]) : [];
      setTeachers(list.filter((teacher) => teacher.studyMode === "REMOTE"));
    } catch (error) {
      console.error("FETCH REMOTE TEACHERS ERROR =>", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, studyMode: "REMOTE" }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة المعلم");
        return;
      }

      if (data.whatsappSent) {
        alert("تمت إضافة المعلم وإرسال رسالة الترحيب عبر واتساب بنجاح");
      } else if (data.whatsappWarning) {
        alert(data.whatsappWarning);
      } else {
        alert("تمت إضافة المعلم بنجاح");
      }

      setFormData({ fullName: "", email: "", password: "", whatsapp: "", studyMode: "REMOTE" });
      await fetchTeachers();
    } catch (error) {
      console.error("CREATE REMOTE TEACHER ERROR =>", error);
      alert("حدث خطأ أثناء إضافة المعلم");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setEditData({
      fullName: teacher.fullName,
      email: teacher.email,
      whatsapp: teacher.whatsapp || "",
    });
  };

  const handleUpdateTeacher = async (teacherId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editData, teacherId, studyMode: "REMOTE" }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر تحديث بيانات المعلم");
        return;
      }

      setEditingTeacherId(null);
      await fetchTeachers();
    } catch (error) {
      console.error("UPDATE REMOTE TEACHER ERROR =>", error);
      alert("حدث خطأ أثناء تحديث بيانات المعلم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    const confirmed = window.confirm(
      `هل تريد حذف المعلم ${teacher.fullName}؟ لا يمكن حذف المعلم إذا كان مرتبطا بطلاب أو حلقات.`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/teachers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher.id, studyMode: "REMOTE" }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر حذف المعلم");
        return;
      }

      await fetchTeachers();
    } catch (error) {
      console.error("DELETE REMOTE TEACHER ERROR =>", error);
      alert("حدث خطأ أثناء حذف المعلم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة معلمي الأونلاين</h1>
            <p className="mt-1 text-sm text-gray-600">
              هذه الصفحة تعرض معلمي التعليم عن بعد فقط.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">إضافة معلم جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="اسم المعلم"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="البريد الإلكتروني"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="كلمة المرور"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="رقم واتساب المعلم"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "جاري الحفظ..." : "إضافة المعلم"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">قائمة المعلمين</h2>
              <span className="text-sm text-gray-500">{teachers.length} معلم</span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                جاري التحميل...
              </div>
            ) : teachers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                لا يوجد معلمون أونلاين حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-xl">
                  <thead>
                    <tr className="bg-gray-100 text-right text-sm text-gray-600">
                      <th className="px-4 py-3 font-medium">الاسم</th>
                      <th className="px-4 py-3 font-medium">البريد</th>
                      <th className="px-4 py-3 font-medium">واتساب</th>
                      <th className="px-4 py-3 font-medium">الحالة</th>
                      <th className="px-4 py-3 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-gray-100 text-sm">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {editingTeacherId === teacher.id ? (
                            <input
                              type="text"
                              value={editData.fullName}
                              onChange={(event) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  fullName: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                          ) : (
                            teacher.fullName
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {editingTeacherId === teacher.id ? (
                            <input
                              type="email"
                              value={editData.email}
                              onChange={(event) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  email: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                          ) : (
                            teacher.email
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {editingTeacherId === teacher.id ? (
                            <input
                              type="text"
                              value={editData.whatsapp}
                              onChange={(event) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  whatsapp: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                              dir="ltr"
                            />
                          ) : (
                            teacher.whatsapp || "-"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            {teacher.isActive ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {editingTeacherId === teacher.id ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleUpdateTeacher(teacher.id)}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setEditingTeacherId(null)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-60"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(teacher)}
                                className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleDeleteTeacher(teacher)}
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 disabled:opacity-60"
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
  );
}
