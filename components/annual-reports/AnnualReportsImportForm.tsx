"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AnnualReportsImportForm() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const submit = async (formData: FormData) => {
    if (importing) return;

    const dataFile = formData.get("dataFile");
    if (!(dataFile instanceof File) || !dataFile.name) {
      alert("اختر ملف annual_reports.json أولاً");
      return;
    }

    try {
      setImporting(true);
      setSummary(null);
      const response = await fetch("/api/onsite/annual-reports/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر استيراد التقارير");
      }

      setSummary(
        `تم استيراد ${data.imported} تقرير، وربط ${data.matchedStudents} طالب، ورفع ${data.uploadedImages} صورة.`
      );
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر استيراد التقارير");
    } finally {
      setImporting(false);
    }
  };

  return (
    <form
      action={submit}
      className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]"
    >
      <h2 className="text-xl font-black text-[#1c2d31]">استيراد التقارير</h2>
      <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
        ارفع ملف JSON المنظم، ويمكنك اختيار صور PNG بنفس أسماء
        report_image_filename ليتم ربطها تلقائيًا.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm font-black text-[#1c2d31]">
          ملف البيانات JSON
          <input
            name="dataFile"
            type="file"
            accept="application/json,.json"
            className="rounded-2xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-3 text-sm"
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-[#1c2d31]">
          صور التقارير PNG
          <input
            name="images"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="rounded-2xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={importing}
          className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {importing ? "جاري الاستيراد..." : "استيراد"}
        </button>
      </div>
      {summary ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
          {summary}
        </p>
      ) : null}
    </form>
  );
}
