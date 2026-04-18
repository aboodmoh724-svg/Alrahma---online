"use client";

import { useState } from "react";

type ParentReportCheckboxProps = {
  reportId: string;
  initialChecked: boolean;
  parentWhatsapp?: string | null;
  studentName: string;
  reportSummary: string;
};

export default function ParentReportCheckbox({
  reportId,
  initialChecked,
  parentWhatsapp,
  studentName,
  reportSummary,
}: ParentReportCheckboxProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [saving, setSaving] = useState(false);

  const handleChange = async (nextChecked: boolean) => {
    if (checked || !nextChecked) {
      return;
    }

    const previousChecked = checked;
    setChecked(nextChecked);
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

      if (!response.ok) {
        setChecked(previousChecked);
        alert("تعذر تحديث حالة إرسال التقرير");
      }
    } catch (error) {
      console.error("PARENT REPORT CHECKBOX ERROR =>", error);
      setChecked(previousChecked);
      alert("حدث خطأ أثناء تحديث حالة إرسال التقرير");
    } finally {
      setSaving(false);
    }
  };

  const normalizedPhone = (parentWhatsapp || "").replace(/[^\d]/g, "");
  const whatsappMessage = `السلام عليكم ورحمة الله وبركاته\nتقرير الطالب: ${studentName}\n${reportSummary}\nمنصة الرحمة لتعليم القرآن الكريم`;
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  return (
    <div className="space-y-2">
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl bg-[#1f6358] px-3 py-2 text-center text-sm font-black text-white transition hover:bg-[#173d42]"
        >
          فتح رسالة واتساب
        </a>
      ) : (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
          لا يوجد رقم ولي أمر
        </p>
      )}
      <label className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
        checked
          ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-800"
          : "cursor-pointer border-[#d9c8ad] text-[#1c2d31] hover:bg-white"
      }`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={saving || checked}
          onChange={(event) => handleChange(event.target.checked)}
          className="h-4 w-4 rounded border-[#d9c8ad] text-[#1f6358]"
        />
        <span>{checked ? "تم إرسال التقرير" : "تأكيد الإرسال لولي الأمر"}</span>
      </label>
    </div>
  );
}
