"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RequestStatus = "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
type RequestType = "TEST_REQUEST" | "STRUGGLING_STUDENT" | "SPECIAL_CASE" | "GENERAL";
type TaskStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "DONE";
type RegistrationStatus = "PENDING" | "UNDER_REVIEW" | "PLACED" | "ON_HOLD";

type TeacherRequest = {
  id: string;
  type: RequestType;
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: RequestStatus;
  subject: string;
  details: string;
  adminNote: string | null;
  createdAt: string;
  teacherNotificationReadAt?: string | null;
  teacherNotificationSentAt?: string | null;
  teacher: {
    id: string;
    fullName: string;
  };
  student: {
    id: string;
    fullName: string;
    studentCode: string | null;
  } | null;
};

type Task = {
  id: string;
  title: string;
  details: string;
  status: TaskStatus;
  source: "AUTOMATIC" | "TEACHER" | "ADMIN";
  category: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    studentCode: string | null;
  } | null;
};

type RegistrationRequest = {
  id: string;
  studentName: string;
  requestedTracks: string | null;
  supervisionStatus: RegistrationStatus;
  forwardedToSupervisionAt: string | null;
};

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  GENERAL: "طلب عام",
  TEST_REQUEST: "طلب اختبار",
  STRUGGLING_STUDENT: "طالب متعثر",
  SPECIAL_CASE: "حالة خاصة",
};

const STATUS_LANES: Array<{ value: RequestStatus; label: string; hint: string }> = [
  { value: "NEW", label: "وارد جديد", hint: "طلبات تحتاج قراءة أولى" },
  { value: "IN_REVIEW", label: "قيد المتابعة", hint: "طلبات فتحها المشرف" },
  { value: "RESOLVED", label: "منتهية", hint: "تم اتخاذ الإجراء" },
  { value: "REJECTED", label: "مغلقة بلا إجراء", hint: "لا تحتاج متابعة" },
];

const QUICK_ACTIONS = [
  "زيارة الحلقة",
  "التواصل مع ولي الأمر",
  "التواصل مع المعلم",
  "تحويلها لمهمة متابعة",
  "طلب توضيح من المعلم",
];

