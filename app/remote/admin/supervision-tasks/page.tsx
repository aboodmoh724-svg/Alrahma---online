"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  fullName: string;
  studentCode: string | null;
};

type Task = {
  id: string;
  title: string;
  details: string;
  category: string;
  status: "NEW" | "IN_PROGRESS" | "WAITING" | "DONE";
  createdAt: string;
  student: Student | null;
};

const CATEGORY_OPTIONS = [
  { value: "GENERAL_SUPERVISION", label: "مهمة إشرافية" },
  { value: "TEACHER_VISIT", label: "زيارة معلم" },
  { value: "TEACHER_REQUEST", label: "متابعة طلب معلم" },
  { value: "ABSENCE_STREAK", label: "متابعة غياب" },
  { value: "MEMORIZATION_STREAK", label: "متابعة حفظ" },
];

const STATUS_LABELS: Record<Task["status"], string> = {
  NEW: "جديدة",
  IN_PROGRESS: "قيد المتابعة",
  WAITING: "انتظار",
  DONE: "منتهية",
};

export default function RemoteAdminSupervisionTasksPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    details: "",
    category: "GENERAL_SUPERVISION",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, tasksRes] = await Promise.all([
        fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/supervision-tasks?source=ADMIN", { cache: "no-store" }),
      ]);
      const [studentsData, tasksData] = await Promise.all([
        studentsRes.json(),
        tasksRes.json(),
      ]);

      setStudents(
        Array.isArray(studentsData.students)
          ? studentsData.students.map((student: Student) => ({
              id: student.id,
              fullName: student.fullName,
              studentCode: student.studentCode,
            }))
          : []
      );
      setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
    } catch (error) {
      console.error("FETCH ADMIN SUPERVISION TASKS ERROR =>", error);
      setStudents([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/supervision-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إنشاء المهمة");
        return;
      }

      setFormData({
        studentId: "",
        title: "",
        details: "",
        category: "GENERAL_SUPERVISION",
      });
      await fetchData();
      alert("تم إرسال المهمة إلى المتابعة الإشرافية");
    } catch (error) {
      console.error("CREATE ADMIN SUPERVISION TASK ERROR =>", error);
      alert("حدث خطأ أثناء إنشاء المهمة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">مهام الإشراف</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              أنشئ مهمة للمشرفين، وستظهر مباشرة في المتابعة الإشرافية ضمن الجديدة ثم تتحرك حسب حالة المتابعة.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإدارة
          </Link>
        </div>

        <form onSubmit={createTask} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <h2 className="text-2xl font-black text-[#1c2d31]">إضافة مهمة جديدة</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_260px_1fr]">
            <select
              value={formData.category}
              onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={formData.studentId}
              onChange={(event) => setFormData((prev) => ({ ...prev, studentId: event.target.value }))}
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
            >
              <option value="">بدون طالب محدد</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}{student.studentCode ? ` - ${student.studentCode}` : ""}
                </option>
              ))}
            </select>
            <input
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="عنوان المهمة"
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
              required
            />
          </div>
          <textarea
            value={formData.details}
            onChange={(event) => setFormData((prev) => ({ ...prev, details: event.target.value }))}
            placeholder="تفاصيل المهمة المطلوبة من المشرف"
            className="mt-4 min-h-32 w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
            required
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#173d42] px-6 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {submitting ? "جارٍ الإرسال..." : "إرسال للمشرفين"}
            </button>
          </div>
        </form>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <h2 className="text-2xl font-black text-[#1c2d31]">آخر المهام الإدارية</h2>
          {loading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
              جاري التحميل...
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
              لا توجد مهام إدارية مرسلة للإشراف حتى الآن.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {tasks.slice(0, 8).map((task) => (
                <article key={task.id} className="rounded-[1.5rem] bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                      {STATUS_LABELS[task.status]}
                    </span>
                    {task.student ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f6358] ring-1 ring-[#d9c8ad]">
                        {task.student.fullName}{task.student.studentCode ? ` - ${task.student.studentCode}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-lg font-black text-[#173d42]">{task.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]/70">{task.details}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
