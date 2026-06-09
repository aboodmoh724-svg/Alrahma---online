"use client";

import { useState } from "react";

type ParentReportSendButtonProps = {
  reportId: string;
  initialSent: boolean;
  parentWhatsapp?: string | null;
};

function cleanMessage(value: unknown) {
  const text = String(value || "").trim();

  if (!text) return "تعذر إرسال التقرير عبر واتساب";
  if (/<!doctype html>|<html/i.test(text)) {
    return "تعذر إرسال التقرير عبر واتساب. أعاد الخادم صفحة غير متوقعة.";
  }

  return text;
}

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(cleanMessage(data.error));
      }

      setSent(true);
    } catch (sendError) {
      setError(cleanMessage(sendError instanceof Error ? sendError.message : sendError));
    } finally {
      setSending(false);
    }
  }

  let label = "إرسال هذا التقرير";
  if (!parentWhatsapp) label = "لا يوجد رقم لولي الأمر";
  else if (sent) label = "تم الإرسال لولي الأمر";
  else if (sending) label = "جاري الإرسال...";

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
        <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
