"use client";

import { useEffect, useMemo, useState } from "react";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
};

type ParsedRow = {
  fullName: string;
  parentWhatsapp?: string;
  parentEmail?: string;
  teacherEmail?: string;
  circleName?: string;
};

type ImportResult =
  | { status: "idle" }
  | { status: "parsing" }
  | {
      status: "ready";
      rows: ParsedRow[];
      meta: {
        totalRows: number;
        detectedHeaderRowIndex: number;
        headers: string[];
        preview: string[][];
      };
    }
  | { status: "importing"; rows: ParsedRow[]; imported: number; failed: number }
  | { status: "done"; imported: number; failed: number };

function normalizeHeader(header: string) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeCell(value: unknown) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .trim();
}

function rowHasData(row: unknown[]) {
  return row.some((cell) => normalizeCell(cell));
}

function scoreHeaderRow(row: unknown[]) {
  const joined = row.map((c) => normalizeHeader(normalizeCell(c))).join(" | ");
  const tokens = [
    "اسم الطالب",
    "الاسم",
    "student",
    "name",
    "واتساب",
    "whatsapp",
    "ولي الأمر",
    "parent",
    "teacher",
    "معلم",
    "الحلقة",
    "circle",
    "email",
    "ايميل",
    "بريد",
  ];
  let score = 0;
  for (const t of tokens) {
    if (joined.includes(normalizeHeader(t))) score += 1;
  }
  return score;
}

