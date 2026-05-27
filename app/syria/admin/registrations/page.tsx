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
type EditState = {
  studentName: string;
  parentWhatsapp: string;
  age: string;
  grade: string;
  schoolName: string;
  previousStudy: string;
  previousStudent: string;
  memorizedAmount: string;
  tajweedLevel: string;
  goals: string;
  notes: string;
};

const inputClass = "w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm outline-none focus:border-[#0f5a35] focus:ring-4 focus:ring-[#0f5a35]/10";

function parseDetails(value: string | null) {
  const parts = String(value || "").split(" - ").map((part) => part.trim()).filter(Boolean);
  const grade = parts.find((part) => !part.startsWith("العمر:") && !part.startsWith("المدرسة:")) || "";
  const age = parts.find((part) => part.startsWith("العمر:"))?.replace("العمر:", "").trim() || "";
  const schoolName = parts.find((part) => part.startsWith("المدرسة:"))?.replace("المدرسة:", "").trim() || "";

  return { grade, age, schoolName };
}

function normalizeFilterText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueFilterOptions(values: string[]) {
  const options = new Map<string, string>();

  values.forEach((value) => {
    const label = value.replace(/\s+/g, " ").trim();
    const key = normalizeFilterText(label);

    if (label && key && !options.has(key)) {
      options.set(key, label);
    }
  });

  return Array.from(options.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((first, second) => first.label.localeCompare(second.label, "ar"));
}

function arabicDigitsToEnglish(value: string) {
  const eastern = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";

  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const easternIndex = eastern.indexOf(digit);
    if (easternIndex >= 0) return String(easternIndex);
    return String(persian.indexOf(digit));
  });
}

function ageNumber(value: string) {
  const number = Number(arabicDigitsToEnglish(value).match(/\d+/)?.[0] || "");

  return Number.isFinite(number) ? number : null;
}

function noteParts(notes: string | null) {
  const lines = String(notes || "").split("\n");
  const goalLine = lines.find((line) => line.startsWith("الأهداف:"));
  const rest = lines.filter((line) => !line.startsWith("الأهداف:")).join("\n").trim();

  return {
    goals: goalLine?.replace("الأهداف:", "").trim() || "",
    notes: rest,
  };
}

function editStateFromRequest(request: RequestItem): EditState {
  const details = parseDetails(request.grade);
  const notes = noteParts(request.notes);

  return {
    studentName: request.studentName,
    parentWhatsapp: request.parentWhatsapp,
    age: details.age,
    grade: details.grade,
    schoolName: details.schoolName,
    previousStudy: request.previousStudy || "",
    previousStudent: request.previousStudy === "نعم" ? "نعم" : "لا",
    memorizedAmount: request.memorizedAmount || "",
    tajweedLevel: request.tajweedLevel || "",
    goals: notes.goals,
    notes: notes.notes,
  };
}

function buildInitialAcceptanceMessage(request: RequestItem) {
  return [
    "السلام عليكم ورحمة الله وبركاته",
    `حياكم الله ولي أمر الطالب ${request.studentName}`,
    "",
    "نشكر لكم حرصكم واهتمامكم بتسجيل ابنكم في تحفيظ الرحمة للقرآن الكريم.",
    "نود إعلامكم بأنه تم قبول طلب تسجيل ابنكم قبولاً أولياً، وستبدأ الحلقات بإذن الله بتاريخ 2026/06/01.",
    "",
    "المكان: سوريا - حماة - طيبة الإمام - مسجد بدر.",
    "",
    "نسأل الله أن يبارك في أبنائنا وأن يجعلهم من أهل القرآن.",
    "",
    "إدارة تحفيظ الرحمة للقرآن الكريم - سوريا",
  ].join("\n");
}

export default function SyriaAdminRegistrationsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<Record<string, string>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [acceptanceDraft, setAcceptanceDraft] = useState<{ request: RequestItem; message: string } | null>(null);
  const [editingId, setEditingId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [ageFilter, setAgeFilter] = useState("ALL");
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((request) => request.status === "PENDING").length,
      accepted: requests.filter((request) => request.status === "ACCEPTED").length,
      rejected: requests.filter((request) => request.status === "REJECTED").length,
      registered: requests.filter((request) => Boolean(request.createdStudentId)).length,
    }),
    [requests]
  );
  const schoolOptions = useMemo(
    () => uniqueFilterOptions(requests.map((request) => parseDetails(request.grade).schoolName)),
    [requests]
  );
  const gradeOptions = useMemo(
    () => uniqueFilterOptions(requests.map((request) => parseDetails(request.grade).grade)),
    [requests]
  );
  const filteredRequests = useMemo(
    () => requests.filter((request) => {
      const details = parseDetails(request.grade);
      const age = ageNumber(details.age);
      const ageMatch =
        ageFilter === "ALL" ||
        (ageFilter === "UNDER_10" && age !== null && age < 10) ||
        (ageFilter === "10_TO_15" && age !== null && age >= 10 && age <= 15) ||
        (ageFilter === "OVER_15" && age !== null && age > 15) ||
        (ageFilter === "UNKNOWN" && age === null);

      return ageMatch &&
        (schoolFilter === "ALL" || normalizeFilterText(details.schoolName) === schoolFilter) &&
        (gradeFilter === "ALL" || normalizeFilterText(details.grade) === gradeFilter);
    }),
    [ageFilter, gradeFilter, requests, schoolFilter]
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

  const updateRequest = async (
    requestId: string,
    action: "ACCEPT" | "REJECT" | "ACCEPT_AND_FORWARD_TO_SUPERVISION" | "PLACE_BY_SUPERVISION"
  ) => {
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

  const openEdit = (request: RequestItem) => {
    setEditingId(request.id);
    setEditState(editStateFromRequest(request));
  };

  const saveEdit = async () => {
    if (!editingId || !editState) return;
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/registration-requests/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "تعذر حفظ التعديل");
        return;
      }
      setEditingId("");
      setEditState(null);
      await fetchData();
    } finally {
      setSavingEdit(false);
    }
  };

  const sendAcceptanceRequest = async (request: RequestItem, messageBody?: string) => {
    const action = request.createdStudentId ? "SEND_ACCEPTANCE_MESSAGE" : "SEND_ACCEPTANCE_NOTICE";
    setSendingId(request.id);
    try {
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id, action, messageBody }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "تعذر إرسال رسالة القبول");
        return;
      }
      alert("تم إرسال رسالة القبول");
      setAcceptanceDraft(null);
    } finally {
      setSendingId("");
    }
  };

  const sendAcceptance = async (request: RequestItem) => {
    setAcceptanceDraft({
      request,
      message: buildInitialAcceptanceMessage(request),
    });
  };

  const deleteRequest = async (request: RequestItem) => {
    if (!window.confirm(`هل تريد حذف طلب ${request.studentName}؟`)) return;

    setDeletingId(request.id);
    try {
      const response = await fetch(`/api/registration-requests/${request.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "تعذر حذف الطلب");
        return;
      }
      await fetchData();
    } finally {
      setDeletingId("");
    }
  };

  const sendBulkAcceptance = async () => {
    const accepted = requests.filter((request) => request.status === "ACCEPTED");
    if (accepted.length === 0) {
      alert("لا يوجد طلاب مقبولون جاهزون للإرسال");
      return;
    }
    for (const request of accepted) {
      await sendAcceptanceRequest(request, buildInitialAcceptanceMessage(request));
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
              راجع الطلبات، صفها حسب العمر أو المدرسة أو الصف، ثم وزع الطلاب على الحلقات المناسبة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={sendBulkAcceptance} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white">
              إرسال القبول للجميع
            </button>
            <Link href="/syria/admin/dashboard" className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-sm font-black text-[#1c2d31]">
              الرجوع
            </Link>
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-5">
          <Stat title="إجمالي الطلبات" value={stats.total} />
          <Stat title="الظاهر بعد الفلتر" value={filteredRequests.length} />
          <Stat title="قيد المراجعة" value={stats.pending} />
          <Stat title="الطلبات المقبولة" value={stats.accepted} />
          <Stat title="مسجل كطالب" value={stats.registered} />
        </section>

        <section className="grid gap-3 rounded-[2rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#d8bf83] md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#1c2d31]">فلتر العمر</span>
            <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)} className={inputClass}>
              <option value="ALL">كل الأعمار</option>
              <option value="UNDER_10">أقل من 10 سنوات</option>
              <option value="10_TO_15">من 10 إلى 15 سنة</option>
              <option value="OVER_15">أكبر من 15 سنة</option>
              <option value="UNKNOWN">العمر غير واضح</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#1c2d31]">المدرسة</span>
            <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)} className={inputClass}>
              <option value="ALL">كل المدارس</option>
              {schoolOptions.map((school) => <option key={school.key} value={school.key}>{school.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#1c2d31]">الصف الدراسي</span>
            <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} className={inputClass}>
              <option value="ALL">كل الصفوف</option>
              {gradeOptions.map((grade) => <option key={grade.key} value={grade.key}>{grade.label}</option>)}
            </select>
          </label>
        </section>

        <section className="rounded-[2rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#d8bf83]">
          <p className="text-sm font-black text-[#1c2d31]">استيراد الطلاب غير المقروئين</p>
          <p className="mt-1 text-xs leading-6 text-[#1c2d31]/60">
            ارفع ملف ردود Google Form. النظام يوحّد صيغة الأرقام ويضيف غير الموجودين فقط.
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
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">جاري تحميل الطلبات...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">لا توجد طلبات مطابقة للفلاتر الحالية.</div>
        ) : (
          <section className="grid gap-4">
            {filteredRequests.map((request) => {
              const details = parseDetails(request.grade);
              const isEditing = editingId === request.id && editState;

              return (
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
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(request)} className="rounded-2xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2 text-sm font-black text-[#1c2d31]">
                        تعديل البيانات
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRequest(request)}
                        disabled={deletingId === request.id}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:opacity-60"
                      >
                        {deletingId === request.id ? "جاري الحذف..." : "حذف الطلب"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Info title="العمر" value={details.age || "-"} />
                    <Info title="الصف" value={details.grade || "-"} />
                    <Info title="المدرسة" value={details.schoolName || "-"} />
                    <Info title="مستوى التجويد" value={request.tajweedLevel || "-"} />
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <Info title="سبق الالتحاق" value={request.previousStudy || "-"} />
                    <Info title="المحفوظ" value={request.memorizedAmount || "-"} />
                    <Info title="ملاحظات" value={request.notes || "-"} />
                  </div>

                  {isEditing ? (
                    <section className="mt-4 rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-[#d8bf83]">
                      <div className="grid gap-3 md:grid-cols-3">
                        <EditInput label="اسم الطالب" value={editState.studentName} onChange={(value) => setEditState({ ...editState, studentName: value })} />
                        <EditInput label="رقم ولي الأمر" value={editState.parentWhatsapp} onChange={(value) => setEditState({ ...editState, parentWhatsapp: value })} />
                        <EditInput label="العمر" value={editState.age} onChange={(value) => setEditState({ ...editState, age: value })} />
                        <EditInput label="الصف الدراسي" value={editState.grade} onChange={(value) => setEditState({ ...editState, grade: value })} />
                        <EditInput label="اسم المدرسة" value={editState.schoolName} onChange={(value) => setEditState({ ...editState, schoolName: value })} />
                        <label className="block">
                          <span className="mb-2 block text-sm font-black text-[#1c2d31]">سبق الالتحاق</span>
                          <select value={editState.previousStudent} onChange={(event) => setEditState({ ...editState, previousStudent: event.target.value, previousStudy: event.target.value })} className={inputClass}>
                            <option>لا</option>
                            <option>نعم</option>
                          </select>
                        </label>
                        <EditInput label="المحفوظ" value={editState.memorizedAmount} onChange={(value) => setEditState({ ...editState, memorizedAmount: value })} />
                        <EditInput label="مستوى التجويد" value={editState.tajweedLevel} onChange={(value) => setEditState({ ...editState, tajweedLevel: value })} />
                        <EditInput label="الأهداف" value={editState.goals} onChange={(value) => setEditState({ ...editState, goals: value })} />
                        <label className="block md:col-span-3">
                          <span className="mb-2 block text-sm font-black text-[#1c2d31]">ملاحظات</span>
                          <textarea value={editState.notes} onChange={(event) => setEditState({ ...editState, notes: event.target.value })} className={inputClass} rows={3} />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={saveEdit} disabled={savingEdit} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                          {savingEdit ? "جاري الحفظ..." : "حفظ التعديل"}
                        </button>
                        <button type="button" onClick={() => { setEditingId(""); setEditState(null); }} className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-sm font-black text-[#1c2d31]">
                          إلغاء
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {request.status === "PENDING" ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
                      <label className="block">
                        <span className="mb-2 block text-sm font-black text-[#1c2d31]">الحلقة</span>
                        <select value={selectedCircle[request.id] || ""} onChange={(e) => setSelectedCircle((prev) => ({ ...prev, [request.id]: e.target.value }))} className={inputClass}>
                          <option value="">اختر حلقة</option>
                          {circles.map((circle) => <option key={circle.id} value={circle.id}>{circle.name}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-black text-[#1c2d31]">أو اختر معلما</span>
                        <select value={selectedTeacher[request.id] || ""} onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [request.id]: e.target.value }))} className={inputClass}>
                          <option value="">اختر معلم</option>
                          {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                        </select>
                      </label>
                      <button type="button" onClick={() => updateRequest(request.id, "ACCEPT")} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white">قبول وتوزيع</button>
                      <button type="button" onClick={() => updateRequest(request.id, "ACCEPT_AND_FORWARD_TO_SUPERVISION")} className="rounded-2xl bg-[#c99b2e] px-5 py-3 text-sm font-black text-white">قبول فقط</button>
                      <button type="button" onClick={() => updateRequest(request.id, "REJECT")} className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700">رفض</button>
                    </div>
                  ) : null}

                  {request.status === "ACCEPTED" && request.createdStudentId ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-emerald-50 p-4 ring-1 ring-emerald-200">
                      <p className="text-sm font-black text-emerald-800">تم قبول الطالب وربطه بالنظام.</p>
                      <button type="button" onClick={() => sendAcceptance(request)} disabled={sendingId === request.id} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                        {sendingId === request.id ? "جاري الإرسال..." : "إرسال رسالة القبول"}
                      </button>
                    </div>
                  ) : null}

                  {request.status === "ACCEPTED" && !request.createdStudentId ? (
                    <div className="mt-4 rounded-[1.5rem] bg-amber-50 p-4 ring-1 ring-amber-200">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-black text-amber-900">الطالب مقبول بانتظار التوزيع على حلقة.</p>
                          <p className="mt-1 text-xs leading-6 text-amber-900/70">يمكن إرسال رسالة قبول أولية الآن، ثم توزيع الطالب لاحقا عند توفر الحلقة أو المعلم.</p>
                        </div>
                        <button type="button" onClick={() => sendAcceptance(request)} disabled={sendingId === request.id} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                          {sendingId === request.id ? "جاري الإرسال..." : "إرسال قبول أولي"}
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                        <label className="block">
                          <span className="mb-2 block text-sm font-black text-[#1c2d31]">الحلقة</span>
                          <select value={selectedCircle[request.id] || ""} onChange={(e) => setSelectedCircle((prev) => ({ ...prev, [request.id]: e.target.value }))} className={inputClass}>
                            <option value="">اختر حلقة</option>
                            {circles.map((circle) => <option key={circle.id} value={circle.id}>{circle.name}</option>)}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-black text-[#1c2d31]">أو اختر معلما</span>
                          <select value={selectedTeacher[request.id] || ""} onChange={(e) => setSelectedTeacher((prev) => ({ ...prev, [request.id]: e.target.value }))} className={inputClass}>
                            <option value="">اختر معلم</option>
                            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>)}
                          </select>
                        </label>
                        <button type="button" onClick={() => updateRequest(request.id, "PLACE_BY_SUPERVISION")} className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white">توزيع الطالب</button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
      {acceptanceDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <section className="w-full max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-[#d8bf83]" dir="rtl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#8a661f]">رسالة القبول الأولي</p>
                <h2 className="mt-1 text-2xl font-black text-[#1c2d31]">{acceptanceDraft.request.studentName}</h2>
              </div>
              <button type="button" onClick={() => setAcceptanceDraft(null)} className="rounded-full border border-[#d8bf83] px-3 py-1 text-sm font-black text-[#1c2d31]">
                إغلاق
              </button>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#1c2d31]/65">
              راجع نص الرسالة وعدله عند الحاجة، ثم اضغط إرسال.
            </p>
            <textarea
              value={acceptanceDraft.message}
              onChange={(event) => setAcceptanceDraft({ ...acceptanceDraft, message: event.target.value })}
              className="mt-4 min-h-72 w-full rounded-2xl border border-[#d8bf83] bg-[#fffaf4] p-4 text-sm leading-7 outline-none focus:border-[#0f5a35] focus:ring-4 focus:ring-[#0f5a35]/10"
            />
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setAcceptanceDraft(null)} className="rounded-2xl border border-[#d8bf83] bg-white px-5 py-3 text-sm font-black text-[#1c2d31]">
                إلغاء
              </button>
              <button
                type="button"
                disabled={sendingId === acceptanceDraft.request.id || !acceptanceDraft.message.trim()}
                onClick={() => sendAcceptanceRequest(acceptanceDraft.request, acceptanceDraft.message)}
                className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {sendingId === acceptanceDraft.request.id ? "جاري الإرسال..." : "إرسال الرسالة"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#d8bf83]">
      <p className="text-sm font-black text-[#5f4314]">{title}</p>
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
      {status === "PENDING" ? "قيد المراجعة" : status === "ACCEPTED" ? "طالب مقبول" : "مرفوض"}
    </span>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fffaf4] p-3 text-sm">
      <p className="font-black text-[#1c2d31]">{title}</p>
      <p className="mt-1 whitespace-pre-wrap leading-6 text-[#1c2d31]/60">{value}</p>
    </div>
  );
}

function EditInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#1c2d31]">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}
