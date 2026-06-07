"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AnnualReportActionsProps = {
  reportId: string;
  reviewStatus: "REVIEW" | "APPROVED" | "SENT";
  hasImage: boolean;
  hasParentPhone: boolean;
};

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "تعذر تنفيذ العملية");
  }

  return data;
}

export default function AnnualReportActions({
  reportId,
  reviewStatus,
  hasImage,
  hasParentPhone,
}: AnnualReportActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "send" | null>(null);

  const approve = async () => {
    if (busy || reviewStatus === "SENT") return;

    const confirmed = window.confirm("هل تعتمد هذا التقرير السنوي للإرسال؟");
    if (!confirmed) return;

    try {
      setBusy("approve");
      await requestJson(`/api/onsite/annual-reports/${reportId}/approve`, {
        method: "PATCH",
      });
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر اعتماد التقرير");
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (busy || reviewStatus !== "APPROVED") return;

    if (!hasImage) {
      alert("لا توجد صورة مرفوعة لهذا التقرير");
      return;
    }

    if (!hasParentPhone) {
      alert("لا يوجد رقم واتساب صالح لولي الأمر");
      return;
    }

    const confirmed = window.confirm(
      "سيتم إرسال صورة التقرير إلى ولي الأمر عبر واتساب مرة واحدة فقط. هل تريد المتابعة؟"
    );
    if (!confirmed) return;

    try {
      setBusy("send");
      await requestJson(`/api/onsite/annual-reports/${reportId}/send`, {
        method: "POST",
      });
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر إرسال التقرير");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-2">
      {reviewStatus === "REVIEW" ? (
        <button
          type="button"
          onClick={approve}
          disabled={Boolean(busy)}
          className="rounded-2xl bg-[#0f5a35] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "approve" ? "جاري الاعتماد..." : "اعتماد التقرير"}
        </button>
      ) : null}

      {reviewStatus === "APPROVED" ? (
        <button
          type="button"
          onClick={send}
          disabled={Boolean(busy)}
          className="rounded-2xl bg-[#bd8f2d] px-4 py-3 text-sm font-black text-white transition hover:bg-[#a77d24] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "send" ? "جاري الإرسال..." : "إرسال لولي الأمر"}
        </button>
      ) : null}

      {reviewStatus === "SENT" ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
          تم الإرسال
        </div>
      ) : null}
    </div>
  );
}
