"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AnnualReportsBulkSendButtonProps = {
  circleId?: string;
  label: string;
  disabled?: boolean;
};

export function AnnualReportsBulkSendButton({
  circleId,
  label,
  disabled,
}: AnnualReportsBulkSendButtonProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  const sendBulk = async () => {
    if (sending || disabled) return;

    const confirmed = window.confirm(
      "سيتم إرسال التقارير المعتمدة غير المرسلة فقط، ولن يعاد إرسال أي تقرير سبق إرساله. هل تريد المتابعة؟"
    );
    if (!confirmed) return;

    try {
      setSending(true);
      const response = await fetch("/api/onsite/annual-reports/send-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ circleId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر الإرسال الجماعي");
      }

      alert(
        `تم إرسال ${data.sentCount} تقرير.\nتعذر إرسال ${data.failedCount} تقرير.`
      );
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر الإرسال الجماعي");
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={sendBulk}
      disabled={disabled || sending}
      className="rounded-2xl bg-[#bd8f2d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#a77d24] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {sending ? "جاري الإرسال..." : label}
    </button>
  );
}
