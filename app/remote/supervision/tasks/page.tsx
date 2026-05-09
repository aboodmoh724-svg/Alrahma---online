"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "DONE";

type Task = {
  id: string;
  title: string;
  details: string;
  source: "AUTOMATIC" | "TEACHER" | "ADMIN";
  category: "MEMORIZATION_STREAK" | "ABSENCE_STREAK" | "TEACHER_REQUEST" | "TEACHER_VISIT" | "GENERAL_SUPERVISION";
  status: TaskStatus;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    studentCode: string | null;
    teacher: {
      id: string;
      fullName: string;
    } | null;
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

const STATUS_TABS: Array<{ value: TaskStatus; label: string; hint: string }> = [
  { value: "NEW", label: "الجديدة", hint: "تحتاج قرارًا" },
  { value: "IN_PROGRESS", label: "قيد المتابعة", hint: "بدأ العمل عليها" },
  { value: "WAITING", label: "انتظار", hint: "تنتظر ردًا أو موعدًا" },
  { value: "DONE", label: "منتهية", hint: "أُغلقت بإجراء" },
];

const SOURCE_LABELS: Record<Task["source"], string> = {
  AUTOMATIC: "تنبيه تلقائي",
  TEACHER: "طلب معلم",
  ADMIN: "من الإدارة",
};

const CATEGORY_LABELS: Record<Task["category"], string> = {
  MEMORIZATION_STREAK: "تعثر حفظ",
  ABSENCE_STREAK: "غياب متكرر",
  TEACHER_REQUEST: "طلب معلم",
  TEACHER_VISIT: "زيارة معلم",
  GENERAL_SUPERVISION: "مهمة عامة",
};

const URL_PATTERN = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi;

function taskLinks(text: string) {
  const matches = text.match(URL_PATTERN) || [];
  return [...new Set(matches)].map((url) => (url.startsWith("http") ? url : `https://${url}`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function actionTypeFor(title: string) {
  if (/ولي|الأمر|الوالد|الوالدة/.test(title)) return "PARENT_CONTACT";
  if (/معلم/.test(title)) return "TEACHER_CONTACT";
  if (/زيارة|دخول|حلقة|فصل/.test(title)) return "CLASS_VISIT";
  return "GENERAL_ACTION";
}

export default function RemoteSupervisionTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<TaskStatus>("NEW");
  const [actionDetails, setActionDetails] = useState<Record<string, string>>({});
  const [actionTitles, setActionTitles] = useState<Record<string, string>>({});
  const [contactMarks, setContactMarks] = useState<Record<string, { parent: boolean; teacher: boolean }>>({});

  const counts = useMemo(() => {
    return STATUS_TABS.reduce<Record<TaskStatus, number>>((acc, tab) => {
      acc[tab.value] = tasks.filter((task) => task.status === tab.value).length;
      return acc;
    }, { NEW: 0, IN_PROGRESS: 0, WAITING: 0, DONE: 0 });
  }, [tasks]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => task.status === activeStatus),
    [tasks, activeStatus]
  );

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksRes = await fetch("/api/supervision-tasks", { cache: "no-store" });
      const tasksData = await tasksRes.json();
      const list = Array.isArray(tasksData.tasks) ? (tasksData.tasks as Task[]) : [];

      setTasks(list);
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

  const saveTask = async (task: Task, status: TaskStatus, fallbackTitle: string) => {
    const title = (actionTitles[task.id] || fallbackTitle).trim();
    const details = (actionDetails[task.id] || fallbackTitle).trim();
    const marks = contactMarks[task.id] || { parent: false, teacher: false };

    try {
      setSavingId(task.id);
      const response = await fetch("/api/supervision-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          status,
          actionTitle: title,
          actionDetails: details,
          actionType: actionTypeFor(title + " " + details),
          contactedParent: marks.parent,
          contactedTeacher: marks.teacher,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر حفظ الإجراء");
        return;
      }

      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status } : item)));
      setActionDetails((prev) => ({ ...prev, [task.id]: "" }));
      setActionTitles((prev) => ({ ...prev, [task.id]: "" }));
    } catch (error) {
      console.error("UPDATE SUPERVISION TASK PAGE ERROR =>", error);
      alert("حدث خطأ أثناء حفظ الإجراء");
    } finally {
      setSavingId(null);
    }
  };

  const updateMark = (taskId: string, key: "parent" | "teacher", value: boolean) => {
    setContactMarks((prev) => ({
      ...prev,
      [taskId]: {
        parent: prev[taskId]?.parent || false,
        teacher: prev[taskId]?.teacher || false,
        [key]: value,
      },
    }));
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#8a661f]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">المهام الإشرافية</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              كل بطاقة تحتاج قرارًا سريعًا: اكتب الإجراء، ثم اختر أين تذهب المهمة.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
              className={`rounded-[1.5rem] p-4 text-right shadow-sm ring-1 transition ${
                activeStatus === tab.value
                  ? "bg-[#0a3f2a] text-white ring-[#0a3f2a]"
                  : "bg-white text-[#1c2d31] ring-[#d8bf83] hover:bg-[#fffaf4]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-black">{tab.label}</span>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${activeStatus === tab.value ? "bg-white text-[#0a3f2a]" : "bg-[#fffaf4] text-[#8a661f]"}`}>
                  {counts[tab.value]}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold opacity-70">{tab.hint}</p>
            </button>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
              جاري التحميل...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
              لا توجد مهام في هذا القسم حاليًا.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const links = taskLinks(`${task.title}\n${task.details}`);
                const marks = contactMarks[task.id] || { parent: false, teacher: false };
                const isSaving = savingId === task.id;

                return (
                  <article key={task.id} className="rounded-[1.7rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#0a3f2a] px-3 py-1 text-xs font-black text-white">
                            {SOURCE_LABELS[task.source]}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#8a661f] ring-1 ring-[#d8bf83]">
                            {CATEGORY_LABELS[task.category]}
                          </span>
                          <span className="text-xs font-bold text-[#1c2d31]/50">{formatDate(task.createdAt)}</span>
                        </div>

                        <h2 className="mt-3 text-2xl font-black text-[#0a3f2a]">{task.title}</h2>
                        {task.student ? (
                          <p className="mt-2 text-sm font-black text-[#1c2d31]">
                            الطالب: {task.student.fullName}
                            {task.student.studentCode ? ` - ${task.student.studentCode}` : ""}
                            {task.student.teacher?.fullName ? ` | المعلم: ${task.student.teacher.fullName}` : ""}
                          </p>
                        ) : null}
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#1c2d31]/72">{task.details}</p>

                        {links.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {links.map((url, index) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl bg-[#0f5a35] px-4 py-2 text-sm font-black text-white"
                              >
                                فتح الرابط {links.length > 1 ? index + 1 : ""}
                              </a>
                            ))}
                          </div>
                        ) : null}

                        {task.actions.length > 0 ? (
                          <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#e7d7b4]">
                            <p className="text-sm font-black text-[#8a661f]">آخر إجراء</p>
                            <p className="mt-2 font-black text-[#1c2d31]">{task.actions[0].title}</p>
                            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/65">{task.actions[0].details}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-[1.4rem] bg-white p-4 ring-1 ring-[#e7d7b4]">
                        <p className="text-sm font-black text-[#8a661f]">الإجراء المتخذ</p>
                        <input
                          value={actionTitles[task.id] || ""}
                          onChange={(event) => setActionTitles((prev) => ({ ...prev, [task.id]: event.target.value }))}
                          placeholder="مثال: تم التواصل مع المعلم"
                          className="mt-3 w-full rounded-xl border border-[#d8bf83] px-4 py-3 text-sm outline-none"
                        />
                        <textarea
                          value={actionDetails[task.id] || ""}
                          onChange={(event) => setActionDetails((prev) => ({ ...prev, [task.id]: event.target.value }))}
                          placeholder="اكتب خلاصة الإجراء أو خطة المتابعة..."
                          className="mt-3 min-h-28 w-full rounded-xl border border-[#d8bf83] px-4 py-3 text-sm outline-none"
                        />

                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <label className={`rounded-xl border px-3 py-3 text-sm font-black ${marks.parent ? "border-[#0f5a35] bg-[#eef8f0] text-[#0a3f2a]" : "border-[#d8bf83] text-[#1c2d31]"}`}>
                            <input
                              type="checkbox"
                              checked={marks.parent}
                              onChange={(event) => updateMark(task.id, "parent", event.target.checked)}
                              className="ml-2"
                            />
                            تم التواصل مع ولي الأمر
                          </label>
                          <label className={`rounded-xl border px-3 py-3 text-sm font-black ${marks.teacher ? "border-[#0f5a35] bg-[#eef8f0] text-[#0a3f2a]" : "border-[#d8bf83] text-[#1c2d31]"}`}>
                            <input
                              type="checkbox"
                              checked={marks.teacher}
                              onChange={(event) => updateMark(task.id, "teacher", event.target.checked)}
                              className="ml-2"
                            />
                            تم التواصل مع المعلم
                          </label>
                        </div>

                        <div className="mt-4 grid gap-2">
                          <button
                            type="button"
                            onClick={() => saveTask(task, "DONE", "تم إنهاء المتابعة")}
                            disabled={isSaving}
                            className="rounded-xl bg-[#0a3f2a] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                          >
                            حفظ وإنهاء المهمة
                          </button>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => saveTask(task, "IN_PROGRESS", "تم بدء المتابعة")}
                              disabled={isSaving}
                              className="rounded-xl bg-[#e8f4ed] px-3 py-3 text-xs font-black text-[#0a3f2a] disabled:opacity-60"
                            >
                              قيد المتابعة
                            </button>
                            <button
                              type="button"
                              onClick={() => saveTask(task, "WAITING", "بانتظار رد أو موعد")}
                              disabled={isSaving}
                              className="rounded-xl bg-[#fff2d8] px-3 py-3 text-xs font-black text-[#8a661f] disabled:opacity-60"
                            >
                              انتظار
                            </button>
                            <button
                              type="button"
                              onClick={() => saveTask(task, "WAITING", "تحويل للإدارة")}
                              disabled={isSaving}
                              className="rounded-xl bg-[#f6e7e7] px-3 py-3 text-xs font-black text-[#8a1f1f] disabled:opacity-60"
                            >
                              تحويل للإدارة
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
