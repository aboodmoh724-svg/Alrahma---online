"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  canReplyDirectly?: boolean;
  student: {
    fullName: string;
    parentWhatsapp: string | null;
    teacher: { fullName: string; whatsapp: string | null } | null;
  } | null;
  registrationRequest: { studentName: string; parentWhatsapp: string } | null;
  lastOutgoingMessage: { body: string; category: IncomingMessage["category"]; createdAt: string } | null;
};

const categoryLabels: Record<IncomingMessage["category"], string> = {
  GENERAL: "عام",
  INTERVIEW_RESCHEDULE: "موعد مقابلة",
  ABSENCE_EXCUSE: "عذر غياب",
  COMPLAINT: "شكوى",
  INQUIRY: "استفسار",
  THANKS: "شكر",
  CONFIRMATION: "تأكيد",
  STRUGGLE_REPLY: "متابعة تعثر",
};

function defaultParentReply(message: IncomingMessage) {
  const name = message.student?.fullName || message.registrationRequest?.studentName || "الطالب";
  return `السلام عليكم ورحمة الله وبركاته\n\nوصلتنا ملاحظتكم بخصوص ${name}، ونقدر تواصلكم.\nسيتم مراجعة الأمر والرد عليكم بعد التحقق بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم`;
}

function defaultSupervisionNote(message: IncomingMessage) {
  const name = message.student?.fullName || message.registrationRequest?.studentName || "الطالب";
  return `يرجى متابعة رسالة ولي الأمر بخصوص ${name} والرد عليه بعد مراجعة الحالة.`;
}

function defaultTeacherMessage(message: IncomingMessage) {
  const name = message.student?.fullName || message.registrationRequest?.studentName || "الطالب";
  return `السلام عليكم ورحمة الله وبركاته\n\nوردت للإدارة ملاحظة بخصوص ${name}. نرجو مراجعة حالة الطالب وإفادة الإشراف بما يلزم.\n\nإدارة منصة الرحمة`;
}

