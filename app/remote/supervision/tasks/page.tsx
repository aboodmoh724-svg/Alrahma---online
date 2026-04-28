"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  details: string;
  source: "AUTOMATIC" | "TEACHER" | "ADMIN";
  category: "MEMORIZATION_STREAK" | "ABSENCE_STREAK" | "TEACHER_REQUEST" | "TEACHER_VISIT" | "GENERAL_SUPERVISION";
  status: "NEW" | "IN_PROGRESS" | "WAITING" | "DONE";
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    studentCode: string | null;
    teacher: {
      id: string;
      fullName: string;
    };
  } | null;
  actions: Array<{
    id: string;
    title: string;
    details: string;
    createdAt: string;
    actor: {
      id: string;
      fullName: string;
    } | null;
  }>;
};

const STATUS_OPTIONS = [
  { value: "NEW", label: "طلبات جديدة" },
  { value: "IN_PROGRESS", label: "قيد المتابعة" },
  { value: "WAITING", label: "انتظار" },
  { value: "DONE", label: "منتهية" },
] as const;

const ACTION_TYPE_OPTIONS = [
  { value: "GENERAL_ACTION", label: "إجراء عام" },
  { value: "PARENT_CONTACT", label: "تواصل مع ولي الأمر" },
  { value: "TEACHER_CONTACT", label: "تواصل مع المعلم" },
  { value: "CLASS_VISIT", label: "زيارة فصل" },
  { value: "TEACHER_VISIT", label: "زيارة معلم" },
];

const CATEGORY_OPTIONS = [
  { value: "GENERAL_SUPERVISION", label: "مهمة إشرافية" },
  { value: "TEACHER_VISIT", label: "زيارة معلم" },
];

const SOURCE_LABELS: Record<Task["source"], string> = {
  AUTOMATIC: "تلقائي",
  TEACHER: "طلب معلم",
  ADMIN: "من الإدارة",
};

