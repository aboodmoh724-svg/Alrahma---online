"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Teacher = { id: string; fullName: string };
type Circle = { id: string; name: string; track: string | null; teacher: Teacher | null };
type RequestItem = {
  id: string;
  studentName: string;
  parentWhatsapp: string;
  grade: string | null;
  previousStudy: string | null;
  memorizedAmount: string | null;
  tajweedLevel: string | null;
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdStudentId: string | null;
  createdAt: string;
};

export default function SyriaAdminRegistrationsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Record<string, string>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.status === "PENDING").length,
      accepted: requests.filter((request) => request.status === "ACCEPTED").length,
      rejected: requests.filter((request) => request.status === "REJECTED").length,
    }),
    [requests]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, teachersRes, circlesRes] = await Promise.all([
        fetch("/api/registration-requests?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
        fetch("/api/teachers?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
        fetch("/api/circles?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
      ]);
      const [requestsData, teachersData, circlesData] = await Promise.all([
        requestsRes.json(),
        teachersRes.json(),
        circlesRes.json(),
      ]);
      setRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
      setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
      setCircles(Array.isArray(circlesData.circles) ? circlesData.circles : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const importFile = async (file: File) => {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/syria/registration-requests/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "تعذر استيراد الملف");
        return;
      }

      const details = Array.isArray(data.skippedRows) && data.skippedRows.length > 0
        ? `\n\nأول الصفوف المتجاوزة:\n${data.skippedRows
            .map((row: { row: number; reason: string }) => `صف ${row.row}: ${row.reason}`)
            .join("\n")}`
        : "";
      alert(`تمت قراءة ${data.total} صف: أضيف ${data.created} طلب جديد، وتم تجاوز ${data.skipped} صف.${details}`);
      await fetchData();
    } finally {
      setImporting(false);
    }
  };

  const updateRequest = async (requestId: string, action: "ACCEPT" | "REJECT") => {
    const response = await fetch("/api/registration-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        action,
        circleId: selectedCircle[requestId] || "",
        teacherId: selectedTeacher[requestId] || "",
        financeAmount: "0",
        financeCurrency: "USD",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(data.error || "تعذر تحديث الطلب");
      return;
    }
    await fetchData();
  };

  const sendAcceptance = async (requestId: string) => {
    setSendingId(requestId);
    try {
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "SEND_ACCEPTANCE_MESSAGE" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "تعذر إرسال رسالة القبول");
        return;
      }
      alert("تم إرسال رسالة القبول");
    } finally {
      setSendingId("");
    }
  };

  const sendBulkAcceptance = async () => {
    const accepted = requests.filter((request) => request.status === "ACCEPTED" && request.createdStudentId);
    if (accepted.length === 0) {
      alert("لا يوجد طلاب مقبولون جاهزون للإرسال");
      return;
    }
    for (const request of accepted) {
      await sendAcceptance(request.id);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#8a661f]">إدارة سوريا</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">طلبات التسجيل</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              هنا تظهر طلبات التسجيل الجديدة، ثم يتم قبول الطالب وربطه بحلقة أو معلم وإرسال رسالة القبول.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={sendBulkAcceptance}
              className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white"
            >
              إرسال القبول للجميع
            </button>
            <Link href="/syria/admin/dashboard" className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-sm font-black text-[#1c2d31]">
              الرجوع
            </Link>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          <Stat title="إجمالي الطلبات" value={stats.total} />
          <Stat title="قيد المراجعة" value={stats.pending} />
          <Stat title="مقبول" value={stats.accepted} />
          <Stat title="مرفوض" value={stats.rejected} />
        </section>

        <section className="rounded-[2rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#d8bf83]">
          <p className="text-sm font-black text-[#1c2d31]">استيراد الطلاب غير المقروئين</p>
          <p className="mt-1 text-xs leading-6 text-[#1c2d31]/60">
            ارفع ملف ردود Google Form بصيغة CSV أو Excel. النظام يوحّد صيغة الأرقام، ويضيف غير الموجودين فقط، ويتجاوز المكرر أو الصفوف الناقصة.
          </p>
          <input
            type="file"
            accept=".csv,.xlsx"
            disabled={importing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importFile(file);
              event.currentTarget.value = "";
            }}
            className="mt-3 w-full rounded-2xl border border-dashed border-[#d8bf83] bg-[#fffaf4] px-4 py-4 text-sm"
          />
        </section>

        {loading ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل الطلبات...
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد طلبات تسجيل حاليا.
          </div>
        ) : (
          <section className="grid gap-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-[2rem] bg-white/90 p-5 shadow-sm ring-1 ring-[#d8bf83]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-[#1c2d31]">{request.studentName}</h2>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                      ولي الأمر: {request.parentWhatsapp} - {new Date(request.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <Info title="العمر/الصف/المدرسة" value={request.grade || "-"} />
                  <Info title="سبق الالتحاق" value={request.previousStudy || "-"} />
                  <Info title="المحفوظ" value={request.memorizedAmount || "-"} />
                  <Info title="مستوى التجويد" value={request.tajweedLevel || "-"} />
                </div>

                {request.notes ? (
                  <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#fffaf4] p-4 text-sm leading-7 text-[#1c2d31]/70">
                    {request.notes}
                  </pre>
                ) : null}

                {request.status === "PENDING" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-[#1c2d31]">الحلقة</span>
                      <select
                        value={selectedCircle[request.id] || ""}
                        onChange={(e) => setSelectedCircle((prev) => ({ ...prev, [request.id]: e.target.value }))}
                        className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm"
                      >
                        <option value="">اختر حلقة</option>
                        {circles.map((circle) => (
                          <option key={circle.id} value={circle.id}>{circle.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-[#1c2d31]">أو اختر معلما</span>
                      <select
                        value={selectedTeacher[request.id] || ""}
                        onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [request.id]: e.target.value }))}
                        className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm"
                      >
                        <option value="">اختر معلم</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => updateRequest(request.id, "ACCEPT")} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white">
                      قبول
                    </button>
                    <button type="button" onClick={() => updateRequest(request.id, "REJECT")} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700">
                      رفض
                    </button>
                  </div>
                ) : null}

                {request.status === "ACCEPTED" && request.createdStudentId ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-emerald-50 p-4 ring-1 ring-emerald-200">
                    <p className="text-sm font-black text-emerald-800">تم قبول الطالب وربطه بالنظام.</p>
                    <button
                      type="button"
                      onClick={() => sendAcceptance(request.id)}
                      disabled={sendingId === request.id}
                      className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                    >
                      {sendingId === request.id ? "جاري الإرسال..." : "إرسال رسالة القبول"}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#d8bf83]">
      <p className="text-xs font-black text-[#8a661f]">{title}</p>
      <p className="mt-2 text-3xl font-black text-[#1c2d31]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: RequestItem["status"] }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        status === "PENDING"
          ? "bg-amber-100 text-amber-800"
          : status === "ACCEPTED"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-red-100 text-red-700"
      }`}
    >
      {status === "PENDING" ? "قيد المراجعة" : status === "ACCEPTED" ? "مقبول" : "مرفوض"}
    </span>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf4] p-3 text-sm">
      <p className="font-black text-[#1c2d31]">{title}</p>
      <p className="mt-1 leading-6 text-[#1c2d31]/60">{value}</p>
    </div>
  );
}