export default function RemoteAdminEscalatedMessagesPage() {
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [parentReplies, setParentReplies] = useState<Record<string, string>>({});
  const [supervisionNotes, setSupervisionNotes] = useState<Record<string, string>>({});
  const [teacherMessages, setTeacherMessages] = useState<Record<string, string>>({});

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/whatsapp/incoming?channel=REMOTE&status=ESCALATED&openOnly=false&limit=120", {
        cache: "no-store",
      });
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      console.error("FETCH ESCALATED WHATSAPP MESSAGES ERROR =>", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const patchMessage = async (message: IncomingMessage, payload: Record<string, unknown>, successText: string) => {
    try {
      setHandlingId(message.id);
      const response = await fetch("/api/whatsapp/incoming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: message.id, ...payload }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر تنفيذ الإجراء");
        return;
      }

      setMessages((current) => current.filter((item) => item.id !== message.id));
      alert(successText);
    } catch (error) {
      console.error("ADMIN ESCALATED MESSAGE ACTION ERROR =>", error);
      alert("حدث خطأ أثناء تنفيذ الإجراء");
    } finally {
      setHandlingId(null);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإدارة</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">المتابعات المحولة من الإشراف</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              هنا تصل الرسائل التي يحولها المشرف للإدارة، ويمكن الرد على ولي الأمر أو إعادة توجيهها للإشراف أو مراسلة المعلم.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">صندوق الإدارة</h2>
              <p className="mt-1 text-sm text-[#1c2d31]/60">كل بطاقة تحتاج قرارًا إداريًا واحدًا واضحًا.</p>
            </div>
            <span className="rounded-full bg-[#173d42] px-4 py-2 text-sm font-black text-white">
              {messages.length}
            </span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {loading ? (
              <div className="rounded-2xl bg-[#fffaf2] p-5 text-sm font-bold text-[#1c2d31]/60">
                جاري تحميل الرسائل المحولة...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl bg-[#fffaf2] p-5 text-sm font-bold text-[#1c2d31]/60">
                لا توجد رسائل محولة للإدارة الآن.
              </div>
            ) : (
              messages.map((message) => {
                const studentName =
                  message.student?.fullName || message.registrationRequest?.studentName || "رقم غير مرتبط بطالب";
                const parentReply = parentReplies[message.id] ?? defaultParentReply(message);
                const supervisionNote = supervisionNotes[message.id] ?? defaultSupervisionNote(message);
                const teacherMessage = teacherMessages[message.id] ?? defaultTeacherMessage(message);
                const hasTeacherWhatsapp = Boolean(message.student?.teacher?.whatsapp);

                return (
                  <article
                    key={message.id}
                    className={`rounded-2xl p-4 ring-1 ${
                      message.category === "COMPLAINT"
                        ? "bg-red-50 ring-red-200"
                        : "bg-[#fffaf2] ring-[#e5d7bd]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#173d42] px-3 py-1 text-xs font-black text-white">
                          {categoryLabels[message.category]}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#8a6335] ring-1 ring-[#e5d7bd]">
                          محول من الإشراف
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#1c2d31]/50">{message.fromNumber}</span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-[#1c2d31]">{studentName}</h3>
                    {message.student?.teacher ? (
                      <p className="mt-1 text-xs font-bold text-[#1c2d31]/60">
                        المعلم: {message.student.teacher.fullName}
                      </p>
                    ) : null}
                    {message.supervisorNote ? (
                      <div className="mt-3 rounded-xl bg-white/80 p-3 text-sm leading-7 text-[#1c2d31]/70 ring-1 ring-[#eadcc4]">
                        <span className="font-black text-[#1c2d31]">ملاحظة الإشراف: </span>
                        {message.supervisorNote}
                      </div>
                    ) : null}
                    <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-7 text-[#1c2d31]">
                      {message.body}
                    </div>

                    <div className="mt-4 grid gap-3">
                      <label className="grid gap-1 text-xs font-black text-[#173d42]/70">
                        رد مباشر لولي الأمر
                        <textarea
                          value={parentReply}
                          onChange={(event) => setParentReplies((current) => ({ ...current, [message.id]: event.target.value }))}
                          className="min-h-28 rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-normal leading-7 outline-none"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-black text-[#173d42]/70">
                        رسالة للإشراف كي يتابع الرد
                        <textarea
                          value={supervisionNote}
                          onChange={(event) => setSupervisionNotes((current) => ({ ...current, [message.id]: event.target.value }))}
                          className="min-h-24 rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-normal leading-7 outline-none"
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-black text-[#173d42]/70">
                        رسالة للمعلم
                        <textarea
                          value={teacherMessage}
                          onChange={(event) => setTeacherMessages((current) => ({ ...current, [message.id]: event.target.value }))}
                          className="min-h-24 rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm font-normal leading-7 outline-none disabled:opacity-60"
                          disabled={!hasTeacherWhatsapp}
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={handlingId === message.id || !message.canReplyDirectly}
                        onClick={() =>
                          patchMessage(
                            message,
                            { action: "REPLY", reply: parentReply, supervisorNote: "تم الرد من الإدارة مباشرة." },
                            "تم الرد على ولي الأمر وإغلاق المتابعة."
                          )
                        }
                        className="rounded-xl bg-[#1f6358] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                      >
                        الرد على ولي الأمر
                      </button>
                      <button
                        type="button"
                        disabled={handlingId === message.id}
                        onClick={() =>
                          patchMessage(
                            message,
                            { action: "UPDATE_STATUS", status: "IN_REVIEW", supervisorNote: supervisionNote },
                            "تمت إعادة الرسالة إلى الإشراف للمتابعة."
                          )
                        }
                        className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-2 text-sm font-black text-[#173d42] disabled:opacity-60"
                      >
                        إرسال للإشراف
                      </button>
                      <button
                        type="button"
                        disabled={handlingId === message.id || !hasTeacherWhatsapp}
                        onClick={() =>
                          patchMessage(
                            message,
                            {
                              action: "MESSAGE_TEACHER",
                              teacherMessage,
                              supervisorNote: `${supervisionNote}\n\nتمت مراسلة المعلم من الإدارة.`,
                            },
                            "تم إرسال الرسالة للمعلم وإعادة المتابعة للإشراف."
                          )
                        }
                        className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-2 text-sm font-black text-[#173d42] disabled:opacity-60"
                      >
                        مراسلة المعلم
                      </button>
                      <button
                        type="button"
                        disabled={handlingId === message.id}
                        onClick={() =>
                          patchMessage(
                            message,
                            { action: "UPDATE_STATUS", status: "CLOSED", supervisorNote: supervisionNote },
                            "تم إغلاق المتابعة."
                          )
                        }
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700 disabled:opacity-60"
                      >
                        إغلاق
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
