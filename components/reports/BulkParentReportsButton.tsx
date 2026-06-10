"use client";

import { useState } from "react";

type BulkParentReportsButtonProps = {
  reportIds: string[];
  totalStudents: number;
  completedReports: number;
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

function cleanAlertMessage(value: unknown) {
  const text = String(value || "").trim();

  if (!text) return "تعذر إرسال التقارير للأهل";
  if (/<!doctype html>|<html/i.test(text)) {
    return "تعذر إرسال التقارير للأهل. أعاد الخادم صفحة غير متوقعة.";
  }

  return text;
}

export default function BulkParentReportsButton({
  reportIds,
  totalStudents,
  completedReports,
}: BulkParentReportsButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const allReportsCompleted = totalStudents > 0 && completedReports === totalStudents;
  const hasPendingReports = reportIds.length > 0;
  const disabled = isSending || !allReportsCompleted || !hasPendingReports;

  async function handleSend() {
    if (isSending) return;

    if (!allReportsCompleted) {
      window.alert("لا يمكن الإرسال الجماعي حتى تكتمل تقارير جميع طلاب الحلقة.");
      return;
    }

    if (!hasPendingReports) {
      window.alert("لا توجد تقارير غير مرسلة في هذه الحلقة.");
      return;
    }

    const confirmed = window.confirm(
      `سيتم إرسال تقارير اليوم غير المرسلة للأهل. العدد: ${reportIds.length}. هل تريد المتابعة؟`
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
        throw new Error(cleanAlertMessage(result.error));
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
          `حدث خطأ أثناء إرسال التقرير لهؤلاء الطلاب: ${result.failed
            .map((item) => item.studentName)
            .join("، ")}`
        );
      }

      window.alert(notes.join("\n"));
      window.location.reload();
    } catch (error) {
      window.alert(cleanAlertMessage(error instanceof Error ? error.message : error));
    } finally {
      setIsSending(false);
    }
  }

  let label = "إرسال جميع التقارير لأولياء الأمور عبر الواتساب";
  if (isSending) label = "جاري الإرسال...";
  else if (!allReportsCompleted) label = "أكمل تقارير الحلقة أولاً";
  else if (!hasPendingReports) label = "تم إرسال تقارير الحلقة";

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={disabled}
      title={
        allReportsCompleted
          ? "إرسال تقارير اليوم غير المرسلة لأولياء الأمور عبر الواتساب"
          : "يظهر الإرسال الجماعي بعد اكتمال تقارير جميع الطلاب"
      }
      className="rounded-full bg-[#bd8f2d] px-4 py-2 text-sm font-black text-white transition hover:bg-[#a97d25] disabled:cursor-not-allowed disabled:bg-[#d8bf83]/60"
    >
      {label}
    </button>
  );
}
