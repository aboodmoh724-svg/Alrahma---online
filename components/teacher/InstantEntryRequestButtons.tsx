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
    <details className="group rounded-[1.4rem] border border-red-100 bg-white p-4 shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
              طارئ
            </span>
            <h2 className="text-base font-black text-[#1c2d31]">طلب دخول فوري</h2>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#1c2d31]/62">
            يستخدم عند الضرورة القصوى فقط، أما الطلبات المعتادة فترفع من صفحة الطلبات.
          </p>
        </div>
        <span className="rounded-full bg-[#fff3f3] px-4 py-2 text-sm font-black text-red-700 transition group-open:bg-red-600 group-open:text-white">
          فتح الطلب
        </span>
      </summary>

      <div className="mt-4 space-y-3 border-t border-[#f0dfd6] pt-4">
        <p className="rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm leading-7 text-[#173d42]/75">
          عند الحاجة الضرورية لاستدعاء مشرف أو إداري إلى الحلقة، اختر الجهة المناسبة
          وأضف سببًا مختصرًا. لا يستخدم هذا الطلب بشكل متكرر.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(sendingTarget) || sentToday.SUPERVISION}
            onClick={() => sendRequest("SUPERVISION")}
            className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55"
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
            className="rounded-2xl bg-[#173d42] px-4 py-3 text-sm font-black text-white transition hover:bg-[#1f6358] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {sentToday.ADMIN
              ? "تم إرسال طلب الإدارة اليوم"
              : sendingTarget === "ADMIN"
                ? "جارٍ الإرسال..."
                : "طلب الإدارة"}
          </button>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm leading-7 text-[#173d42]/75">
          عند دخول ولي أمر أو وجود استفسار أو شكوى أو اعتراض يخص المنصة، يرجى
          توجيهه إلى رقم واتساب المنصة الرسمي، ولا يتم إدخاله إلى الحلقة إلا
          بتوجيه واضح من الإدارة أو الإشراف.
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="سبب مختصر للطلب - اختياري"
          className="min-h-16 w-full resize-none rounded-2xl border border-[#e7dcc8] bg-[#fffaf2] px-4 py-3 text-sm text-[#173d42] outline-none focus:border-red-300"
        />
        {feedback ? <p className="text-sm font-black text-red-700">{feedback}</p> : null}
      </div>
    </details>
  );
}
