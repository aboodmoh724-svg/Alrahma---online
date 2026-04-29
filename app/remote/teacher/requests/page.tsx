"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StudentOption = {
  id: string;
  fullName: string;
  studentCode: string | null;
};

type TeacherRequest = {
  id: string;
  type: "TEST_REQUEST" | "STRUGGLING_STUDENT" | "SPECIAL_CASE" | "GENERAL";
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  subject: string;
  details: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  student: StudentOption | null;
  reviewer: {
    id: string;
    fullName: string;
  } | null;
};

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_OPTIONS = [
  { value: "GENERAL", label: "طلب عام" },
  { value: "TEST_REQUEST", label: "طلب اختبار" },
  { value: "STRUGGLING_STUDENT", label: "طالب متعثر" },
  { value: "SPECIAL_CASE", label: "حالة خاصة" },
];

const PRIORITY_OPTIONS = [
  { value: "NORMAL", label: "عادي" },
  { value: "HIGH", label: "مهم" },
  { value: "URGENT", label: "عاجل" },
];

const STATUS_LABELS: Record<TeacherRequest["status"], string> = {
  NEW: "جديد",
  IN_REVIEW: "قيد المراجعة",
  RESOLVED: "مكتمل",
  REJECTED: "مرفوض",
};

function typeLabel(type: TeacherRequest["type"]) {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label || "طلب عام";
}

function priorityLabel(priority: TeacherRequest["priority"]) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority)?.label || "عادي";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RemoteTeacherRequestsPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [markingNotifications, setMarkingNotifications] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    type: "GENERAL",
    priority: "NORMAL",
    subject: "",
    details: "",
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, notificationsRes] = await Promise.all([
        fetch("/api/teacher-requests", { cache: "no-store" }),
        fetch("/api/teacher-notifications", { cache: "no-store" }),
      ]);

      const [requestsData, notificationsData] = await Promise.all([
        requestsRes.json(),
        notificationsRes.json(),
      ]);

      setStudents(Array.isArray(requestsData.students) ? requestsData.students : []);
      setRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
      setNotifications(
        Array.isArray(notificationsData.notifications) ? notificationsData.notifications : []
      );
    } catch (error) {
      console.error("FETCH TEACHER REQUESTS PAGE DATA ERROR =>", error);
      setStudents([]);
      setRequests([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await fetch("/api/teacher-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر رفع الطلب");
        return;
      }

      setFormData({
        studentId: "",
        type: "GENERAL",
        priority: "NORMAL",
        subject: "",
        details: "",
      });
      await fetchData();
      alert("تم رفع الطلب بنجاح");
    } catch (error) {
      console.error("CREATE TEACHER REQUEST ERROR =>", error);
      alert("حدث خطأ أثناء رفع الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      setMarkingNotifications(true);
      const response = await fetch("/api/teacher-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث الإشعارات");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("MARK TEACHER NOTIFICATIONS AS READ ERROR =>", error);
      alert("حدث خطأ أثناء تحديث الإشعارات");
    } finally {
      setMarkingNotifications(false);
    }
  };

  const openNotification = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await fetch("/api/teacher-notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: item.id }),
        });
      }

      if (item.link) {
        window.location.href = item.link;
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("OPEN TEACHER NOTIFICATION ERROR =>", error);
      await fetchData();
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f0e6] px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#173d42]">طلبات المعلم والإشعارات</h1>
            <p className="mt-1 text-sm text-[#1c2d31]/65">
              من هنا تستطيع رفع طلباتك للإشراف ومتابعة الردود أو إشعارات إضافة الطلاب.
            </p>
          </div>
          <Link
            href="/remote/teacher/dashboard"
            className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] hover:bg-[#fffaf2]"
          >
            الرجوع إلى لوحة المعلم
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#173d42]">رفع طلب جديد</h2>
                <p className="mt-1 text-sm text-[#1c2d31]/60">
                  اختر الطالب إذا كان الطلب متعلقًا به، ثم اكتب ما يحتاجه المشرف بوضوح.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={formData.studentId}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, studentId: event.target.value }))
                }
                className="w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 outline-none focus:border-[#1f6358]"
              >
                <option value="">الطلب غير مرتبط بطالب محدد</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                    {student.studentCode ? ` - ${student.studentCode}` : ""}
                  </option>
                ))}
              </select>

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={formData.type}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, type: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 outline-none focus:border-[#1f6358]"
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.priority}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, priority: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 outline-none focus:border-[#1f6358]"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={formData.subject}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="عنوان مختصر للطلب"
                className="w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 outline-none focus:border-[#1f6358]"
                required
              />

              <textarea
                value={formData.details}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, details: event.target.value }))
                }
                placeholder="اكتب التفاصيل التي يحتاجها الإشراف هنا"
                className="min-h-40 w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 outline-none focus:border-[#1f6358]"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
              >
                {submitting ? "جارٍ رفع الطلب..." : "رفع الطلب"}
              </button>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[#173d42]">إشعاراتي</h2>
                  <p className="mt-1 text-sm text-[#1c2d31]/60">
                    ستظهر هنا تنبيهات إضافة الطلاب أو تحديث طلباتك.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                      {unreadCount} جديد
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={markingNotifications || unreadCount === 0}
                    onClick={markAllNotificationsAsRead}
                    className="rounded-xl border border-[#d9c8ad] px-4 py-2 text-sm font-bold text-[#1c2d31] disabled:opacity-45"
                  >
                    تعليم الكل كمقروء
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                  جارٍ التحميل...
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                  لا توجد إشعارات حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openNotification(item)}
                      className={`rounded-2xl border p-4 ${
                        item.isRead
                          ? "border-[#e7dcc8] bg-[#fffaf2]"
                          : "border-[#c39a62] bg-[#fff3df]"
                      } w-full text-right transition hover:border-[#1f6358]`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-[#173d42]">{item.title}</p>
                        <span className="text-xs font-bold text-[#1c2d31]/55">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#1c2d31]/70">{item.body}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-[#173d42]">طلباتي السابقة</h2>
                <span className="text-sm font-bold text-[#1c2d31]/55">
                  {requests.length} طلب
                </span>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                  جارٍ التحميل...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
                  لم يتم رفع أي طلب حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#e7dcc8]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                          {STATUS_LABELS[request.status]}
                        </span>
                        <span className="rounded-full bg-[#f0e2c8] px-3 py-1 text-xs font-black text-[#8a6335]">
                          {typeLabel(request.type)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f6358] ring-1 ring-[#d9c8ad]">
                          {priorityLabel(request.priority)}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-black text-[#173d42]">{request.subject}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#1c2d31]/70">{request.details}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-[#1c2d31]/55">
                        <span>{formatDate(request.createdAt)}</span>
                        {request.student ? (
                          <span>
                            الطالب: {request.student.fullName}
                            {request.student.studentCode ? ` - ${request.student.studentCode}` : ""}
                          </span>
                        ) : null}
                        {request.reviewer ? <span>المتابع: {request.reviewer.fullName}</span> : null}
                      </div>
                      {request.adminNote ? (
                        <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-[#1c2d31] ring-1 ring-[#e7dcc8]">
                          <span className="font-black text-[#8a6335]">ملاحظة الإدارة:</span>{" "}
                          {request.adminNote}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
