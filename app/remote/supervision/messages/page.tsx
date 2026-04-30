"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  fullName: string;
  studentCode: string | null;
  parentWhatsapp: string | null;
  teacher: { fullName: string } | null;
  circle: { name: string } | null;
};

type Teacher = {
  id: string;
  fullName: string;
  whatsapp: string | null;
};

type IncomingMessage = {
  id: string;
  fromNumber: string;
  body: string;
  category:
    | "GENERAL"
    | "INTERVIEW_RESCHEDULE"
    | "ABSENCE_EXCUSE"
    | "COMPLAINT"
    | "INQUIRY"
    | "THANKS"
    | "CONFIRMATION"
    | "STRUGGLE_REPLY";
  followUpStatus: "NEW" | "IN_REVIEW" | "REPLIED" | "CLOSED" | "ESCALATED";
  supervisorNote: string | null;
  createdAt: string;
  student: { fullName: string; parentWhatsapp: string | null } | null;
  registrationRequest: { studentName: string; parentWhatsapp: string } | null;
  lastOutgoingMessage: { body: string; category: IncomingMessage["category"]; createdAt: string } | null;
  canReplyDirectly?: boolean;
};

type RecipientMode = "SELECTED_PARENTS" | "ALL_PARENTS" | "SELECTED_TEACHERS" | "ALL_TEACHERS";

