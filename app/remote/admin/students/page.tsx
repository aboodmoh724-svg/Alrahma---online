"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  studyMode?: "REMOTE" | "ONSITE";
  isActive?: boolean;
};

type Circle = {
  id: string;
  name: string;
  studyMode: "REMOTE" | "ONSITE";
  teacher: Teacher | null;
};

type Student = {
  id: string;
  studentCode: string | null;
  fullName: string;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
  createdAt: string;
  teacher: Teacher;
  circle: Circle | null;
};

export default function RemoteAdminStudentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    teacherId: "",
    circleId: "",
    studyMode: "REMOTE",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, studentsRes, circlesRes] = await Promise.all([
        fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/circles?studyMode=REMOTE", { cache: "no-store" }),
      ]);

      const teachersData = await teachersRes.json();
      const studentsData = await studentsRes.json();
      const circlesData = await circlesRes.json();

      const teachersList = Array.isArray(teachersData.teachers)
        ? (teachersData.teachers as Teacher[])
        : [];
      const studentsList = Array.isArray(studentsData.students)
        ? (studentsData.students as Student[])
        : [];
      const circlesList = Array.isArray(circlesData.circles)
        ? (circlesData.circles as Circle[])
        : [];

      setTeachers(
        teachersList.filter(
          (teacher) => teacher.studyMode === "REMOTE" && teacher.isActive !== false
        )
      );
      setStudents(
        studentsList.filter(
          (student) => student.studyMode === "REMOTE" && student.isActive !== false
        )
      );
      setCircles(circlesList.filter((circle) => circle.studyMode === "REMOTE"));
    } catch (error) {
      console.error("FETCH REMOTE STUDENTS PAGE DATA ERROR =>", error);
      setTeachers([]);
      setStudents([]);
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const findOnlyTeacherCircle = (teacherId: string) => {
    const teacherCircles = circles.filter(
      (circle) => circle.teacher?.id === teacherId
    );

    return teacherCircles.length === 1 ? teacherCircles[0] : null;
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "circleId"
        ? {
            teacherId:
              circles.find((circle) => circle.id === value)?.teacher?.id ||
              prev.teacherId,
          }
        : {}),
      ...(name === "teacherId"
        ? {
            circleId: findOnlyTeacherCircle(value)?.id || prev.circleId,
          }
        : {}),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, studyMode: "REMOTE" }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة الطالب");
        return;
      }

      alert("تمت إضافة الطالب بنجاح");
      setFormData({ fullName: "", teacherId: "", circleId: "", studyMode: "REMOTE" });
      await fetchData();
    } catch (error) {
      console.error("CREATE REMOTE STUDENT ERROR =>", error);
      alert("حدث خطأ أثناء إضافة الطالب");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStudent = async (
    studentId: string,
    patch: { fullName?: string; teacherId?: string; circleId?: string | null }
  ) => {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "تعذر تحديث بيانات الطالب");
      return false;
    }

    return true;
  };

  const handleDeleteStudent = async (student: Student) => {
    const confirmed = window.confirm(`هل تريد حذف الطالب ${student.fullName}؟`);
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر حذف الطالب");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("DELETE REMOTE STUDENT ERROR =>", error);
      alert("حدث خطأ أثناء حذف الطالب");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditName(student.fullName);
  };

  const saveStudentName = async (studentId: string) => {
    const ok = await updateStudent(studentId, { fullName: editName });
    if (ok) {
      setEditingStudentId(null);
      await fetchData();
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة طلاب الأونلاين</h1>
            <p className="mt-1 text-sm text-gray-600">
              هذه الصفحة تعرض طلاب التعليم عن بعد فقط.
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">إضافة طالب جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="اسم الطالب"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required
              />
              <select
                name="circleId"
                value={formData.circleId}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">بدون حلقة</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </select>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                required={!formData.circleId}
              >
                <option value="">اختر المعلم</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "جاري الحفظ..." : "إضافة الطالب"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">قائمة الطلاب</h2>
              <span className="text-sm text-gray-500">{students.length} طالب</span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                جاري التحميل...
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                لا يوجد طلاب أونلاين حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-xl">
                  <thead>
                    <tr className="bg-gray-100 text-right text-sm text-gray-600">
                      <th className="px-4 py-3 font-medium">رقم الطالب</th>
                      <th className="px-4 py-3 font-medium">اسم الطالب</th>
                      <th className="px-4 py-3 font-medium">المعلم</th>
                      <th className="px-4 py-3 font-medium">الحلقة</th>
                      <th className="px-4 py-3 font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 text-sm">
                        <td className="px-4 py-3 font-bold text-[#1f6358]">
                          {student.studentCode || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {editingStudentId === student.id ? (
                            <input
                              value={editName}
                              onChange={(event) => setEditName(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            />
                          ) : (
                            student.fullName
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <select
                            value={student.teacher?.id || ""}
                            onChange={async (event) => {
                              const ok = await updateStudent(student.id, {
                                teacherId: event.target.value,
                              });
                              if (ok) await fetchData();
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                          >
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <select
                            value={student.circle?.id || ""}
                            onChange={async (event) => {
                              const ok = await updateStudent(student.id, {
                                circleId: event.target.value || null,
                              });
                              if (ok) await fetchData();
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                          >
                            <option value="">بدون حلقة</option>
                            {circles.map((circle) => (
                              <option key={circle.id} value={circle.id}>
                                {circle.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {editingStudentId === student.id ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => saveStudentName(student.id)}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setEditingStudentId(null)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-60"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(student)}
                                className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800"
                              >
                                تعديل الاسم
                              </button>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleDeleteStudent(student)}
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