function buildColumnIndexMap(headers: string[]) {
  const norm = headers.map((h) => normalizeHeader(h));
  const findIndex = (candidates: string[]) => {
    for (const c of candidates) {
      const idx = norm.findIndex((h) => h === normalizeHeader(c));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  return {
    fullName: findIndex(["fullname", "full name", "اسم الطالب", "الاسم", "student name"]),
    parentWhatsapp: findIndex([
      "parentwhatsapp",
      "parent whatsapp",
      "واتساب ولي الأمر",
      "واتساب",
      "جوال ولي الأمر",
      "رقم ولي الأمر",
      "guardian phone",
      "parent phone",
    ]),
    parentEmail: findIndex([
      "parentemail",
      "parent email",
      "ايميل ولي الأمر",
      "البريد",
      "البريد الإلكتروني",
      "email",
      "guardian email",
    ]),
    teacherEmail: findIndex(["teacheremail", "teacher email", "ايميل المعلم", "teacher mail"]),
    circleName: findIndex(["circlename", "circle name", "اسم الحلقة", "الحلقة", "group"]),
  };
}

export default function OnsiteAdminImportPage() {
  const [result, setResult] = useState<ImportResult>({ status: "idle" });
  const [error, setError] = useState<string>("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [fallbackTeacherId, setFallbackTeacherId] = useState<string>("");
  const [failures, setFailures] = useState<
    { rowIndex: number; fullName: string; reason: string }[]
  >([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("/api/teachers?studyMode=ONSITE", { cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data.teachers) ? (data.teachers as Teacher[]) : [];
        const onsite = list.filter((t) => t.studyMode === "ONSITE" && t.isActive);
        setTeachers(onsite);
        if (!fallbackTeacherId && onsite[0]?.id) {
          setFallbackTeacherId(onsite[0].id);
        }
      } catch {
        setTeachers([]);
      }
    };

    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rowsCount =
    result.status === "ready" || result.status === "importing"
      ? result.rows.length
      : 0;

  const helpText = useMemo(
    () =>
      [
        "الملف المطلوب: Excel (.xlsx).",
        "أعمدة مقترحة (بالترتيب لا يهم):",
        "- fullName أو اسم الطالب",
        "- parentWhatsapp أو واتساب ولي الأمر",
        "- parentEmail (اختياري)",
        "- teacherEmail (اختياري إن أردت ربط الطالب بمعلم بالإيميل)",
        "- circleName (اختياري)",
      ].join("\n"),
    []
  );

  const parseFile = async (file: File) => {
    setError("");
    setFailures([]);
    setResult({ status: "parsing" });

    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setError("الملف لا يحتوي على Sheets");
        setResult({ status: "idle" });
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      // Read as raw rows to handle non-standard header rows / merged cells.
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        setError("لا توجد بيانات داخل الشيت الأول");
        setResult({ status: "idle" });
        return;
      }

      const totalRows = rawRows.length;

      // Detect header row among first 30 rows.
      let bestIndex = -1;
      let bestScore = -1;
      const maxScan = Math.min(30, rawRows.length);
      for (let i = 0; i < maxScan; i += 1) {
        const row = rawRows[i] || [];
        if (!rowHasData(row)) continue;
        const score = scoreHeaderRow(row);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex < 0) {
        setError("تعذر تحديد صف العناوين داخل الملف. تأكد أن أول صف يحتوي أسماء الأعمدة.");
        setResult({ status: "idle" });
        return;
      }

      const headerRow = (rawRows[bestIndex] || []).map((c) => normalizeCell(c));
      const headers = headerRow.map((h, idx) => (h ? h : `عمود ${idx + 1}`));
      const columnIndex = buildColumnIndexMap(headers);

      const dataRows = rawRows.slice(bestIndex + 1).filter(rowHasData);
      const mapped = dataRows.reduce<ParsedRow[]>((rows, row) => {
          const getByIdx = (idx: number) =>
            idx >= 0 ? normalizeCell((row || [])[idx]) : "";

          const fullName = getByIdx(columnIndex.fullName);
          if (!fullName) return rows;

          rows.push({
            fullName,
            parentWhatsapp: getByIdx(columnIndex.parentWhatsapp) || undefined,
            parentEmail: getByIdx(columnIndex.parentEmail) || undefined,
            teacherEmail: getByIdx(columnIndex.teacherEmail) || undefined,
            circleName: getByIdx(columnIndex.circleName) || undefined,
          });

          return rows;
        }, []);

      const preview = dataRows.slice(0, 5).map((row) =>
        headers.map((_, i) => normalizeCell((row || [])[i]))
      );

      if (mapped.length === 0) {
        setError(
          `تم قراءة ${totalRows} صفًا لكن لم ننجح في استخراج أي طالب. غالبًا صف العناوين أو أسماء الأعمدة مختلفة.\n` +
            `تم اكتشاف صف العناوين رقم ${bestIndex + 1}.`
        );
      }

      setResult({
        status: "ready",
        rows: mapped,
        meta: {
          totalRows,
          detectedHeaderRowIndex: bestIndex,
          headers,
          preview,
        },
      });
    } catch (e) {
      console.error("IMPORT PARSE ERROR =>", e);
      setError("تعذر قراءة الملف. تأكد أنه .xlsx");
      setResult({ status: "idle" });
    }
  };

  const importRows = async () => {
    if (result.status !== "ready") return;

    setError("");
    setFailures([]);
    setResult({
      status: "importing",
      rows: result.rows,
      imported: 0,
      failed: 0,
    });

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < result.rows.length; i += 1) {
      const row = result.rows[i];
      try {
        const res = await fetch("/api/admin/onsite/import-students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...row, fallbackTeacherId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          failed += 1;
          const reason =
            typeof data?.error === "string" ? data.error : "فشل غير معروف";
          setFailures((prev) => [
            ...prev,
            { rowIndex: i + 1, fullName: row.fullName, reason },
          ]);
        } else {
          imported += 1;
        }
      } catch {
        failed += 1;
        setFailures((prev) => [
          ...prev,
          { rowIndex: i + 1, fullName: row.fullName, reason: "تعذر الاتصال بالخادم" },
        ]);
      } finally {
        setResult((prev) =>
          prev.status === "importing"
            ? { ...prev, imported, failed }
            : prev
        );
      }
    }

    setResult({ status: "done", imported, failed });
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-[2rem] bg-[#173d42] p-6 text-white shadow-xl">
          <p className="text-sm font-bold text-[#f1d39d]">الإدارة (حضوري)</p>
          <h1 className="mt-2 text-3xl font-black">استيراد الطلاب من Excel</h1>
          <p className="mt-2 text-sm leading-7 text-white/72">
            ارفع ملف Excel ثم راجع عدد الصفوف، وبعدها نفّذ الاستيراد.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <p className="whitespace-pre-line rounded-2xl bg-[#fffaf2] p-4 text-sm leading-7 text-[#1c2d31]/75 ring-1 ring-[#d9c8ad]">
            {helpText}
          </p>

          <div className="mt-4 rounded-[2rem] bg-white p-4 ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-black text-[#1c2d31]">المعلم الافتراضي</p>
            <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
              يستخدم عندما لا يحتوي الصف على teacherEmail أو لا يتم العثور على المعلم.
            </p>
            <select
              value={fallbackTeacherId}
              onChange={(e) => setFallbackTeacherId(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
              disabled={teachers.length === 0}
            >
              {teachers.length === 0 ? (
                <option value="">لا يوجد معلمين حضوريين (أضف معلم أولاً)</option>
              ) : null}
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} - {t.email}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) parseFile(f);
              }}
              className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={importRows}
              disabled={result.status !== "ready"}
              className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
            >
              بدء الاستيراد
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          {result.status === "ready" ? (
            <div className="mt-4 space-y-3 rounded-[2rem] bg-white p-4 ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-black text-[#1c2d31]">
                ملخص قراءة الملف
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm ring-1 ring-[#d9c8ad]">
                  <span className="font-black">إجمالي الصفوف:</span>{" "}
                  {result.meta.totalRows}
                </div>
                <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm ring-1 ring-[#d9c8ad]">
                  <span className="font-black">صف العناوين (تلقائي):</span>{" "}
                  {result.meta.detectedHeaderRowIndex + 1}
                </div>
                <div className="rounded-2xl bg-[#fffaf2] p-3 text-sm ring-1 ring-[#d9c8ad]">
                  <span className="font-black">طلاب مستخرجين:</span>{" "}
                  {result.rows.length}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl ring-1 ring-[#d9c8ad]">
                <table className="min-w-full text-right text-sm">
                  <thead className="bg-[#173d42] text-white">
                    <tr>
                      {result.meta.headers.map((h) => (
                        <th key={h} className="px-3 py-2 font-black">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {result.meta.preview.map((row, idx) => (
                      <tr key={idx} className="border-t border-[#d9c8ad]/40">
                        {row.map((cell, cidx) => (
                          <td key={cidx} className="px-3 py-2 text-[#1c2d31]/75">
                            {cell || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs font-bold text-[#1c2d31]/55">
                المعاينة تعرض أول 5 صفوف بعد صف العناوين الذي تم اكتشافه.
              </p>
            </div>
          ) : null}

          {failures.length > 0 ? (
            <div className="mt-4 rounded-[2rem] bg-red-50 p-4 ring-1 ring-red-200">
              <p className="text-sm font-black text-red-800">
                تفاصيل الفشل ({failures.length})
              </p>
              <div className="mt-3 space-y-2 text-sm text-red-800/90">
                {failures.slice(0, 10).map((f) => (
                  <div
                    key={`${f.rowIndex}-${f.fullName}`}
                    className="rounded-2xl bg-white/70 p-3"
                  >
                    <span className="font-black">#{f.rowIndex}</span> - {f.fullName}
                    <div className="mt-1 text-xs font-bold text-red-700/80">
                      {f.reason}
                    </div>
                  </div>
                ))}
              </div>
              {failures.length > 10 ? (
                <p className="mt-3 text-xs font-bold text-red-700/80">
                  عرضنا أول 10 فقط.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">الصفوف</p>
              <p className="mt-2 text-3xl font-black text-[#173d42]">
                {rowsCount}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">تم استيراد</p>
              <p className="mt-2 text-3xl font-black text-[#1f6358]">
                {result.status === "importing"
                  ? result.imported
                  : result.status === "done"
                    ? result.imported
                    : 0}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d9c8ad]">
              <p className="text-sm font-bold text-[#1c2d31]/55">فشل</p>
              <p className="mt-2 text-3xl font-black text-amber-700">
                {result.status === "importing"
                  ? result.failed
                  : result.status === "done"
                    ? result.failed
                    : 0}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