function formatDate(date: string) {
  return new Date(date).toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OperationsPageClient() {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RequestStatus>>({});
  const [actionDrafts, setActionDrafts] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, tasksRes, registrationsRes] = await Promise.all([
        fetch("/api/teacher-requests", { cache: "no-store" }),
        fetch("/api/supervision-tasks", { cache: "no-store" }),
        fetch("/api/registration-requests", { cache: "no-store" }),
      ]);
      const [requestsData, tasksData, registrationsData] = await Promise.all([
        requestsRes.json(),
        tasksRes.json(),
        registrationsRes.json(),
      ]);
      const requestList = Array.isArray(requestsData.requests)
        ? (requestsData.requests as TeacherRequest[])
        : [];

      setRequests(requestList);
      setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
      setRegistrations(
        Array.isArray(registrationsData.requests)
          ? registrationsData.requests.filter(
              (item: RegistrationRequest) => item.forwardedToSupervisionAt
            )
          : []
      );
      setNotes(Object.fromEntries(requestList.map((request) => [request.id, request.adminNote || ""])));
      setStatusDrafts(Object.fromEntries(requestList.map((request) => [request.id, request.status])));
      setActionDrafts(Object.fromEntries(requestList.map((request) => [request.id, ""])));
      setActiveRequestId((current) => current || requestList[0]?.id || null);
    } catch (error) {
      console.error("FETCH SUPERVISION OPERATIONS ERROR =>", error);
      setRequests([]);
      setTasks([]);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeRequest = requests.find((request) => request.id === activeRequestId) || requests[0] || null;
  const openRequests = requests.filter((request) => ["NEW", "IN_REVIEW"].includes(request.status));
  const openTasks = tasks.filter((task) => ["NEW", "IN_PROGRESS", "WAITING"].includes(task.status));
  const pendingRegistrations = registrations.filter((item) =>
    ["PENDING", "UNDER_REVIEW", "ON_HOLD"].includes(item.supervisionStatus)
  );

  const requestsByStatus = useMemo(() => {
    return Object.fromEntries(
      STATUS_LANES.map((lane) => [
        lane.value,
        requests.filter((request) => request.status === lane.value),
      ])
    ) as Record<RequestStatus, TeacherRequest[]>;
  }, [requests]);

  const saveRequest = async (requestId: string, status?: RequestStatus) => {
    try {
      setSavingId(requestId);
      const selectedAction = actionDrafts[requestId];
      const baseNote = notes[requestId] || "";
      const adminNote = selectedAction
        ? `${selectedAction}${baseNote ? `: ${baseNote}` : ""}`
        : baseNote;

      const response = await fetch("/api/teacher-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status: status || statusDrafts[requestId] || "IN_REVIEW",
          adminNote,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث طلب المعلم");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("SAVE TEACHER REQUEST FROM OPERATIONS ERROR =>", error);
      alert("حدث خطأ أثناء تحديث طلب المعلم");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">المتابعة الإشرافية</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              مساحة واحدة لقراءة طلبات المعلمين واتخاذ إجراء سريع، مع الوصول للمهام والزيارات وطلبات التسجيل.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Link href="#teacher-requests" className="rounded-[2rem] bg-[#173d42] p-5 text-white shadow-sm">
            <p className="text-sm font-bold text-white/70">طلبات المعلمين</p>
            <p className="mt-2 text-4xl font-black">{openRequests.length}</p>
            <p className="mt-3 text-xs font-bold text-[#f1d39d]">اضغط للمتابعة</p>
          </Link>
          <Link href="/remote/supervision/tasks" className="rounded-[2rem] bg-[#f8efe0] p-5 text-[#173d42] shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/60">المهام</p>
            <p className="mt-2 text-4xl font-black">{openTasks.length}</p>
            <p className="mt-3 text-xs font-bold text-[#9b7039]">فتح المهام</p>
          </Link>
          <Link href="/remote/supervision/teacher-visits" className="rounded-[2rem] bg-[#1f6358] p-5 text-white shadow-sm">
            <p className="text-sm font-bold text-white/70">زيارات المعلمين</p>
            <p className="mt-2 text-4xl font-black">+</p>
            <p className="mt-3 text-xs font-bold text-[#f1d39d]">تسجيل زيارة</p>
          </Link>
          <Link href="/remote/supervision/registrations" className="rounded-[2rem] bg-white p-5 text-[#173d42] shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/60">طلبات التسجيل</p>
            <p className="mt-2 text-4xl font-black">{pendingRegistrations.length}</p>
            <p className="mt-3 text-xs font-bold text-[#9b7039]">فتح الطلبات</p>
          </Link>
        </section>

        <section id="teacher-requests" className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <div className="rounded-[2rem] bg-white/88 p-4 shadow-sm ring-1 ring-[#d9c8ad]">
            <h2 className="px-1 text-2xl font-black text-[#1c2d31]">وارد المعلمين</h2>
            <p className="mt-1 px-1 text-sm leading-7 text-[#1c2d31]/60">
              اختر طلباً، اقرأه، ثم احفظ الإجراء المناسب.
            </p>

            {loading ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                جاري التحميل...
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                لا توجد طلبات حالياً.
              </div>
            ) : (
              <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pl-1">
                {requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setActiveRequestId(request.id)}
                    className={`w-full rounded-2xl p-4 text-right transition ${
                      activeRequest?.id === request.id
                        ? "bg-[#173d42] text-white"
                        : "bg-[#fffaf2] text-[#1c2d31] ring-1 ring-[#eadcc6] hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-black">
                        {REQUEST_TYPE_LABELS[request.type]}
                      </span>
                      {request.status === "NEW" ? (
                        <span className="rounded-full bg-[#c39a62] px-3 py-1 text-xs font-black text-white">
                          جديد
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 font-black">{request.subject}</p>
                    <p className="mt-1 text-sm opacity-70">
                      {request.teacher.fullName}
                      {request.student ? ` - ${request.student.fullName}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            {activeRequest ? (
              <article className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef7f5] px-3 py-1 text-xs font-black text-[#1f6358]">
                        {REQUEST_TYPE_LABELS[activeRequest.type]}
                      </span>
                      <span className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-black text-[#9b7039] ring-1 ring-[#d9c8ad]">
                        {formatDate(activeRequest.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-3xl font-black text-[#1c2d31]">{activeRequest.subject}</h2>
                    <p className="mt-2 text-sm text-[#1c2d31]/60">
                      المعلم: {activeRequest.teacher.fullName}
                      {activeRequest.student
                        ? ` - الطالب: ${activeRequest.student.fullName}${activeRequest.student.studentCode ? ` (${activeRequest.student.studentCode})` : ""}`
                        : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm font-black text-[#1c2d31] ring-1 ring-[#d9c8ad]">
                    {activeRequest.teacherNotificationReadAt
                      ? `قرأ المعلم الرد: ${formatDate(activeRequest.teacherNotificationReadAt)}`
                      : activeRequest.teacherNotificationSentAt
                        ? "تم إرسال الرد ولم يقرأه المعلم بعد"
                        : "لم يرسل رد للمعلم بعد"}
                  </div>
                </div>

                <p className="mt-5 rounded-[1.5rem] bg-[#fffaf2] p-5 text-sm leading-8 text-[#1c2d31]/75 ring-1 ring-[#eadcc6]">
                  {activeRequest.details}
                </p>

                <div className="mt-5 grid gap-4 xl:grid-cols-[220px_1fr]">
                  <div className="space-y-3">
                    <select
                      value={statusDrafts[activeRequest.id] || activeRequest.status}
                      onChange={(event) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [activeRequest.id]: event.target.value as RequestStatus,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                    >
                      {STATUS_LANES.map((lane) => (
                        <option key={lane.value} value={lane.value}>
                          {lane.label}
                        </option>
                      ))}
                    </select>
                    <div className="grid gap-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() =>
                            setActionDrafts((prev) => ({ ...prev, [activeRequest.id]: action }))
                          }
                          className={`rounded-xl px-4 py-2 text-right text-sm font-black ring-1 ring-[#d9c8ad] ${
                            actionDrafts[activeRequest.id] === action
                              ? "bg-[#1f6358] text-white"
                              : "bg-[#fffaf2] text-[#1c2d31]"
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={notes[activeRequest.id] || ""}
                      onChange={(event) =>
                        setNotes((prev) => ({ ...prev, [activeRequest.id]: event.target.value }))
                      }
                      placeholder="اكتب ملاحظة واضحة للمعلم أو للمراجعة الداخلية..."
                      className="min-h-44 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveRequest(activeRequest.id, "IN_REVIEW")}
                        disabled={savingId === activeRequest.id}
                        className="rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        حفظ للمتابعة
                      </button>
                      <button
                        type="button"
                        onClick={() => saveRequest(activeRequest.id, "RESOLVED")}
                        disabled={savingId === activeRequest.id}
                        className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                      >
                        تم الإجراء
                      </button>
                      <button
                        type="button"
                        onClick={() => saveRequest(activeRequest.id, "REJECTED")}
                        disabled={savingId === activeRequest.id}
                        className="rounded-2xl bg-[#fffaf2] px-5 py-3 text-sm font-black text-[#8a6335] ring-1 ring-[#d9c8ad] disabled:opacity-60"
                      >
                        إغلاق بلا إجراء
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            <section className="grid gap-3 md:grid-cols-4">
              {STATUS_LANES.map((lane) => (
                <div key={lane.value} className="rounded-[1.5rem] bg-white/88 p-4 ring-1 ring-[#d9c8ad]">
                  <p className="text-sm font-black text-[#1c2d31]">{lane.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#1c2d31]/55">{lane.hint}</p>
                  <p className="mt-3 text-3xl font-black text-[#173d42]">
                    {requestsByStatus[lane.value].length}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
