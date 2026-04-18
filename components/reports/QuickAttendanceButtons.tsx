"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuickAttendanceButtonsProps = {
  studentId: string;
};

export default function QuickAttendanceButtons({
  studentId,
}: QuickAttendanceButtonsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"PRESENT" | "ABSENT" | "">("");

  const submit = async (status: "PRESENT" | "ABSENT") => {
    if (submitting) return;

    setSubmitting(status);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          status,
          attendanceOnly: true,
          lessonName: status === "ABSENT" ? "غياب" : "حضور",
          lessonSurah: "",
          homework: "-",
          nextHomework: "",
          nextLessonHomework: "",
          nextReviewHomework: "",
          note: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "تعذر حفظ التحضير");
        return;
      }

      if (data?.whatsapp?.attempted && data?.whatsapp?.sent === false) {
        alert(
          `تم حفظ التحضير لكن تعذر إرسال واتساب تلقائيًا.\nالسبب: ${
            data.whatsapp.error || "غير معروف"
          }`
        );
      }

      router.refresh();
    } catch (error) {
      console.error("QUICK ATTENDANCE ERROR =>", error);
      alert("حدث خطأ أثناء حفظ التحضير");
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => submit("PRESENT")}
        disabled={Boolean(submitting)}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting === "PRESENT" ? "جاري الحفظ..." : "حاضر"}
      </button>
      <button
        type="button"
        onClick={() => submit("ABSENT")}
        disabled={Boolean(submitting)}
        className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting === "ABSENT" ? "جاري الحفظ..." : "غائب"}
      </button>
    </div>
  );
}