export default function RemoteSupervisionTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; studentCode: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeStatus, setActiveStatus] = useState<Task["status"]>("NEW");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, Task["status"]>>({});
  const [actionTitles, setActionTitles] = useState<Record<string, string>>({});
  const [actionDetails, setActionDetails] = useState<Record<string, string>>({});
  const [actionTypes, setActionTypes] = useState<Record<string, string>>({});
  const [contactedParent, setContactedParent] = useState<Record<string, boolean>>({});
  const [contactedTeacher, setContactedTeacher] = useState<Record<string, boolean>>({});
  const [createForm, setCreateForm] = useState({
    studentId: "",
    title: "",
    details: "",
    category: "GENERAL_SUPERVISION",
  });

  const filteredTasks = useMemo(
    () => tasks.filter((task) => task.status === activeStatus),
    [tasks, activeStatus]
  );

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [tasksRes, studentsRes] = await Promise.all([
        fetch("/api/supervision-tasks", { cache: "no-store" }),
        fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
      ]);

      const [tasksData, studentsData] = await Promise.all([tasksRes.json(), studentsRes.json()]);
      const list = Array.isArray(tasksData.tasks) ? (tasksData.tasks as Task[]) : [];

      setTasks(list);
      setStudents(
        Array.isArray(studentsData.students)
          ? studentsData.students.map((student: { id: string; fullName: string; studentCode: string | null }) => ({
              id: student.id,
              fullName: student.fullName,
              studentCode: student.studentCode,
            }))
          : []
      );
      setStatusDrafts(Object.fromEntries(list.map((task) => [task.id, task.status])));
      setActionTypes(Object.fromEntries(list.map((task) => [task.id, "GENERAL_ACTION"])));
    } catch (error) {
      console.error("FETCH SUPERVISION TASKS PAGE ERROR =>", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const saveTask = async (taskId: string) => {
    try {
      setSavingId(taskId);
      const response = await fetch("/api/supervision-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: statusDrafts[taskId],
          actionTitle: actionTitles[taskId] || "إجراء إشرافي",
          actionDetails: actionDetails[taskId] || "",
          actionType: actionTypes[taskId] || "GENERAL_ACTION",
          contactedParent: contactedParent[taskId] === true,
          contactedTeacher: contactedTeacher[taskId] === true,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث المهمة");
        return;
      }

      await fetchTasks();
    } catch (error) {
      console.error("UPDATE SUPERVISION TASK PAGE ERROR =>", error);
      alert("حدث خطأ أثناء تحديث المهمة");
    } finally {
      setSavingId(null);
    }
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setFormSubmitting(true);
      const response = await fetch("/api/supervision-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إنشاء المهمة");
        return;
      }

      setCreateForm({
        studentId: "",
        title: "",
        details: "",
        category: "GENERAL_SUPERVISION",
      });
      await fetchTasks();
    } catch (error) {
      console.error("CREATE SUPERVISION TASK PAGE ERROR =>", error);
      alert("حدث خطأ أثناء إنشاء المهمة");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">المهام الإشرافية</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              هنا تجتمع المهام التلقائية وطلبات المعلمين والمهام التي تضعها الإدارة للمشرفين.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        <form onSubmit={createTask} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <h2 className="text-2xl font-black text-[#1c2d31]">إضافة مهمة من الإدارة</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_220px_1fr_1fr_auto]">
            <select
              value={createForm.category}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={createForm.studentId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, studentId: event.target.value }))}
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
              value={createForm.title}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="عنوان المهمة"
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
              required
            />
            <input
              value={createForm.details}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, details: event.target.value }))}
              placeholder="تفاصيل المهمة أو خطة الزيارة"
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
              required
            />
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-[#173d42] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {formSubmitting ? "جارٍ الحفظ..." : "إضافة"}
            </button>
          </div>
        </form>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveStatus(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeStatus === option.value
                    ? "bg-[#173d42] text-white"
                    : "bg-[#fffaf2] text-[#1c2d31] ring-1 ring-[#d9c8ad]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
              جاري التحميل...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
              لا توجد مهام في هذا القسم حاليًا.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="rounded-[1.8rem] bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                      {SOURCE_LABELS[task.source]}
                    </span>
                    {task.student ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f6358] ring-1 ring-[#d9c8ad]">
                        {task.student.fullName}{task.student.studentCode ? ` - ${task.student.studentCode}` : ""}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-xl font-black text-[#173d42]">{task.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]/72">{task.details}</p>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[220px_220px_1fr_1fr]">
                    <select
                      value={statusDrafts[task.id] || task.status}
                      onChange={(event) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [task.id]: event.target.value as Task["status"],
                        }))
                      }
                      className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={actionTypes[task.id] || "GENERAL_ACTION"}
                      onChange={(event) =>
                        setActionTypes((prev) => ({
                          ...prev,
                          [task.id]: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                    >
                      {ACTION_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={actionTitles[task.id] || ""}
                      onChange={(event) =>
                        setActionTitles((prev) => ({
                          ...prev,
                          [task.id]: event.target.value,
                        }))
                      }
                      placeholder="عنوان الإجراء المتخذ"
                      className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                    />

                    <textarea
                      value={actionDetails[task.id] || ""}
                      onChange={(event) =>
                        setActionDetails((prev) => ({
                          ...prev,
                          [task.id]: event.target.value,
                        }))
                      }
                      placeholder="الإجراء المتخذ أو خطة المتابعة"
                      className="min-h-24 rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1c2d31]">
                      <input
                        type="checkbox"
                        checked={contactedParent[task.id] === true}
                        onChange={(event) =>
                          setContactedParent((prev) => ({
                            ...prev,
                            [task.id]: event.target.checked,
                          }))
                        }
                      />
                      تم التواصل مع ولي الأمر
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-[#1c2d31]">
                      <input
                        type="checkbox"
                        checked={contactedTeacher[task.id] === true}
                        onChange={(event) =>
                          setContactedTeacher((prev) => ({
                            ...prev,
                            [task.id]: event.target.checked,
                          }))
                        }
                      />
                      تم التواصل مع المعلم
                    </label>
                    <button
                      type="button"
                      onClick={() => saveTask(task.id)}
                      disabled={savingId === task.id}
                      className="rounded-xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {savingId === task.id ? "جارٍ الحفظ..." : "حفظ الإجراء"}
                    </button>
                  </div>

                  {task.actions.length > 0 ? (
                    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#e7dcc8]">
                      <p className="text-sm font-black text-[#8a6335]">آخر الإجراءات</p>
                      <div className="mt-3 space-y-2 text-sm text-[#1c2d31]/70">
                        {task.actions.map((action) => (
                          <div key={action.id}>
                            <p className="font-black text-[#1c2d31]">{action.title}</p>
                            <p>{action.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