const templates = [
  {
    key: "struggle",
    title: "متابعة تعثر",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود إشعاركم بأن الطالب {{studentName}} يحتاج إلى متابعة إضافية في المراجعة والحفظ.\n\nنرجو تخصيص وقت يومي قصير لمتابعته، وسيبقى المشرف والمعلم قريبين من حالته بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "absence",
    title: "غياب متكرر",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود التنبيه إلى تكرر غياب الطالب {{studentName}} عن الحلقة.\n\nنرجو الحرص على انتظامه في الموعد المحدد، فاستمرار الحضور يعين الطالب على الثبات والإنجاز.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "teacher",
    title: "رسالة للمعلمين",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nالإخوة المعلمون الكرام، نرجو التنبه إلى الآتي:\n{{message}}\n\nبارك الله في جهودكم وجعلها في ميزان حسناتكم.",
  },
  {
    key: "supervision",
    title: "تعميم إشرافي",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nتنبيه إشرافي من منصة الرحمة:\n{{message}}\n\nنسأل الله أن يبارك في أبنائنا ووقتكم.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "general",
    title: "رسالة عامة",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n{{message}}\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
];

function applyTemplate(template: string, values: { studentName: string; message: string }) {
  return template
    .replaceAll("{{studentName}}", values.studentName || "ابنكم")
    .replaceAll("{{message}}", values.message || "نرجو منكم متابعة الملاحظة المرسلة من الإشراف.");
}

export default function RemoteSupervisionMessagesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("SELECTED_PARENTS");
  const [studentQuery, setStudentQuery] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0].key);
  const [message, setMessage] = useState(templates[0].body);
  const [quickReplies, setQuickReplies] = useState<Record<string, string>>({});
  const [messageNotes, setMessageNotes] = useState<Record<string, string>>({});
  const [handlingMessageId, setHandlingMessageId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedTemplateKey) || templates[0],
    [selectedTemplateKey]
  );
  const selectedStudents = students.filter((student) => selectedStudentIds.includes(student.id));
  const selectedTeachers = teachers.filter((teacher) => selectedTeacherIds.includes(teacher.id));
  const primaryStudentName = selectedStudents[0]?.fullName || "";

  const filteredStudents = students.filter((student) => {
    const text = [student.fullName, student.studentCode, student.parentWhatsapp, student.teacher?.fullName, student.circle?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(studentQuery.trim().toLowerCase());
  });
  const filteredTeachers = teachers.filter((teacher) => {
    const text = [teacher.fullName, teacher.whatsapp].filter(Boolean).join(" ").toLowerCase();

    return text.includes(teacherQuery.trim().toLowerCase());
  });

  const recipientCount =
    recipientMode === "ALL_PARENTS"
      ? students.filter((student) => student.parentWhatsapp).length
      : recipientMode === "ALL_TEACHERS"
        ? teachers.filter((teacher) => teacher.whatsapp).length
        : recipientMode === "SELECTED_TEACHERS"
          ? selectedTeachers.filter((teacher) => teacher.whatsapp).length
          : selectedStudents.filter((student) => student.parentWhatsapp).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsResponse, teachersResponse, incomingResponse] = await Promise.all([
          fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
          fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
          fetch("/api/whatsapp/incoming?channel=REMOTE&openOnly=true&limit=80", { cache: "no-store" }),
        ]);
        const [studentsData, teachersData, incomingData] = await Promise.all([
          studentsResponse.json(),
          teachersResponse.json(),
          incomingResponse.json(),
        ]);

        setStudents(Array.isArray(studentsData.students) ? studentsData.students : []);
        setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
        setIncomingMessages(Array.isArray(incomingData.messages) ? incomingData.messages : []);
      } catch (error) {
        console.error("FETCH SUPERVISION MESSAGE RECIPIENTS ERROR =>", error);
        setStudents([]);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markIncomingAsRead = async (messageId: string) => {
    try {
      const response = await fetch("/api/whatsapp/incoming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [messageId] }),
      });

      if (!response.ok) return;

      setIncomingMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (error) {
      console.error("MARK INCOMING MESSAGE READ ERROR =>", error);
    }
  };

  const categoryLabel = (category: IncomingMessage["category"]) => {
    const labels: Record<IncomingMessage["category"], string> = {
      GENERAL: "عام",
      INTERVIEW_RESCHEDULE: "موعد مقابلة",
      ABSENCE_EXCUSE: "عذر غياب",
      COMPLAINT: "شكوى",
      INQUIRY: "استفسار",
      THANKS: "شكر",
      CONFIRMATION: "تأكيد",
      STRUGGLE_REPLY: "متابعة تعثر",
    };

    return labels[category] || "عام";
  };

  const statusLabel = (status: IncomingMessage["followUpStatus"]) => {
    const labels: Record<IncomingMessage["followUpStatus"], string> = {
      NEW: "جديد",
      IN_REVIEW: "قيد المتابعة",
      REPLIED: "تم الرد",
      CLOSED: "مغلق",
      ESCALATED: "محول للإدارة",
    };

    return labels[status] || "جديد";
  };

  const suggestedReply = (item: IncomingMessage) => {
    const studentName = item.student?.fullName || item.registrationRequest?.studentName || "الطالب";

    if (item.category === "INTERVIEW_RESCHEDULE") {
      return `السلام عليكم ورحمة الله وبركاته\n\nشكرًا لتواصلكم بخصوص موعد مقابلة ${studentName}.\nنرجو تزويدنا بالأوقات المناسبة لكم خلال اليومين القادمين، وسنرتب موعدًا بديلًا بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم`;
    }

    if (item.category === "ABSENCE_EXCUSE") {
      return `السلام عليكم ورحمة الله وبركاته\n\nتم استلام عذر غياب ${studentName}، شكرًا لتواصلكم.\nسيتم إبلاغ الإشراف ومتابعة انتظام الطالب بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم`;
    }

    if (item.category === "COMPLAINT") {
      return `السلام عليكم ورحمة الله وبركاته\n\nوصلتنا ملاحظتكم بخصوص ${studentName}، ونقدر لكم تنبيهكم.\nسيتم مراجعة الأمر من الإشراف والرد عليكم بعد التحقق بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم`;
    }

    return `السلام عليكم ورحمة الله وبركاته\n\nوصلتنا رسالتكم، وسيتم متابعتها من الإشراف بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم`;
  };

  const canReplyToIncoming = (item: IncomingMessage) => {
    if (typeof item.canReplyDirectly === "boolean") return item.canReplyDirectly;
    if (item.student?.parentWhatsapp || item.registrationRequest?.parentWhatsapp) return true;
    return item.fromNumber.replace(/\D/g, "").length <= 13;
  };

  const updateIncomingStatus = async (
    messageId: string,
    status: IncomingMessage["followUpStatus"]
  ) => {
    try {
      setHandlingMessageId(messageId);
      const response = await fetch("/api/whatsapp/incoming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          messageId,
          status,
          supervisorNote: messageNotes[messageId] || "",
        }),
      });

      if (!response.ok) return;

      setIncomingMessages((prev) =>
        status === "CLOSED"
          ? prev.filter((item) => item.id !== messageId)
          : prev.map((item) =>
              item.id === messageId ? { ...item, followUpStatus: status, supervisorNote: messageNotes[messageId] || null } : item
            )
      );
    } finally {
      setHandlingMessageId(null);
    }
  };

  const sendQuickReply = async (item: IncomingMessage) => {
    try {
      setHandlingMessageId(item.id);
      const reply = quickReplies[item.id] || suggestedReply(item);
      const response = await fetch("/api/whatsapp/incoming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPLY",
          messageId: item.id,
          reply,
          supervisorNote: messageNotes[item.id] || "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال الرد");
        return;
      }

      setIncomingMessages((prev) => prev.filter((message) => message.id !== item.id));
      alert("تم إرسال الرد وحفظ المتابعة");
    } catch (error) {
      console.error("SEND QUICK REPLY ERROR =>", error);
      alert("حدث خطأ أثناء إرسال الرد عبر واتساب");
    } finally {
      setHandlingMessageId(null);
    }
  };

  const fillSelectedTemplate = (templateKey: string) => {
    const template = templates.find((item) => item.key === templateKey) || templates[0];
    setSelectedTemplateKey(template.key);
    setMessage(applyTemplate(template.body, { studentName: primaryStudentName, message: customMessage }));
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  const sendMessage = async () => {
    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: recipientMode,
          selectedParentIds: selectedStudentIds,
          selectedTeacherIds,
          message,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال الرسالة");
        return;
      }

      alert(`تم الإرسال إلى ${data.sentCount || 0} من أصل ${data.recipientsCount || 0}`);
    } catch (error) {
      console.error("SEND SUPERVISION MESSAGE ERROR =>", error);
      alert("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">رسائل أولياء الأمور والمعلمين</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              اختر الطالب أو المعلم من النظام، ثم عدل القالب وأرسل الرسالة دون إدخال الأرقام يدويًا.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">مركز متابعة رسائل أولياء الأمور</h2>
              <p className="mt-1 text-sm text-[#1c2d31]/60">
                كل رد وارد يظهر هنا مع الطالب والسياق والخطوة التالية، دون انتقال بين صفحات متعددة.
              </p>
            </div>
            <span className="rounded-full bg-[#173d42] px-4 py-2 text-sm font-black text-white">
              {incomingMessages.length}
            </span>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {incomingMessages.length === 0 ? (
              <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-bold text-[#1c2d31]/60">
                لا توجد رسائل واردة جديدة.
              </div>
            ) : (
              incomingMessages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl p-4 ring-1 ${
                    message.category === "COMPLAINT"
                      ? "bg-red-50 ring-red-200"
                      : message.category === "INTERVIEW_RESCHEDULE"
                        ? "bg-amber-50 ring-amber-200"
                        : "bg-[#fffaf2] ring-[#e5d7bd]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#1f6358] px-3 py-1 text-xs font-black text-white">
                        {categoryLabel(message.category)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#173d42] ring-1 ring-[#e5d7bd]">
                        {statusLabel(message.followUpStatus)}
                      </span>
                      <span className="text-xs font-bold text-[#1c2d31]/50">{message.fromNumber}</span>
                    </div>
                    <button
                      type="button"
                      disabled={handlingMessageId === message.id}
                      onClick={() => updateIncomingStatus(message.id, "CLOSED")}
                      className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-xs font-black text-[#173d42] disabled:opacity-60"
                    >
                      إغلاق
                    </button>
                  </div>

                  <p className="mt-3 text-base font-black text-[#1c2d31]">
                    {message.student?.fullName || message.registrationRequest?.studentName || "رقم غير مرتبط بطالب"}
                  </p>

                  {message.lastOutgoingMessage ? (
                    <div className="mt-3 rounded-xl bg-white/80 p-3 text-xs leading-6 text-[#1c2d31]/65 ring-1 ring-[#eadcc4]">
                      <p className="font-black text-[#1c2d31]">
                        آخر رسالة من النظام: {categoryLabel(message.lastOutgoingMessage.category)}
                      </p>
                      <p className="mt-1 line-clamp-2">{message.lastOutgoingMessage.body}</p>
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-7 text-[#1c2d31]">
                    {message.body}
                  </div>

                  {!canReplyToIncoming(message) ? (
                    <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700 ring-1 ring-red-100">
                      لا يمكن الرد مباشرة لأن واتساب أرسل معرّفاً داخلياً لا رقم جوال واضحاً. استخدم قيد المتابعة أو أغلق البطاقة بعد مراجعة الرقم.
                    </p>
                  ) : null}

                  <textarea
                    disabled={!canReplyToIncoming(message)}
                    value={quickReplies[message.id] ?? suggestedReply(message)}
                    onChange={(event) =>
                      setQuickReplies((prev) => ({ ...prev, [message.id]: event.target.value }))
                    }
                    className="mt-3 min-h-32 w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 outline-none disabled:opacity-60"
                  />

                  <input
                    value={messageNotes[message.id] || ""}
                    onChange={(event) =>
                      setMessageNotes((prev) => ({ ...prev, [message.id]: event.target.value }))
                    }
                    placeholder="ملاحظة داخلية للمشرف"
                    className="mt-3 w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={handlingMessageId === message.id || !canReplyToIncoming(message)}
                      onClick={() => sendQuickReply(message)}
                      className="rounded-xl bg-[#1f6358] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                    >
                      إرسال الرد وحفظ
                    </button>
                    <button
                      type="button"
                      disabled={handlingMessageId === message.id}
                      onClick={() => updateIncomingStatus(message.id, "IN_REVIEW")}
                      className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-2 text-sm font-black text-[#173d42] disabled:opacity-60"
                    >
                      قيد المتابعة
                    </button>
                    <button
                      type="button"
                      disabled={handlingMessageId === message.id}
                      onClick={() => updateIncomingStatus(message.id, "ESCALATED")}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700 disabled:opacity-60"
                    >
                      تحويل للإدارة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <div className="space-y-4 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="grid gap-2">
              {[
                { value: "SELECTED_PARENTS", label: "أولياء أمور محددون" },
                { value: "ALL_PARENTS", label: "جميع أولياء الأمور" },
                { value: "SELECTED_TEACHERS", label: "معلمون محددون" },
                { value: "ALL_TEACHERS", label: "جميع المعلمين" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setRecipientMode(mode.value as RecipientMode)}
                  className={`rounded-2xl px-4 py-3 text-right text-sm font-black ${
                    recipientMode === mode.value
                      ? "bg-[#173d42] text-white"
                      : "bg-[#fffaf2] text-[#173d42] ring-1 ring-[#e5d7bd]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {recipientMode.includes("PARENTS") ? (
              <div className="space-y-3">
                <input
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="ابحث باسم الطالب أو رقمه أو ولي الأمر"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="max-h-[420px] space-y-2 overflow-y-auto pl-1">
                  {loading ? (
                    <p className="rounded-2xl bg-[#fffaf2] p-4 text-center text-sm text-[#1c2d31]/60">جاري التحميل...</p>
                  ) : filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      disabled={recipientMode === "ALL_PARENTS"}
                      className={`w-full rounded-2xl p-3 text-right ring-1 ring-[#d9c8ad] ${
                        selectedStudentIds.includes(student.id)
                          ? "bg-[#1f6358] text-white"
                          : "bg-[#fffaf2] text-[#1c2d31]"
                      } disabled:opacity-60`}
                    >
                      <p className="font-black">{student.fullName}</p>
                      <p className="mt-1 text-xs opacity-75">
                        {student.parentWhatsapp || "لا يوجد رقم"} - {student.circle?.name || "بلا حلقة"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={teacherQuery}
                  onChange={(event) => setTeacherQuery(event.target.value)}
                  placeholder="ابحث باسم المعلم أو رقمه"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="max-h-[420px] space-y-2 overflow-y-auto pl-1">
                  {loading ? (
                    <p className="rounded-2xl bg-[#fffaf2] p-4 text-center text-sm text-[#1c2d31]/60">جاري التحميل...</p>
                  ) : filteredTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => toggleTeacher(teacher.id)}
                      disabled={recipientMode === "ALL_TEACHERS"}
                      className={`w-full rounded-2xl p-3 text-right ring-1 ring-[#d9c8ad] ${
                        selectedTeacherIds.includes(teacher.id)
                          ? "bg-[#1f6358] text-white"
                          : "bg-[#fffaf2] text-[#1c2d31]"
                      } disabled:opacity-60`}
                    >
                      <p className="font-black">{teacher.fullName}</p>
                      <p className="mt-1 text-xs opacity-75">{teacher.whatsapp || "لا يوجد رقم"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-[#173d42] p-4 text-white">
              <p className="text-sm font-bold text-white/70">عدد المستلمين الجاهزين</p>
              <p className="mt-2 text-4xl font-black">{recipientCount}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <label className="block text-sm font-black text-[#1c2d31]">
              ملاحظة مختصرة للقالب
              <textarea
                value={customMessage}
                onChange={(event) => setCustomMessage(event.target.value)}
                rows={3}
                placeholder="تستخدم داخل قالب التعميم أو الرسالة العامة"
                className="mt-2 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => fillSelectedTemplate(template.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    selectedTemplate.key === template.key
                      ? "bg-[#173d42] text-white"
                      : "bg-[#fffaf2] text-[#173d42] ring-1 ring-[#e5d7bd]"
                  }`}
                >
                  {template.title}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={14}
              className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm leading-7 outline-none"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => fillSelectedTemplate(selectedTemplate.key)}
                className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#173d42]"
              >
                تحديث القالب بالبيانات
              </button>
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || recipientCount === 0 || !message.trim()}
                className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {sending ? "جارٍ الإرسال..." : "إرسال واتساب"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
