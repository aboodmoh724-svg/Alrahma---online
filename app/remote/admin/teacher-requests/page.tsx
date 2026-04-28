"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TeacherRequest = {
  id: string;
  type: "TEST_REQUEST" | "STRUGGLING_STUDENT" | "SPECIAL_CASE" | "GENERAL";
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: "NEW" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  subject: string;
  details: string;
  adminNote: string | null;
  createdAt: string;
  teacher: {
    id: string;
    fullName: string;
  };
  student: {
    id: string;
    fullName: string;
    studentCode: string | null;
  } | null;
  reviewer: {
    id: string;
    fullName: string;
  } | null;
};

const STATUS_OPTIONS = [
  { value: "NEW", label: "جديد" },
  { value: "IN_REVIEW", label: "قيد المراجعة" },
  { value: "RESOLVED", label: "مكتمل" },
  { value: "REJECTED", label: "مرفوض" },
];

const STATUS_LABELS: Record<TeacherRequest["status"], string> = {
  NEW: "جديد",
  IN_REVIEW: "قيد المراجعة",
  RESOLVED: "مكتمل",
  REJECTED: "مرفوض",
};

const TYPE_LABELS: Record<TeacherRequest["type"], string> = {
  GENERAL: "طلب عام",
  TEST_REQUEST: "طلب اختبار",
  STRUGGLING_STUDENT: "طالب متعثر",
  SPECIAL_CASE: "حالة خاصة",
};

const PRIORITY_LABELS: Record<TeacherRequest["priority"], string> = {
  NORMAL: "عادي",
  HIGH: "مهم",
  URGENT: "عاجل",
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RemoteAdminTeacherRequestsPage() {
  const pathname = usePathname();
  const dashboardHref = pathname.startsWith("/remote/supervision/")
    ? "/remote/supervision/dashboard"
    : "/remote/admin/dashboard";
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, TeacherRequest["status"]>>({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const suffix = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const response = await fetch(`/api/teacher-requests${suffix}`, { cache: "no-store" });
      const data = await response.json();

      const list = Array.isArray(data.requests) ? (data.requests as TeacherRequest[]) : [];
      setRequests(list);
      setAdminNotes(
        Object.fromEntries(list.map((request) => [request.id, request.adminNote || ""]))
      );
      setStatusDrafts(
        Object.fromEntries(list.map((request) => [request.id, request.status]))
      );
    } catch (error) {
      console.error("FETCH ADMIN TEACHER REQUESTS ERROR =>", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleSave = async (requestId: string) => {
    try {
      setSubmittingId(requestId);
      const response = await fetch("/api/teacher-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status: statusDrafts[requestId],
          adminNote: adminNotes[requestId] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث الطلب");
        return;
      }

      await fetchRequests();
      alert("تم تحديث الطلب");
    } catch (error) {
      console.error("UPDATE ADMIN TEACHER REQUEST ERROR =>", error);
      alert("حدث خطأ أثناء تحديث الطلب");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f0e6] px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#173d42]">طلبات المعلمين</h1>
            <p className="mt-1 text-sm text-[#1c2d31]/65">
              هذه هي النواة الأولى للمتابعة الإشرافية حتى ترى طلبات المعلمين وترد عليها.
            </p>
          </div>
          <Link
            href={dashboardHref}
            className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-2 text-sm font-bold text-[#1c2d31] hover:bg-[#fffaf2]"
          >
            الرجوع إلى لوحة الإدارة
          </Link>
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#173d42]">متابعة الطلبات</h2>
              <p className="mt-1 text-sm text-[#1c2d31]/60">
                عدّل الحالة، اكتب ملاحظة، وسيصل إشعار مباشر للمعلم.
              </p>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#1c2d31] outline-none"
            >
              <option value="ALL">كل الحالات</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
              جارٍ التحميل...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-6 text-center text-sm text-[#1c2d31]/55">
              لا توجد طلبات مطابقة حاليًا.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="rounded-[1.8rem] bg-[#fffaf2] p-4 ring-1 ring-[#e7dcc8]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                      {STATUS_LABELS[request.status]}
                    </span>
                    <span className="rounded-full bg-[#f0e2c8] px-3 py-1 text-xs font-black text-[#8a6335]">
                      {TYPE_LABELS[request.type]}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f6358] ring-1 ring-[#d9c8ad]">
                      {PRIORITY_LABELS[request.priority]}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-1">
                    <h3 className="text-lg font-black text-[#173d42]">{request.subject}</h3>
                    <p className="text-sm font-bold text-[#1c2d31]/60">
                      المعلم: {request.teacher.fullName}
                    </p>
                    {request.student ? (
                      <p className="text-sm font-bold text-[#1c2d31]/60">
                        الطالب: {request.student.fullName}
                        {request.student.studentCode ? ` - ${request.student.studentCode}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#1c2d31]/72">{request.details}</p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr_auto]">
                    <select
                      value={statusDrafts[request.id] || request.status}
                      onChange={(event) =>
                        setStatusDrafts((prev) => ({
                          ...prev,
                          [request.id]: event.target.value as TeacherRequest["status"],
                        }))
                      }
                      className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-bold text-[#1c2d31] outline-none"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={adminNotes[request.id] || ""}
                      onChange={(event) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="اكتب ملاحظة للإشراف أو توجيهًا للمعلم"
                      className="min-h-28 rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
                    />

                    <button
                      type="button"
                      disabled={submittingId === request.id}
                      onClick={() => handleSave(request.id)}
                      className="rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                    >
                      {submittingId === request.id ? "جارٍ الحفظ..." : "حفظ"}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-[#1c2d31]/55">
                    <span>{formatDate(request.createdAt)}</span>
                    {request.reviewer ? <span>آخر متابعة: {request.reviewer.fullName}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
