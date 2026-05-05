"use client";

import { useState } from "react";

type Props = {
  circleName?: string | null;
  circleUrl?: string | null;
};

export default function InstantEntryRequestButtons({ circleName, circleUrl }: Props) {
  const [sendingTarget, setSendingTarget] = useState<"SUPERVISION" | "ADMIN" | null>(null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sentToday, setSentToday] = useState<Record<"SUPERVISION" | "ADMIN", boolean>>({
    SUPERVISION: false,
    ADMIN: false,
  });

  const sendRequest = async (target: "SUPERVISION" | "ADMIN") => {
    try {
      setSendingTarget(target);
      setFeedback("");
      const targetLabel = target === "SUPERVISION" ? "الإشراف" : "الإدارة";
      const details = [
        `طلب دخول فوري من ${targetLabel}.`,
        circleName ? `الحلقة: ${circleName}` : "",
        circleUrl ? `رابط الحلقة: ${circleUrl}` : "",
        note.trim() ? `سبب الطلب: ${note.trim()}` : "لم يذكر المعلم سببًا مفصلًا.",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/teacher-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GENERAL",
          priority: "URGENT",
          target,
          instantEntry: true,
          subject: `طلب دخول فوري من ${targetLabel}`,
          details,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.error || "تعذر إرسال الطلب");
        if (response.status === 409) setSentToday((prev) => ({ ...prev, [target]: true }));
        return;
      }

      setNote("");
      setSentToday((prev) => ({ ...prev, [target]: true }));
      setFeedback(`تم إرسال طلب الدخول الفوري إلى ${targetLabel}.`);
    } catch (error) {
      console.error("INSTANT ENTRY REQUEST ERROR =>", error);
      setFeedback("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSendingTarget(null);
    }
  };

  return (
    <section className="rounded-[1.6rem] bg-red-50 p-4 text-red-900 shadow-sm ring-1 ring-red-100">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black">طلب دخول فوري</h2>
          <p className="mt-1 text-sm leading-6 text-red-800/75">
            يستخدم هذا الزر عند الضرورة القصوى فقط لاستدعاء الإشراف أو الإدارة للدخول إلى الحلقة، ولا يستخدم بشكل متكرر.
            للطلبات العادية أو المستعجلة غير الطارئة يرجى رفع طلب من صفحة الطلبات المعتادة.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(sendingTarget) || sentToday.SUPERVISION}
            onClick={() => sendRequest("SUPERVISION")}
            className="rounded-full bg-red-700 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {sentToday.SUPERVISION
              ? "تم إرسال طلب الإشراف اليوم"
              : sendingTarget === "SUPERVISION"
                ? "جارٍ الإرسال..."
                : "طلب الإشراف"}
          </button>
          <button
            type="button"
            disabled={Boolean(sendingTarget) || sentToday.ADMIN}
            onClick={() => sendRequest("ADMIN")}
            className="rounded-full bg-[#173d42] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {sentToday.ADMIN
              ? "تم إرسال طلب الإدارة اليوم"
              : sendingTarget === "ADMIN"
                ? "جارٍ الإرسال..."
                : "طلب الإدارة"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm leading-7 text-[#173d42]/75">
        عند دخول ولي أمر أو وجود استفسار أو شكوى أو اعتراض يخص المنصة، يرجى توجيهه إلى رقم واتساب المنصة الرسمي، ولا يتم إدخاله إلى الحلقة إلا بتوجيه واضح من الإدارة أو الإشراف.
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="سبب مختصر للطلب - اختياري"
        className="mt-3 min-h-16 w-full resize-none rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm text-[#173d42] outline-none focus:border-red-300"
      />
      {feedback ? <p className="mt-2 text-sm font-black">{feedback}</p> : null}
    </section>
  );
}
