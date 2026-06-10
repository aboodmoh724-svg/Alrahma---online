"use client";

import { useState } from "react";

type ParentReportSendButtonProps = {
  reportId: string;
  initialSent: boolean;
  parentWhatsapp?: string | null;
};

export default function ParentReportSendButton({
  reportId,
  initialSent,
  parentWhatsapp,
}: ParentReportSendButtonProps) {
  const [sent, setSent] = useState(initialSent);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (sent || sending || !parentWhatsapp) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}/parent-sent`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentToParent: true }),
      });

      if (!response.ok) {
        setError("حدث خطأ أثناء إرسال التقرير عبر الواتساب");
        return;
      }

      setSent(true);
    } catch (sendError) {
      console.error("PARENT REPORT SEND ERROR =>", sendError);
      setError("حدث خطأ أثناء إرسال التقرير عبر الواتساب");
    } finally {
      setSending(false);
    }
  }

  let label = "إرسال التقرير لولي الأمر عبر الواتساب";
  if (!parentWhatsapp) label = "لا يوجد رقم لولي الأمر";
  else if (sent) label = "تم إرسال التقرير لولي الأمر عبر الواتساب";
  else if (sending) label = "جاري الإرسال عبر الواتساب...";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSend}
        disabled={!parentWhatsapp || sent || sending}
        className="w-full rounded-xl bg-[#bd8f2d] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#a97d25] disabled:cursor-not-allowed disabled:bg-[#d8bf83]/60"
      >
        {label}
      </button>
      {error ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
