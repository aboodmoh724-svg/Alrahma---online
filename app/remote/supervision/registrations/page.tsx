"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  periodLabel: string | null;
  startsAt: string | null;
  endsAt: string | null;
  teacher: Teacher | null;
};

type RegistrationRequest = {
  id: string;
  studentName: string;
  previousStudent: boolean;
  birthDate: string | null;
  grade: string | null;
  gender: string | null;
  nationality: string | null;
  country: string | null;
  fatherAlive: boolean | null;
  motherAlive: boolean | null;
  livingWith: string | null;
  fatherEducation: string | null;
  motherEducation: string | null;
  idImageUrl: string | null;
  preferredPeriod: string | null;
  parentWhatsapp: string;
  parentEmail: string | null;
  previousStudy: string | null;
  memorizedAmount: string | null;
  readingLevel: string | null;
  tajweedLevel: string | null;
  hasLearningIssues: boolean;
  learningIssuesNote: string | null;
  hasDevice: boolean;
  requestedTracks: string | null;
  readGuidelines: boolean;
  audioUrl: string | null;
  notes: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdStudentId: string | null;
  forwardedToSupervisionAt: string | null;
  supervisionStatus: "PENDING" | "UNDER_REVIEW" | "PLACED" | "ON_HOLD";
  supervisionNote: string | null;
  createdAt: string;
  interviewDate?: string | null;
  interviewLink?: string | null;
  interviewResult?: string | null;
  interviewLevel?: string | null;
  interviewDecision?: string | null;
};

type IncomingMessage = {
  id: string;
  fromNumber: string;
  body: string;
  category: "GENERAL" | "INTERVIEW_RESCHEDULE" | "ABSENCE_EXCUSE";
  isRead: boolean;
  createdAt: string;
  registrationRequestId: string | null;
  studentId: string | null;
};

const STATUS_OPTIONS = [
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "PLACED", label: "تم وضع الطالب في حلقة" },
  { value: "ON_HOLD", label: "معلق" },
] as const;

const STATUS_LABELS: Record<RegistrationRequest["supervisionStatus"], string> = {
  PENDING: "بانتظار الإشراف",
  UNDER_REVIEW: "قيد المراجعة",
  PLACED: "تم وضع الطالب في حلقة",
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

function yesNo(value: boolean | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value ? "نعم" : "لا";
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm">
      <p className="font-black text-[#1c2d31]">{label}</p>
      <p className="mt-1 leading-6 text-[#1c2d31]/65">{value || "-"}</p>
    </div>
  );
}

export default function RemoteSupervisionRegistrationsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingInterviewResultId, setSavingInterviewResultId] = useState<string | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [interviewResults, setInterviewResults] = useState<Record<string, string>>({});
  const [interviewLevels, setInterviewLevels] = useState<Record<string, string>>({});
  const [interviewDecisions, setInterviewDecisions] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, RegistrationRequest["supervisionStatus"]>>({});
  const [selectedCircle, setSelectedCircle] = useState<Record<string, string>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, string>>({});
  const [sendingAcceptanceId, setSendingAcceptanceId] = useState<string | null>(null);
  const [sendingDetailsId, setSendingDetailsId] = useState<string | null>(null);
  const [sendingParentGuideId, setSendingParentGuideId] = useState<string | null>(null);
  const [sendingTeacherGuideId, setSendingTeacherGuideId] = useState<string | null>(null);

  // Interview Modal State
  const [interviewModalOpen, setInterviewModalOpen] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewZoomUrl, setInterviewZoomUrl] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const forwardedRequests = useMemo(
    () => requests.filter((request) => request.status === "ACCEPTED" && request.forwardedToSupervisionAt),
    [requests]
  );
  const activeRequests = useMemo(
    () =>
      forwardedRequests.filter(
        (request) => request.supervisionStatus !== "PLACED" && !request.createdStudentId
      ),
    [forwardedRequests]
  );
  const selectedInterviewRequest = useMemo(
    () => forwardedRequests.find((request) => request.id === interviewModalOpen) || null,
    [forwardedRequests, interviewModalOpen]
  );
  const incomingByRequestId = useMemo(() => {
    return incomingMessages.reduce<Record<string, IncomingMessage[]>>((acc, message) => {
      if (!message.registrationRequestId || message.isRead) return acc;
      acc[message.registrationRequestId] = [...(acc[message.registrationRequestId] || []), message];
      return acc;
    }, {});
  }, [incomingMessages]);

  const buildInterviewMessage = (
    request: RegistrationRequest,
    nextDate = interviewDate,
    nextTime = interviewTime,
    nextZoomUrl = interviewZoomUrl
  ) => {
    return [
      "السلام عليكم ورحمة الله وبركاته",
      "",
      "أهلاً بكم في منصة الرحمة لتعليم القرآن الكريم.",
      `تم تحديد موعد المقابلة الأولى لتحديد مستوى الطالب/ة: *${request.studentName}*`,
      "",
      `*التاريخ:* ${nextDate || "-"}`,
      `*الوقت:* ${nextTime || "-"} بتوقيت مكة المكرمة`,
      nextZoomUrl ? `*رابط المقابلة:* ${nextZoomUrl}` : "",
      "",
      "نرجو الدخول في الموعد المحدد، وإذا كان الموعد غير مناسب لكم فنرجو الرد على هذه الرسالة عبر الواتساب.",
      "",
      "إدارة منصة الرحمة لتعليم القرآن الكريم",
    ]
      .filter((line, index, lines) => line || lines[index - 1])
      .join("\n");
  };

  const openInterviewModal = (request: RegistrationRequest) => {
    const currentDate = request.interviewDate ? request.interviewDate.slice(0, 10) : "";
    const currentTime = request.interviewDate ? request.interviewDate.slice(11, 16) : "";
    const currentLink = request.interviewLink || "";

    setInterviewDate(currentDate);
    setInterviewTime(currentTime);
    setInterviewZoomUrl(currentLink);
    setInterviewMessage(buildInterviewMessage(request, currentDate, currentTime, currentLink));
    setInterviewModalOpen(request.id);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsResponse, teachersResponse, circlesResponse, incomingResponse] = await Promise.all([
        fetch("/api/registration-requests", { cache: "no-store" }),
        fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/circles?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/whatsapp/incoming?channel=REMOTE&unreadOnly=true&limit=120", { cache: "no-store" }),
      ]);
      const [requestsData, teachersData, circlesData, incomingData] = await Promise.all([
        requestsResponse.json(),
        teachersResponse.json(),
        circlesResponse.json(),
        incomingResponse.json(),
      ]);
      const list = Array.isArray(requestsData.requests) ? (requestsData.requests as RegistrationRequest[]) : [];

      setRequests(list);
      setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
      setCircles(Array.isArray(circlesData.circles) ? circlesData.circles : []);
      setIncomingMessages(Array.isArray(incomingData.messages) ? incomingData.messages : []);
      setNotes(Object.fromEntries(list.map((request) => [request.id, request.supervisionNote || ""])));
      setInterviewResults(Object.fromEntries(list.map((request) => [request.id, request.interviewResult || ""])));
      setInterviewLevels(Object.fromEntries(list.map((request) => [request.id, request.interviewLevel || ""])));
      setInterviewDecisions(Object.fromEntries(list.map((request) => [request.id, request.interviewDecision || ""])));
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

  const markIncomingAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      const response = await fetch("/api/whatsapp/incoming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) return;

      setIncomingMessages((prev) => prev.filter((message) => !ids.includes(message.id)));
    } catch (error) {
      console.error("MARK INCOMING MESSAGE READ ERROR =>", error);
    }
  };

  const saveInterviewResult = async (requestId: string) => {
    try {
      setSavingInterviewResultId(requestId);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "UPDATE_INTERVIEW_RESULT",
          interviewLevel: interviewLevels[requestId] || "",
          interviewDecision: interviewDecisions[requestId] || "",
          interviewResult: interviewResults[requestId] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر حفظ نتيجة المقابلة");
        return;
      }

      alert("تم حفظ نتيجة المقابلة");
      await fetchData();
    } catch (error) {
      console.error("SAVE INTERVIEW RESULT ERROR =>", error);
      alert("حدث خطأ أثناء حفظ نتيجة المقابلة");
    } finally {
      setSavingInterviewResultId(null);
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

  const placeRequest = async (request: RegistrationRequest) => {
    try {
      setPlacingId(request.id);
      const circle = circles.find((item) => item.id === selectedCircle[request.id]);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          action: "PLACE_BY_SUPERVISION",
          circleId: selectedCircle[request.id] || "",
          teacherId: selectedTeacher[request.id] || "",
          financeCurrency: "USD",
          supervisionNote: notes[request.id] || request.supervisionNote || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر وضع الطالب في الحلقة");
        return;
      }

      alert("تم وضع الطالب في الحلقة وإنشاؤه في النظام بنجاح");
      await fetchData();
    } catch (error) {
      console.error("PLACE SUPERVISION REGISTRATION ERROR =>", error);
      alert("حدث خطأ أثناء وضع الطالب في الحلقة");
    } finally {
      setPlacingId(null);
    }
  };

  const sendSupervisorMessage = async (
    requestId: string,
    action:
      | "SEND_SUPERVISION_ACCEPTANCE_MESSAGE"
      | "SEND_SUPERVISION_CIRCLE_DETAILS_MESSAGE"
      | "SEND_PARENT_EDUCATION_CHAT_GUIDE"
      | "SEND_TEACHER_EDUCATION_CHAT_GUIDE"
  ) => {
    const setSending =
      action === "SEND_SUPERVISION_ACCEPTANCE_MESSAGE"
        ? setSendingAcceptanceId
        : action === "SEND_SUPERVISION_CIRCLE_DETAILS_MESSAGE"
          ? setSendingDetailsId
          : action === "SEND_PARENT_EDUCATION_CHAT_GUIDE"
            ? setSendingParentGuideId
            : setSendingTeacherGuideId;

    try {
      setSending(requestId);
      const response = await fetch("/api/registration-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال الرسالة");
        return;
      }

      alert("تم إرسال الرسالة بنجاح");
    } catch (error) {
      alert("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(null);
    }
  };

  const scheduleInterview = async (requestId: string) => {
    try {
      setSchedulingId(requestId);
      const response = await fetch(`/api/supervision/registrations/${requestId}/interview`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewDate,
          interviewTime,
          zoomUrl: interviewZoomUrl,
          message: interviewMessage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تحديد الموعد");
        return;
      }

      alert(data.message || "تم تحديد الموعد بنجاح");
      setInterviewModalOpen(null);
      setInterviewDate("");
      setInterviewTime("");
      setInterviewZoomUrl("");
      setInterviewMessage("");
      await fetchData();
    } catch (error) {
      console.error("SCHEDULE INTERVIEW ERROR =>", error);
      alert("حدث خطأ أثناء تحديد الموعد");
    } finally {
      setSchedulingId(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">طلبات التسجيل المحولة</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              راجع بيانات الطالب كما سجلها ولي الأمر، ثم اختر الحلقة أو المعلم المناسب لوضعه في الحلقة.
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
        ) : activeRequests.length === 0 ? (
          <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد طلبات تنتظر قرار الإشراف حاليًا.
          </div>
        ) : (
          <div className="space-y-4">
            {activeRequests.map((request) => {
              const requestIncoming = incomingByRequestId[request.id] || [];

              return (
                <div key={request.id} className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
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

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black text-[#1c2d31]">{request.studentName}</h2>
                          {requestIncoming.length > 0 ? (
                            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                              رد جديد من ولي الأمر
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
                          ولي الأمر: {request.parentWhatsapp} - البريد: {request.parentEmail || "-"}
                        </p>
                      </div>

                      {requestIncoming.length > 0 ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-red-800">رسائل واتساب واردة تحتاج متابعة</p>
                            <button
                              type="button"
                              onClick={() => markIncomingAsRead(requestIncoming.map((message) => message.id))}
                              className="rounded-xl bg-white px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-200"
                            >
                              تم الاطلاع
                            </button>
                          </div>
                          <div className="mt-3 space-y-2">
                            {requestIncoming.slice(0, 3).map((message) => (
                              <div key={message.id} className="rounded-xl bg-white p-3 text-sm leading-6 text-[#1c2d31]">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-black text-red-700">
                                    {message.category === "INTERVIEW_RESCHEDULE"
                                      ? "الموعد غير مناسب"
                                      : message.category === "ABSENCE_EXCUSE"
                                        ? "عذر غياب"
                                        : "رسالة عامة"}
                                  </span>
                                  <span className="text-xs font-bold text-[#1c2d31]/45">
                                    {formatDate(message.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-2">{message.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-4">
                        <InfoItem label="الميلاد/الصف" value={`${request.birthDate ? new Date(request.birthDate).toLocaleDateString("ar-EG") : "-"} / ${request.grade || "-"}`} />
                        <InfoItem label="الجنسية/الإقامة" value={`${request.nationality || "-"} / ${request.country || "-"}`} />
                        <InfoItem label="يسكن مع" value={request.livingWith} />
                        <InfoItem label="الفترة المفضلة" value={request.preferredPeriod} />
                        <InfoItem label="الدراسة السابقة" value={request.previousStudy} />
                        <InfoItem label="المحفوظ السابق" value={request.memorizedAmount} />
                        <InfoItem label="مستوى القراءة" value={request.readingLevel} />
                        <InfoItem label="مستوى التجويد" value={request.tajweedLevel} />
                        <InfoItem label="حياة الوالدين" value={`الأب: ${yesNo(request.fatherAlive)} - الأم: ${yesNo(request.motherAlive)}`} />
                        <InfoItem label="تعليم الوالدين" value={`${request.fatherEducation || "-"} / ${request.motherEducation || "-"}`} />
                        <InfoItem label="مشكلات تعلم" value={request.hasLearningIssues ? request.learningIssuesNote || "نعم" : "لا"} />
                        <InfoItem label="توفر الجهاز" value={request.hasDevice ? "متوفر" : "غير مؤكد"} />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/70">
                          <p className="font-black text-[#1c2d31]">ملاحظات التسجيل</p>
                          <p className="mt-1">{request.notes || "-"}</p>
                        </div>
                        <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/70">
                          <p className="font-black text-[#1c2d31]">نسخة التحويل من الإدارة</p>
                          <pre className="mt-1 whitespace-pre-wrap font-sans text-xs leading-6">
                            {request.supervisionNote || "-"}
                          </pre>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {request.audioUrl ? (
                          <a
                            href={request.audioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                          >
                            فتح التسجيل الصوتي
                          </a>
                        ) : null}
                        {request.idImageUrl ? (
                          <a
                            href={request.idImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-[#173d42] bg-white px-4 py-2 text-sm font-black text-[#173d42]"
                          >
                            فتح ملف الهوية
                          </a>
                        ) : null}
                      </div>

                      {request.interviewDate ? (
                        <div className="rounded-2xl border border-[#d9c8ad] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-lg font-black text-[#1c2d31]">نتيجة المقابلة وتحديد المستوى</p>
                              <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                                موعد المقابلة: {formatDate(request.interviewDate)}
                              </p>
                            </div>
                            {request.interviewLink ? (
                              <a
                                href={request.interviewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white"
                              >
                                فتح رابط المقابلة
                              </a>
                            ) : null}
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <input
                              value={interviewLevels[request.id] || ""}
                              onChange={(event) =>
                                setInterviewLevels((prev) => ({ ...prev, [request.id]: event.target.value }))
                              }
                              placeholder="مستوى الطالب: جيد، متوسط، يحتاج تأسيس..."
                              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                            />
                            <input
                              value={interviewDecisions[request.id] || ""}
                              onChange={(event) =>
                                setInterviewDecisions((prev) => ({ ...prev, [request.id]: event.target.value }))
                              }
                              placeholder="قرار المقابلة: مناسب للمسار كذا..."
                              className="rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none"
                            />
                          </div>
                          <textarea
                            value={interviewResults[request.id] || ""}
                            onChange={(event) =>
                              setInterviewResults((prev) => ({ ...prev, [request.id]: event.target.value }))
                            }
                            placeholder="ملاحظات المقابلة: قراءة الطالب، قوة الحفظ، موضع البداية المناسب، أي توصية للمعلم..."
                            className="mt-3 min-h-28 w-full rounded-xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm leading-7 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveInterviewResult(request.id)}
                            disabled={savingInterviewResultId === request.id}
                            className="mt-3 rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                          >
                            {savingInterviewResultId === request.id ? "جارٍ حفظ النتيجة..." : "حفظ نتيجة المقابلة"}
                          </button>
                        </div>
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
                        className="min-h-28 w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                      />

                      {!request.createdStudentId ? (
                        <div className="space-y-3 rounded-2xl border border-[#d9c8ad] bg-white p-3">
                          <select
                            value={selectedCircle[request.id] || ""}
                            onChange={(event) => {
                              const circleId = event.target.value;

                              setSelectedCircle((prev) => ({ ...prev, [request.id]: circleId }));
                            }}
                            className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                          >
                            <option value="">اختر الحلقة المناسبة</option>
                            {circles.map((circle) => (
                              <option key={circle.id} value={circle.id}>
                                {circle.name}
                                {circle.teacher?.fullName ? ` - ${circle.teacher.fullName}` : ""}
                                {circle.startsAt && circle.endsAt ? ` (${circle.startsAt} - ${circle.endsAt})` : ""}
                              </option>
                            ))}
                          </select>

                          <select
                            value={selectedTeacher[request.id] || ""}
                            onChange={(event) =>
                              setSelectedTeacher((prev) => ({ ...prev, [request.id]: event.target.value }))
                            }
                            className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                          >
                            <option value="">أو اختر معلمًا مباشرة</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={placingId === request.id}
                            onClick={() => placeRequest(request)}
                            className="w-full rounded-xl bg-[#8a6335] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                          >
                            {placingId === request.id ? "جارٍ وضع الطالب..." : "وضع الطالب في حلقة وإنشاؤه"}
                          </button>
                        </div>
                      ) : (
                        <Link
                          href="/remote/supervision/students"
                          className="block rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-center text-sm font-black text-[#1c2d31]"
                        >
                          فتح إدارة الطلاب
                        </Link>
                      )}

                      <button
                        type="button"
                        disabled={savingId === request.id}
                        onClick={() => saveStatus(request.id)}
                        className="w-full rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                      >
                        {savingId === request.id ? "جارٍ الحفظ..." : "حفظ حالة الإشراف"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openInterviewModal(request)}
                        className="w-full rounded-xl border-2 border-[#1f6358] bg-transparent px-4 py-3 text-sm font-black text-[#1f6358] transition hover:bg-[#1f6358] hover:text-white"
                      >
                        تحديد موعد مقابلة
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading ? (
          <details className="rounded-[2rem] bg-white/78 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <summary className="cursor-pointer text-lg font-black text-[#1c2d31]">
              سجل الطلبات المحولة من الإدارة ({forwardedRequests.length})
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {forwardedRequests.length === 0 ? (
                <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-bold text-[#1c2d31]/60">
                  لا توجد طلبات محولة من الإدارة حتى الآن.
                </div>
              ) : (
                forwardedRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl bg-[#fffaf2] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[#1c2d31]">{request.studentName}</h3>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        {STATUS_LABELS[request.supervisionStatus]}
                      </span>
                      {request.createdStudentId ? (
                        <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                          تم إنشاء الطالب
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#1c2d31]/65">
                      {request.requestedTracks || "لم يحدد المسار"} - {request.parentWhatsapp}
                    </p>
                    {request.interviewDate ? (
                      <p className="mt-1 text-xs font-bold text-[#1f6358]">
                        موعد المقابلة: {formatDate(request.interviewDate)}
                        {request.interviewLink ? ` - ${request.interviewLink}` : ""}
                      </p>
                    ) : null}
                    {request.supervisionNote ? (
                      <p className="mt-2 line-clamp-3 text-xs leading-6 text-[#1c2d31]/55">
                        {request.supervisionNote}
                      </p>
                    ) : null}
                    {request.createdStudentId ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => sendSupervisorMessage(request.id, "SEND_SUPERVISION_ACCEPTANCE_MESSAGE")}
                          disabled={sendingAcceptanceId === request.id}
                          className="rounded-xl bg-[#1f6358] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                        >
                          {sendingAcceptanceId === request.id ? "جارٍ إرسال القبول..." : "إرسال رسالة القبول"}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendSupervisorMessage(request.id, "SEND_SUPERVISION_CIRCLE_DETAILS_MESSAGE")}
                          disabled={sendingDetailsId === request.id}
                          className="rounded-xl bg-[#8a6335] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                        >
                          {sendingDetailsId === request.id ? "جارٍ إرسال التفاصيل..." : "إرسال تفاصيل الحلقة"}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendSupervisorMessage(request.id, "SEND_PARENT_EDUCATION_CHAT_GUIDE")}
                          disabled={sendingParentGuideId === request.id}
                          className="rounded-xl bg-[#173d42] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                        >
                          {sendingParentGuideId === request.id ? "جارٍ إرسال شرح المراسلات..." : "شرح المراسلات لولي الأمر"}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendSupervisorMessage(request.id, "SEND_TEACHER_EDUCATION_CHAT_GUIDE")}
                          disabled={sendingTeacherGuideId === request.id}
                          className="rounded-xl border border-[#1f6358] bg-white px-4 py-2 text-sm font-black text-[#1f6358] disabled:opacity-60"
                        >
                          {sendingTeacherGuideId === request.id ? "جارٍ إرسال شرح المعلم..." : "شرح المراسلات للمعلم"}
                        </button>
                        <Link
                          href="/remote/supervision/students"
                          className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-2 text-sm font-black text-[#1c2d31]"
                        >
                          فتح سجل الطلاب
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </details>
        ) : null}
      </div>

      {interviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2d31]/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-[#fffaf2] p-8 shadow-xl" dir="rtl">
            <h2 className="mb-6 text-2xl font-black text-[#1c2d31]">تحديد موعد المقابلة</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]/80">التاريخ</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]/80">الوقت</label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#1c2d31]/80">رابط زووم (اختياري)</label>
                <input
                  type="url"
                  value={interviewZoomUrl}
                  onChange={(e) => setInterviewZoomUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-left outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-bold text-[#1c2d31]/80">نص رسالة الواتساب</label>
                  {selectedInterviewRequest ? (
                    <button
                      type="button"
                      onClick={() =>
                        setInterviewMessage(
                          buildInterviewMessage(
                            selectedInterviewRequest,
                            interviewDate,
                            interviewTime,
                            interviewZoomUrl
                          )
                        )
                      }
                      className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-xs font-black text-[#1c2d31]"
                    >
                      تحديث النص من البيانات
                    </button>
                  ) : null}
                </div>
                <textarea
                  value={interviewMessage}
                  onChange={(e) => setInterviewMessage(e.target.value)}
                  className="min-h-48 w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 outline-none"
                />
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  disabled={schedulingId === interviewModalOpen || !interviewDate || !interviewTime}
                  onClick={() => scheduleInterview(interviewModalOpen)}
                  className="flex-1 rounded-xl bg-[#1f6358] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {schedulingId === interviewModalOpen ? "جارٍ الإرسال..." : "حفظ وإرسال واتساب"}
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(null)}
                  className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-black text-[#1c2d31]"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
