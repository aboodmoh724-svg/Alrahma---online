"use client";

import { useState } from "react";

type ParentReportCheckboxProps = {
  reportId: string;
  initialChecked: boolean;
  parentWhatsapp?: string | null;
};

export default function ParentReportCheckbox({
  reportId,
  initialChecked,
  parentWhatsapp,
}: ParentReportCheckboxProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [saving, setSaving] = useState(false);

  const handleSendWhatsApp = async () => {
    if (checked || saving) {
      return;
    }

    const previousChecked = checked;
    setChecked(true);
    setSaving(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/parent-sent`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sentToParent: true,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setChecked(previousChecked);
        alert(data.error || "تعذر إرسال التقرير عبر واتساب");
      }
    } catch (error) {
      console.error("PARENT REPORT WHATSAPP ERROR =>", error);
      setChecked(previousChecked);
      alert("حدث خطأ أثناء إرسال التقرير عبر واتساب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {parentWhatsapp ? (
        <button
          type="button"
          onClick={handleSendWhatsApp}
          disabled={saving || checked}
          className="block w-full rounded-xl bg-[#1f6358] px-3 py-2 text-center text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checked ? "تم إرسال الواتساب" : saving ? "جاري الإرسال..." : "إرسال عبر واتساب"}
        </button>
      ) : (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
          لا يوجد رقم واتساب لولي الأمر
        </p>
      )}
      <div
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
          checked
            ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-[#d9c8ad] text-[#1c2d31]"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="h-4 w-4 rounded border-[#d9c8ad] text-[#1f6358]"
        />
        <span>{checked ? "تم إرسال التقرير" : "لم يتم إرسال التقرير بعد"}</span>
      </div>
    </div>
  );
}
