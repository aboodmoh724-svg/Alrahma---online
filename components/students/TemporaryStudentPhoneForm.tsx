"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatSyriaLocalPhone,
  normalizePhoneDigits,
  normalizeSyriaPhone,
} from "@/lib/phone-number";

type TemporaryStudentPhoneFormProps = {
  studentId: string;
  studentName: string;
};

function formatDraft(value: string) {
  const saved = formatSyriaLocalPhone(value);
  if (saved) return saved;

  let digits = normalizePhoneDigits(value);
  if (digits.startsWith("963")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 9);

  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)]
    .filter(Boolean)
    .join(" ");
}

export default function TemporaryStudentPhoneForm({
  studentId,
  studentName,
}: TemporaryStudentPhoneFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;

    const normalized = normalizeSyriaPhone(draft);
    if (!normalized) {
      alert("أدخل رقم واتساب سوري صحيح، مثال: 944 123 456");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/teacher/students/${studentId}/parent-phone`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentWhatsapp: normalized }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر حفظ رقم ولي الأمر");
        return;
      }

      alert("تم حفظ رقم ولي الأمر. يمكن الآن متابعة الطالب.");
      router.refresh();
    } catch (error) {
      console.error("SAVE TEMP STUDENT PHONE ERROR =>", error);
      alert("حدث خطأ أثناء حفظ رقم ولي الأمر");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-black text-amber-900">
        الطالب {studentName} مضاف مؤقتاً
      </p>
      <p className="mt-1 text-xs leading-6 text-amber-800/80">
        أدخل رقم واتساب ولي الأمر أولاً، ثم تظهر خيارات الحضور والتقرير.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row" dir="ltr">
        <span className="flex h-11 shrink-0 items-center rounded-xl bg-white px-3 text-sm font-black text-[#0f5a35] ring-1 ring-amber-200">
          +963
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(formatDraft(event.target.value))}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (!text) return;
            event.preventDefault();
            setDraft(formatDraft(text));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
          }}
          placeholder="9xx xxx xxx"
          className="h-11 min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-left font-mono text-base font-black text-[#1c2d31] outline-none focus:border-[#0f5a35]"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="h-11 rounded-xl bg-[#0f5a35] px-4 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:opacity-60"
        >
          {saving ? "حفظ..." : "حفظ الرقم"}
        </button>
      </div>
    </div>
  );
}
