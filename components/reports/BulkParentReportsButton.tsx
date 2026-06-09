"use client";

import { useState } from "react";

type BulkParentReportsButtonProps = {
  reportIds: string[];
};

type BulkSendResult = {
  sentCount?: number;
  skippedCount?: number;
  failedCount?: number;
  missingPhone?: string[];
  alreadySent?: string[];
  failed?: { studentName: string; error: string }[];
  error?: string;
};

export default function BulkParentReportsButton({
  reportIds,
}: BulkParentReportsButtonProps) {
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (reportIds.length === 0 || isSending) return;

    const confirmed = window.confirm(
      `سيتم إرسال تقارير اليوم للأهل للطلاب الذين لم ترسل تقاريرهم بعد. العدد الحالي: ${reportIds.length}. هل تريد المتابعة؟`
    );

    if (!confirmed) return;

    setIsSending(true);

    try {
      const response = await fetch("/api/reports/bulk-parent-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportIds }),
      });
      const result = (await response.json()) as BulkSendResult;

      if (!response.ok) {
        throw new Error(result.error || "تعذر إرسال التقارير للأهل");
      }

      const notes = [
        `تم الإرسال: ${result.sentCount || 0}`,
        `تم تخطيه: ${result.skippedCount || 0}`,
        `لم يرسل: ${result.failedCount || 0}`,
      ];

      if (result.missingPhone?.length) {
        notes.push(`طلاب بلا أرقام: ${result.missingPhone.join("، ")}`);
      }

      if (result.failed?.length) {
        notes.push(
          `أخطاء الإرسال: ${result.failed
            .map((item) => `${item.studentName}: ${item.error}`)
            .join(" | ")}`
        );
      }

      window.alert(notes.join("\n"));
      window.location.reload();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "تعذر إرسال التقارير للأهل"
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={reportIds.length === 0 || isSending}
      className="rounded-full bg-[#bd8f2d] px-4 py-2 text-sm font-black text-white transition hover:bg-[#a97d25] disabled:cursor-not-allowed disabled:bg-[#d8bf83]/60"
    >
      {isSending ? "جاري الإرسال..." : "إرسال تقارير اليوم للأهل"}
    </button>
  );
}
