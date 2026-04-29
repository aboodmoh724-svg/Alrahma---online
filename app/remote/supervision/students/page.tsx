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
  parentWhatsapp: string | null;
  parentEmail?: string | null;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
  createdAt: string;
  teacher: Teacher;
  circle: Circle | null;
};

export default function RemoteSupervisionStudentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

      setTeachers(
        Array.isArray(teachersData.teachers)
          ? teachersData.teachers.filter(
              (teacher: Teacher) => teacher.studyMode === "REMOTE" && teacher.isActive !== false
            )
          : []
      );
      setStudents(
        Array.isArray(studentsData.students)
          ? studentsData.students.filter(
              (student: Student) => student.studyMode === "REMOTE" && student.isActive !== false
            )
          : []
      );
      setCircles(
        Array.isArray(circlesData.circles)
          ? circlesData.circles.filter((circle: Circle) => circle.studyMode === "REMOTE")
          : []
      );
    } catch (error) {
      console.error("FETCH SUPERVISION STUDENTS ERROR =>", error);
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

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;

    return students.filter((student) =>
      [
        student.fullName,
        student.studentCode || "",
        student.parentWhatsapp || "",
        student.parentEmail || "",
        student.teacher?.fullName || "",
        student.circle?.name || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search, students]);

  const updateStudent = async (
    studentId: string,
    patch: { teacherId?: string; circleId?: string | null }
  ) => {
    try {
      setSavingStudentId(studentId);
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر تحديث توزيع الطالب");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("UPDATE SUPERVISION STUDENT ERROR =>", error);
      alert("حدث خطأ أثناء تحديث توزيع الطالب");
    } finally {
      setSavingStudentId(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">توزيع الطلاب</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              الطلاب يصلون من الطلبات المحولة من الإدارة. من هنا يمكن فقط تعديل الحلقة أو المعلم المسؤول.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">إجمالي الطلاب</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">{students.length}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">بلا حلقة</p>
            <p className="mt-2 text-4xl font-black text-[#c39a62]">
              {students.filter((student) => !student.circle?.id).length}
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المعلمون المتاحون</p>
            <p className="mt-2 text-4xl font-black text-[#1f6358]">{teachers.length}</p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <label className="mb-2 block text-sm font-black text-[#1c2d31]">بحث</label>
          <div className="relative">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم الطالب أو رقمه أو المعلم أو الحلقة"
              className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-4 pl-12 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#173d42] text-sm font-black text-white"
                aria-label="مسح البحث"
              >
                ×
              </button>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1c2d31]">قائمة الطلاب</h2>
            <span className="text-sm font-bold text-[#1c2d31]/55">{filteredStudents.length}</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/60">
              جاري تحميل الطلاب...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-8 text-center text-sm text-[#1c2d31]/60">
              لا توجد نتائج مطابقة.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-2xl">
                <thead>
                  <tr className="bg-[#fffaf2] text-right text-sm text-[#1c2d31]/65">
                    <th className="px-4 py-3 font-black">الرقم</th>
                    <th className="px-4 py-3 font-black">الطالب</th>
                    <th className="px-4 py-3 font-black">ولي الأمر</th>
                    <th className="px-4 py-3 font-black">المعلم</th>
                    <th className="px-4 py-3 font-black">الحلقة</th>
                    <th className="px-4 py-3 font-black">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-[#d9c8ad]/50 text-sm">
                      <td className="px-4 py-3 font-black text-[#1f6358]">
                        {student.studentCode || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black text-[#1c2d31]">{student.fullName}</p>
                        <p className="mt-1 text-xs text-[#1c2d31]/55">
                          أضيف في {new Date(student.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#1c2d31]/70" dir="ltr">
                        {student.parentWhatsapp || student.parentEmail || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={student.teacher?.id || ""}
                          disabled={savingStudentId === student.id}
                          onChange={(event) => updateStudent(student.id, { teacherId: event.target.value })}
                          className="min-w-44 rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm text-[#1c2d31] outline-none focus:border-[#1f6358]"
                        >
                          <option value="">بدون معلم</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.fullName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={student.circle?.id || ""}
                          disabled={savingStudentId === student.id}
                          onChange={(event) =>
                            updateStudent(student.id, { circleId: event.target.value || null })
                          }
                          className="min-w-44 rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm text-[#1c2d31] outline-none focus:border-[#1f6358]"
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
                        <span className="rounded-full bg-[#eef7f5] px-3 py-1 text-xs font-black text-[#1f6358]">
                          {savingStudentId === student.id ? "جار التحديث" : "نشط"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
