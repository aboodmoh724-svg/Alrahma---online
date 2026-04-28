"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RegistrationRequest = {
  id: string;
  studentName: string;
  parentWhatsapp: string;
  requestedTracks: string | null;
  readingLevel: string | null;
  tajweedLevel: string | null;
  memorizedAmount: string | null;
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdStudentId: string | null;
  forwardedToSupervisionAt: string | null;
  supervisionStatus: "PENDING" | "UNDER_REVIEW" | "PLACED" | "ON_HOLD";
  supervisionNote: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "PLACED", label: "تم التسكين" },
  { value: "ON_HOLD", label: "معلق" },
];

const STATUS_LABELS: Record<RegistrationRequest["supervisionStatus"], string> = {
  PENDING: "بانتظار الإشراف",
  UNDER_REVIEW: "قيد المراجعة",
  PLACED: "تم التسكين",
  ON_HOLD: "معلق",
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

export default function RemoteSupervisionRegistrationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, RegistrationRequest["supervisionStatus"]>>({});

  const forwardedRequests = useMemo(
    () =>
      requests.filter(
        (request) => request.status === "ACCEPTED" && request.forwardedToSupervisionAt
      ),
    [requests]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/registration-requests", { cache: "no-store" });
      const data = await response.json();
      const list = Array.isArray(data.requests) ? (data.requests as RegistrationRequest[]) : [];
      setRequests(list);
      setNotes(Object.fromEntries(list.map((request) => [request.id, request.supervisionNote || ""])));
      setStatuses(
        Object.fromEntries(
          list.map((request) => [request.id, request.supervisionStatus || "PENDING"])
        ) as Record<string, RegistrationRequest["supervisionStatus"]>
      );
    } catch (error) {
      console.error("FETCH SUPERVISION REGISTRATIONS ERROR =>", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveStatus = async (requestId: string) => {
    try {
      setSavingId(requestId);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "UPDATE_SUPERVISION_STATUS",
          supervisionStatus: statuses[requestId],
          supervisionNote: notes[requestId] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديث حالة الإشراف");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("UPDATE SUPERVISION REGISTRATION STATUS ERROR =>", error);
      alert("حدث خطأ أثناء تحديث حالة الإشراف");
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
            <h1 className="text-4xl font-black text-[#1c2d31]">الطلبات المحولة من الإدارة</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              هذه الحالات تم تجهيزها إداريًا وتحويلها لك للاختبار والتقييم والتسكين داخل الحلقة المناسبة.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل الحالات المحولة...
          </div>
        ) : forwardedRequests.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد طلبات محولة للإشراف حتى الآن.
          </div>
        ) : (
          <div className="space-y-4">
            {forwardedRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                    {STATUS_LABELS[request.supervisionStatus]}
                  </span>
                  <span className="rounded-full bg-[#f0e2c8] px-3 py-1 text-xs font-black text-[#8a6335]">
                    {request.requestedTracks || "لم يحدد المسار"}
                  </span>
                  <span className="text-xs font-bold text-[#1c2d31]/55">
                    {request.forwardedToSupervisionAt
                      ? `حوّل للإشراف: ${formatDate(request.forwardedToSupervisionAt)}`
                      : ""}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
                  <div>
                    <h2 className="text-2xl font-black text-[#1c2d31]">{request.studentName}</h2>
                    <div className="mt-2 grid gap-2 text-sm text-[#1c2d31]/70 md:grid-cols-2">
                      <p>ولي الأمر: {request.parentWhatsapp}</p>
                      <p>القراءة: {request.readingLevel || "-"}</p>
                      <p>التجويد: {request.tajweedLevel || "-"}</p>
                      <p>المحفوظ: {request.memorizedAmount || "-"}</p>
                    </div>
                    {request.notes ? (
                      <p className="mt-3 rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/70">
                        {request.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-[1.6rem] bg-[#fffaf2] p-4 ring-1 ring-[#e7dcc8]">
                    <select
                      value={statuses[request.id] || request.supervisionStatus}
                      onChange={(event) =>
                        setStatuses((prev) => ({
                          ...prev,
                          [request.id]: event.target.value as RegistrationRequest["supervisionStatus"],
                        }))
                      }
                      className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-bold text-[#1c2d31] outline-none"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={notes[request.id] || ""}
                      onChange={(event) =>
                        setNotes((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="ملاحظة الإشراف أو نتيجة الاختبار أو سبب التأجيل"
                      className="min-h-32 w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                    />

                    <div className="grid gap-2">
                      <button
                        type="button"
                        disabled={savingId === request.id}
                        onClick={() => saveStatus(request.id)}
                        className="rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                      >
                        {savingId === request.id ? "جارٍ الحفظ..." : "حفظ حالة الإشراف"}
                      </button>

                      {request.createdStudentId ? (
                        <Link
                          href="/remote/supervision/students"
                          className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-center text-sm font-black text-[#1c2d31]"
                        >
                          فتح إدارة الطلاب للتسكين والمتابعة
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
