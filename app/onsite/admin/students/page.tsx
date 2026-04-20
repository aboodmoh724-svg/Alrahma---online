"use client";

import { useEffect, useMemo, useState } from "react";
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
  parentWhatsapp?: string | null;
  parentEmail?: string | null;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
  createdAt: string;
  teacher: Teacher;
  circle: Circle | null;
};

export default function OnsiteAdminStudentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    teacherId: "",
    circleId: "",
    studyMode: "ONSITE",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, studentsRes, circlesRes] = await Promise.all([
        fetch("/api/teachers?studyMode=ONSITE", { cache: "no-store" }),
        fetch("/api/students?studyMode=ONSITE", { cache: "no-store" }),
        fetch("/api/circles?studyMode=ONSITE", { cache: "no-store" }),
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
        teachersList.filter((t) => t.studyMode === "ONSITE" && t.isActive !== false)
      );
      setStudents(studentsList.filter((s) => s.studyMode === "ONSITE"));
      setCircles(circlesList.filter((c) => c.studyMode === "ONSITE"));
    } catch (error) {
      console.error("FETCH ONSITE STUDENTS PAGE DATA ERROR =>", error);
      setTeachers([]);
      setStudents([]);
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) setSearchTerm(query);
    fetchData();
  }, []);

  const findOnlyTeacherCircle = (teacherId: string) => {
    const teacherCircles = circles.filter(
      (circle) => circle.teacher?.id === teacherId
    );

    return teacherCircles.length === 1 ? teacherCircles[0] : null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, studyMode: "ONSITE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة الطالب");
        return;
      }

      alert("تمت إضافة الطالب بنجاح");

      setFormData({
        fullName: "",
        teacherId: "",
        circleId: "",
        studyMode: "ONSITE",
      });

      await fetchData();
    } catch (error) {
      console.error("CREATE ONSITE STUDENT SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إضافة الطالب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferStudent = async (studentId: string, circleId: string) => {
    const res = await fetch(`/api/students/${studentId}/circle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "تعذر نقل الطالب إلى الحلقة");
      return;
    }

    await fetchData();
  };

  const updateStudent = async (
    studentId: string,
    patch: Partial<Pick<Student, "parentWhatsapp" | "parentEmail">> & {
      fullName?: string;
      teacherId?: string;
      circleId?: string | null;
    }
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

  const unassignedCount = useMemo(
    () => students.filter((s) => !s.circle?.id).length,
    [students]
  );
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) => {
      const haystack = [
        student.fullName,
        student.studentCode || "",
        student.teacher?.fullName || "",
        student.circle?.name || "",
        student.parentWhatsapp || "",
        student.parentEmail || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchTerm, students]);

  const startEditName = (student: Student) => {
    setEditingStudentId(student.id);
    setEditName(student.fullName);
  };

  const saveStudentName = async (studentId: string) => {
    const ok = await updateStudent(studentId, { fullName: editName.trim() });
    if (ok) {
      setEditingStudentId(null);
      await fetchData();
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              إدارة الطلاب (حضوري)
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              إضافة الطلاب، نقلهم للحلقات، ومراجعة بيانات ولي الأمر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#9b7039] ring-1 ring-[#d9c8ad]">
              بلا حلقة: {unassignedCount}
            </span>
            <Link
              href="/onsite/admin/dashboard"
              className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] lg:col-span-1">
            <h2 className="mb-4 text-lg font-black text-[#1c2d31]">
              إضافة طالب جديد
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="أدخل اسم الطالب"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  الحلقة
                </label>
                <select
                  name="circleId"
                  value={formData.circleId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                >
                  <option value="">بدون حلقة</option>
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>
                      {circle.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                  عند اختيار حلقة، يتم تعيين المعلم تلقائيًا من معلم الحلقة.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  المعلم
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none focus:border-[#1f6358]"
                  required={!formData.circleId}
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "جاري الإضافة..." : "إضافة الطالب"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1c2d31]">قائمة الطلاب</h2>
                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                  ابحث باسم الطالب ثم عدل بياناته من نفس الجدول.
                </p>
              </div>
              <span className="text-sm font-bold text-[#1c2d31]/60">
                {filteredStudents.length} / {students.length} طالب
              </span>
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="بحث باسم الطالب أو رقم الطالب أو الحلقة أو المعلم"
              className="mb-4 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#1f6358]"
            />

            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                جاري التحميل...
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                لا يوجد طلاب حضوريين حتى الآن
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                لا توجد نتائج مطابقة للبحث.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full overflow-hidden rounded-2xl">
                  <thead>
                    <tr className="bg-[#fffaf2] text-right text-sm text-[#1c2d31]/70">
                      <th className="px-4 py-3 font-black">رقم الطالب</th>
                      <th className="px-4 py-3 font-black">اسم الطالب</th>
                      <th className="px-4 py-3 font-black">المعلم</th>
                      <th className="px-4 py-3 font-black">الحلقة</th>
                      <th className="px-4 py-3 font-black">ولي الأمر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-[#d9c8ad]/30 text-sm"
                      >
                        <td className="px-4 py-3 font-black text-[#1f6358]">
                          {student.studentCode || "-"}
                        </td>
                        <td className="px-4 py-3 font-black text-[#1c2d31]">
                          {editingStudentId === student.id ? (
                            <div className="flex min-w-56 flex-wrap gap-2">
                              <input
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                                className="min-w-40 rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#1f6358]"
                              />
                              <button
                                type="button"
                                onClick={() => saveStudentName(student.id)}
                                className="rounded-xl bg-[#1f6358] px-3 py-2 text-xs font-black text-white"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStudentId(null)}
                                className="rounded-xl border border-[#d9c8ad] px-3 py-2 text-xs font-black text-[#1c2d31]"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex min-w-48 items-center gap-2">
                              <span>{student.fullName}</span>
                              <button
                                type="button"
                                onClick={() => startEditName(student)}
                                className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-black text-amber-800"
                              >
                                تعديل
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          <select
                            value={student.teacher?.id || ""}
                            onChange={async (event) => {
                              const ok = await updateStudent(student.id, {
                                teacherId: event.target.value,
                              });
                              if (ok) await fetchData();
                            }}
                            className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                          >
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          <select
                            value={student.circle?.id || ""}
                            onChange={async (event) => {
                              const ok = await updateStudent(student.id, {
                                circleId: event.target.value || null,
                              });
                              if (ok) await fetchData();
                            }}
                            className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                          >
                            <option value="">بدون حلقة</option>
                            {circles.map((circle) => (
                              <option key={circle.id} value={circle.id}>
                                {circle.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-[#1c2d31]/70">
                          <div className="grid gap-2">
                            <input
                              defaultValue={student.parentWhatsapp || ""}
                              placeholder="واتساب ولي الأمر"
                              className="w-full rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1f6358]"
                              onBlur={async (e) => {
                                const next = e.target.value.trim();
                                if ((student.parentWhatsapp || "") === next) return;
                                const ok = await updateStudent(student.id, {
                                  parentWhatsapp: next || null,
                                });
                                if (ok) await fetchData();
                              }}
                            />
                            <input
                              defaultValue={student.parentEmail || ""}
                              placeholder="إيميل ولي الأمر (اختياري)"
                              className="w-full rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#1f6358]"
                              onBlur={async (e) => {
                                const next = e.target.value.trim();
                                if ((student.parentEmail || "") === next) return;
                                const ok = await updateStudent(student.id, {
                                  parentEmail: next || null,
                                });
                                if (ok) await fetchData();
                              }}
                            />
                          </div>
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

