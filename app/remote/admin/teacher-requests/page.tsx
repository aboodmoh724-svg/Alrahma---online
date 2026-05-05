"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TeacherRequest = {
  id: string;
  type: "TEST_REQUEST" | "STRUGGLING_STUDENT" | "SPECIAL_CASE" | "GENERAL";
  priority: "NORMAL" | "HIGH" | "URGENT";
  target: "SUPERVISION" | "ADMIN";
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

function renderDetails(details: string) {
  const linkPattern = /(https?:\/\/[^\s]+)/gi;
  return details.split(linkPattern).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-black text-[#1f6358] underline underline-offset-4"
        dir="ltr"
      >
        رابط الحلقة
      </a>
    );
  });
}

export default function RemoteAdminTeacherRequestsPage() {
  const pathname = usePathname();
  const dashboardHref = pathname.startsWith("/remote/supervision/")
    ? "/remote/supervision/dashboard"
    : "/remote/admin/dashboard";
  const requestTarget = pathname.startsWith("/remote/supervision/") ? "SUPERVISION" : "ADMIN";
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("NEW");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, TeacherRequest["status"]>>({});

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ target: requestTarget });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const suffix = `?${params.toString()}`;
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
  }, [requestTarget, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSave = async (
    requestId: string,
    options?: { note?: string; status?: TeacherRequest["status"]; transferToSupervision?: boolean }
  ) => {
    try {
      setSubmittingId(requestId);
      const finalStatus = options?.status || statusDrafts[requestId] || "RESOLVED";
      const response = await fetch("/api/teacher-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status: finalStatus,
          adminNote: options?.note ?? adminNotes[requestId] ?? "",
          transferToSupervision: Boolean(options?.transferToSupervision),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0637\u0644\u0628");
        return;
      }

      setRequests((prev) => prev.filter((request) => request.id !== requestId));
      alert(options?.transferToSupervision ? "\u062a\u0645 \u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 \u0627\u0644\u0625\u0634\u0631\u0627\u0641" : "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0625\u062c\u0631\u0627\u0621 \u0648\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0637\u0644\u0628");
    } catch (error) {
      console.error("UPDATE ADMIN TEACHER REQUEST ERROR =>", error);
      alert("\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0637\u0644\u0628");
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
                <div
                  key={request.id}
                  className={`rounded-[1.8rem] p-4 ring-1 ${
                    request.priority === "URGENT"
                      ? "bg-red-50 ring-red-200"
                      : "bg-[#fffaf2] ring-[#e7dcc8]"
                  }`}
                >
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

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#1c2d31]/72">
                    {renderDetails(request.details)}
                  </p>

                  {request.priority === "URGENT" ? (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-white p-4">
                      <p className="text-sm font-black text-red-800">إجراء سريع للطلب العاجل</p>
                      <p className="mt-1 text-xs leading-6 text-[#1c2d31]/60">
                        اكتب الإجراء المتخذ أو استخدم أحد الأزرار الجاهزة، وسيتم إغلاق الطلب وإخفاؤه من القائمة.
                      </p>
                      <textarea
                        value={adminNotes[request.id] || ""}
                        onChange={(event) =>
                          setAdminNotes((prev) => ({
                            ...prev,
                            [request.id]: event.target.value,
                          }))
                        }
                        placeholder="الإجراء المتخذ: تم دخول الحلقة، تم التواصل، أو أي ملاحظة مختصرة"
                        className="mt-3 min-h-20 w-full rounded-xl border border-red-100 bg-white px-4 py-3 text-sm outline-none focus:border-red-300"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={submittingId === request.id}
                          onClick={() => handleSave(request.id, { status: "RESOLVED", note: "تم الدخول إلى الحلقة ومتابعة الطلب." })}
                          className="rounded-xl bg-red-700 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                        >
                          تم الدخول إلى الحلقة
                        </button>
                        <button
                          type="button"
                          disabled={submittingId === request.id}
                          onClick={() => handleSave(request.id, { status: "RESOLVED", note: "تم التواصل واتخاذ الإجراء المناسب." })}
                          className="rounded-xl bg-[#173d42] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                        >
                          تم التواصل
                        </button>
                        <button
                          type="button"
                          disabled={submittingId === request.id}
                          onClick={() => handleSave(request.id, { status: "RESOLVED" })}
                          className="rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                        >
                          حفظ وإنهاء
                        </button>
                        {requestTarget === "ADMIN" ? (
                          <button
                            type="button"
                            disabled={submittingId === request.id}
                            onClick={() => handleSave(request.id, { status: "IN_REVIEW", transferToSupervision: true, note: adminNotes[request.id] || "محول من الإدارة إلى الإشراف للمتابعة." })}
                            className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-black text-[#173d42] disabled:opacity-60"
                          >
                            تحويل للإشراف
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className={`${request.priority === "URGENT" ? "hidden" : "mt-4 grid"} gap-4 lg:grid-cols-[220px_1fr_auto]`}>
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
