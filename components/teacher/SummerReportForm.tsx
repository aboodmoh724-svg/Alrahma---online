"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QURAN_SURAHS, SurahMetadata } from "@/lib/quran-metadata";

type StudentInfo = {
  id: string;
  fullName: string;
  summerGroup: string | null;
  circleName?: string;
};

type SummerReportData = {
  id?: string;
  status: "PRESENT" | "ABSENT";
  quranNew?: string | null;
  quranRevision?: string | null;
  quranTaqeen?: string | null;
  noorLearned?: string | null;
  noorHomework?: boolean | null;
  noorHomeworkGrade?: number | null;
  noorParticipation?: number | null;
  behaviorGrade?: number | null;
  behaviorNotes?: string | null;
};

type SummerReportFormProps = {
  student: StudentInfo;
  existingReport?: SummerReportData | null;
  lastPresentReport?: { dateKey?: string | null; quranNew?: string | null; quranTaqeen?: string | null; quranRevision?: string | null; noorLearned?: string | null } | null;
  initialStartProgress?: { startSurah: string; startAyah?: number | null; startPage?: number | null } | null;
  dateKey: string;
};

export default function SummerReportForm({
  student,
  existingReport,
  lastPresentReport,
  initialStartProgress,
  dateKey,
}: SummerReportFormProps) {
  const router = useRouter();
  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

  // Generate available dates from 2026-07-09 up to today, excluding Mondays
  const availableDates: Array<{ dateKey: string; label: string; isToday: boolean }> = [];
  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date();
  const startDate = new Date("2026-07-09");

  const curr = new Date(startDate);
  while (curr <= today) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 1) { // Skip Mondays
      const dateStr = curr.toISOString().split("T")[0];
      const isTodayDate = dateStr === todayStr;
      const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      const dayLabel = `${dayNames[dayOfWeek]} (${dateStr})`;

      availableDates.push({
        dateKey: dateStr,
        label: isTodayDate ? `اليوم - ${dayLabel}` : dayLabel,
        isToday: isTodayDate,
      });
    }
    curr.setDate(curr.getDate() + 1);
  }
  availableDates.reverse();

  const activeDateObj = availableDates.find((d) => d.dateKey === dateKey);
  const activeDateLabel = activeDateObj ? activeDateObj.label : dateKey;

  const [status, setStatus] = useState<"PRESENT" | "ABSENT">(
    existingReport?.status || "PRESENT"
  );

  // Student Start Point with Teacher State (One-time)
  const [startSurahId, setStartSurahId] = useState<number>(78); // Default to An-Naba
  const [startFromAyah, setStartFromAyah] = useState<number>(1);
  const [startSaved, setStartSaved] = useState<boolean>(Boolean(initialStartProgress));
  const [savingStart, setSavingStart] = useState<boolean>(false);
  const [startError, setStartError] = useState<string>("");

  // Quran Dropdowns States
  // 1. New Memorization (Defaults to last present report's Taqeen if available)
  const [newSurahId, setNewSurahId] = useState<number>(78);
  const [newFromAyah, setNewFromAyah] = useState<number>(1);
  const [newEndSurahId, setNewEndSurahId] = useState<number>(78);
  const [newToAyah, setNewToAyah] = useState<number>(10);
  const [quranNew, setQuranNew] = useState(
    existingReport?.quranNew || lastPresentReport?.quranTaqeen || ""
  );

  // 2. Revision
  const [revSurahId, setRevSurahId] = useState<number>(78);
  const [revFromAyah, setRevFromAyah] = useState<number>(1);
  const [revEndSurahId, setRevEndSurahId] = useState<number>(78);
  const [revToAyah, setRevToAyah] = useState<number>(40);
  const [quranRevision, setQuranRevision] = useState(existingReport?.quranRevision || "");

  // 3. Talqeen / Preparation
  const [taqeenSurahId, setTaqeenSurahId] = useState<number>(78);
  const [taqeenFromAyah, setTaqeenFromAyah] = useState<number>(1);
  const [taqeenEndSurahId, setTaqeenEndSurahId] = useState<number>(78);
  const [taqeenToAyah, setTaqeenToAyah] = useState<number>(10);
  const [quranTaqeen, setQuranTaqeen] = useState(existingReport?.quranTaqeen || "");

  // Selected Surah Helpers
  const selectedNewSurah = QURAN_SURAHS.find((s) => s.id === newSurahId) || QURAN_SURAHS[77];
  const selectedNewEndSurah = QURAN_SURAHS.find((s) => s.id === newEndSurahId) || QURAN_SURAHS[77];
  const selectedRevSurah = QURAN_SURAHS.find((s) => s.id === revSurahId) || QURAN_SURAHS[77];
  const selectedRevEndSurah = QURAN_SURAHS.find((s) => s.id === revEndSurahId) || QURAN_SURAHS[77];
  const selectedTaqeenSurah = QURAN_SURAHS.find((s) => s.id === taqeenSurahId) || QURAN_SURAHS[77];
  const selectedTaqeenEndSurah = QURAN_SURAHS.find((s) => s.id === taqeenEndSurahId) || QURAN_SURAHS[77];
  const selectedStartSurah = QURAN_SURAHS.find((s) => s.id === startSurahId) || QURAN_SURAHS[77];

  // Helper: generate range text that supports cross-surah ranges
  const rangeText = (startSurah: SurahMetadata, fromAyah: number, endSurah: SurahMetadata, toAyah: number) => {
    if (startSurah.id === endSurah.id) {
      return `سورة ${startSurah.name} من آية ${fromAyah} إلى ${toAyah}`;
    }
    return `من سورة ${startSurah.name} آية ${fromAyah} إلى سورة ${endSurah.name} آية ${toAyah}`;
  };

  // 'No Item' (لا يوجد) Toggle States for Quran fields
  const [noNewMemorization, setNoNewMemorization] = useState<boolean>(
    existingReport?.quranNew === "لا يوجد حفظ جديد"
  );
  const [noRevision, setNoRevision] = useState<boolean>(
    existingReport?.quranRevision === "لا يوجد مراجعة"
  );
  const [noTaqeen, setNoTaqeen] = useState<boolean>(
    existingReport?.quranTaqeen === "لا يوجد تلقين"
  );

  // Auto-generate text whenever dropdown selections change
  useEffect(() => {
    if (noNewMemorization) {
      setQuranNew("لا يوجد حفظ جديد");
    } else {
      const startS = QURAN_SURAHS.find((s) => s.id === newSurahId) || QURAN_SURAHS[77];
      const endS = QURAN_SURAHS.find((s) => s.id === newEndSurahId) || QURAN_SURAHS[77];
      setQuranNew(rangeText(startS, newFromAyah, endS, newToAyah));
    }
  }, [newSurahId, newFromAyah, newEndSurahId, newToAyah, noNewMemorization]);

  useEffect(() => {
    if (noRevision) {
      setQuranRevision("لا يوجد مراجعة");
    } else {
      const startS = QURAN_SURAHS.find((s) => s.id === revSurahId) || QURAN_SURAHS[77];
      const endS = QURAN_SURAHS.find((s) => s.id === revEndSurahId) || QURAN_SURAHS[77];
      setQuranRevision(rangeText(startS, revFromAyah, endS, revToAyah));
    }
  }, [revSurahId, revFromAyah, revEndSurahId, revToAyah, noRevision]);

  useEffect(() => {
    if (noTaqeen) {
      setQuranTaqeen("لا يوجد تلقين");
    } else {
      const startS = QURAN_SURAHS.find((s) => s.id === taqeenSurahId) || QURAN_SURAHS[77];
      const endS = QURAN_SURAHS.find((s) => s.id === taqeenEndSurahId) || QURAN_SURAHS[77];
      setQuranTaqeen(rangeText(startS, taqeenFromAyah, endS, taqeenToAyah));
    }
  }, [taqeenSurahId, taqeenFromAyah, taqeenEndSurahId, taqeenToAyah, noTaqeen]);

  // Noor Al-Bayan fields
  const [noorLearned, setNoorLearned] = useState(existingReport?.noorLearned || "");
  const [noorHomework, setNoorHomework] = useState<boolean>(
    existingReport?.noorHomework ?? true
  );
  const [noorHomeworkGrade, setNoorHomeworkGrade] = useState<number>(
    existingReport?.noorHomeworkGrade ?? 5
  );
  const [noorParticipation, setNoorParticipation] = useState<number>(
    existingReport?.noorParticipation ?? 5
  );

  // Noor Quran Surah fields (Juz Amma only)
  const JUZ_AMMA_SURAHS = QURAN_SURAHS.filter((s) => s.id >= 78 && s.id <= 114);
  const [noorQuranNewSurah, setNoorQuranNewSurah] = useState<string>(
    existingReport?.quranNew || lastPresentReport?.quranTaqeen || ""
  );
  const [noorQuranRevisionSurah, setNoorQuranRevisionSurah] = useState<string>(
    existingReport?.quranRevision || ""
  );
  const [noorQuranTaqeenSurah, setNoorQuranTaqeenSurah] = useState<string>(
    existingReport?.quranTaqeen || ""
  );

  // Shared fields
  const [behaviorGrade, setBehaviorGrade] = useState<number>(
    existingReport?.behaviorGrade ?? 5
  );
  const [behaviorNotes, setBehaviorNotes] = useState(
    existingReport?.behaviorNotes || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [noorStartPage, setNoorStartPage] = useState<number>(
    initialStartProgress?.startPage || 1
  );

  // Handle Save Student Start Point (One-Time)
  const handleSaveStartPoint = async () => {
    setSavingStart(true);
    setStartError("");
    try {
      const res = await fetch(`/api/students/${student.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startSurah: selectedStartSurah.name,
          startAyah: startFromAyah,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بداية الطالب");

      setStartSaved(true);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "خطأ أثناء حفظ نقطة البداية");
    } finally {
      setSavingStart(false);
    }
  };

  const handleSaveNoorStartPoint = async () => {
    setSavingStart(true);
    setStartError("");
    try {
      const res = await fetch(`/api/students/${student.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startSurah: "نور البيان",
          startPage: noorStartPage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بداية الطالب");

      setStartSaved(true);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "خطأ أثناء حفظ نقطة البداية");
    } finally {
      setSavingStart(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validation: When status is PRESENT, required report fields MUST be filled
    if (status === "PRESENT") {
      if (isNoor) {
        if (!noorLearned || !noorLearned.trim()) {
          setError("⚠️ عند اختيار حالة (حاضر)، يجب تعبئة خانة (ماذا تعلم اليوم) لطلاب نور البيان قبل الحفظ.");
          setLoading(false);
          return;
        }
      } else {
        if (!quranNew || !quranNew.trim()) {
          setError("⚠️ عند اختيار حالة (حاضر)، يجب تعبئة خانة (الحفظ الجديد) لطلاب القرآن الكريم قبل الحفظ.");
          setLoading(false);
          return;
        }
      }
    }

    try {
      const res = await fetch("/api/summer/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          dateKey,
          status,
          quranNew: isNoor ? (noorQuranNewSurah || undefined) : quranNew,
          quranRevision: isNoor ? (noorQuranRevisionSurah || undefined) : quranRevision,
          quranTaqeen: isNoor ? (noorQuranTaqeenSurah || undefined) : quranTaqeen,
          noorLearned: isNoor ? noorLearned : undefined,
          noorHomework: isNoor ? noorHomework : undefined,
          noorHomeworkGrade: isNoor ? noorHomeworkGrade : undefined,
          noorParticipation: isNoor ? noorParticipation : undefined,
          behaviorGrade,
          behaviorNotes: behaviorNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء حفظ التقرير");
      }

      setSuccess(true);
      // Auto-redirect to teacher dashboard after 1.2s
      setTimeout(() => {
        router.push(`/onsite/summer/teacher?dateKey=${dateKey}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 dir-rtl" dir="rtl">
      {/* 1️⃣ STUDENT INFO WORKSPACE CARD */}
      <div className="bg-white rounded-xl border border-[#E5E3DF] p-5 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${
                isNoor
                  ? "bg-[#D97706]/10 text-[#92400E]"
                  : "bg-[#0C5C5E]/10 text-[#0C5C5E]"
              }`}>
                {isNoor ? "📘 طالب نور البيان" : "📖 طالب قرآن كريم"}
              </span>
              {student.circleName && (
                <span className="text-[12px] text-[#6B7280]">
                  حلقة: {student.circleName}
                </span>
              )}
              {existingReport && (
                <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[11px] font-bold px-2 py-0.5 rounded-md">
                  تعديل تقرير رُصِد مسبقاً
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#1F2937] mt-1">
              {student.fullName}
            </h2>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-[#F7F5F0] px-3 py-1.5 rounded-lg border border-[#E5E3DF] shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0C5C5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <select
              value={dateKey}
              onChange={(e) =>
                router.push(`/onsite/summer/teacher/reports/${student.id}?dateKey=${e.target.value}`)
              }
              className="bg-transparent text-[12px] font-bold text-[#0C5C5E] outline-none cursor-pointer"
            >
              {availableDates.map((d) => (
                <option key={d.dateKey} value={d.dateKey}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Smart Pre-fill Suggestion info if available */}
        {!existingReport && lastPresentReport && (
          <div className="bg-[#EDF5F4] border border-[#0C5C5E]/15 rounded-lg p-3 text-[12px] text-[#0C5C5E] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>تم الاقتراح تلقائياً استناداً لآخر تقرير حضور ({lastPresentReport.dateKey}):</span>
            </div>
            {!isNoor ? (
              <p className="text-[#374151]">
                الحفظ الجديد المقترح: <b>{lastPresentReport.quranTaqeen || "—"}</b> | المراجعة المقترحة: <b>{lastPresentReport.quranNew || "—"}</b>
              </p>
            ) : (
              <p className="text-[#374151]">
                الدرس السابق: <b>{lastPresentReport.noorLearned || "—"}</b>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 📌 OPTIONAL ONE-TIME START POINT REGISTRATION CARD FOR QURAN TRACK */}
      {!isNoor && !startSaved && (
        <div className="bg-[#FEF3C7]/40 rounded-xl border border-[#D97706]/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-[12px] font-bold">📌</span>
              <h3 className="text-[14px] font-bold font-heading text-[#92400E]">
                تسجيل بداية الطالب مع المعلم (اختياري - مرة واحدة):
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded">
              لإحصائيات الإشراف
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 bg-white p-3 rounded-lg border border-[#E5E3DF]">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">بداية سورة:</label>
              <select
                value={startSurahId}
                onChange={(e) => setStartSurahId(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none"
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">بداية آية:</label>
              <input
                type="number"
                min={1}
                max={selectedStartSurah.versesCount}
                value={startFromAyah}
                onChange={(e) => setStartFromAyah(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveStartPoint}
            disabled={savingStart}
            className="w-full sm:w-auto bg-[#D97706] text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-[#B45309] transition disabled:opacity-50"
          >
            {savingStart ? "جاري الحفظ..." : "💾 حفظ نقطة بداية الطالب"}
          </button>
          {startError && <p className="text-[12px] font-bold text-red-600">{startError}</p>}
        </div>
      )}

      {/* 📌 OPTIONAL ONE-TIME START POINT REGISTRATION CARD FOR NOOR AL-BAYAN TRACK */}
      {isNoor && !startSaved && (
        <div className="bg-[#EFF6FF] rounded-xl border border-[#3B82F6]/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center text-[12px] font-bold">📌</span>
              <h3 className="text-[14px] font-bold font-heading text-[#1E40AF]">
                تسجيل بداية الطالب في كتاب (نور البيان):
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#3B82F6] bg-blue-50 px-2 py-0.5 rounded">
              لإحصائيات الإشراف
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#E5E3DF]">
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">بداية الصفحة بكتاب نور البيان:</label>
            <input
              type="number"
              min={1}
              max={150}
              value={noorStartPage}
              onChange={(e) => setNoorStartPage(Number(e.target.value))}
              className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveNoorStartPoint}
            disabled={savingStart}
            className="w-full sm:w-auto bg-[#3B82F6] text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-[#2563EB] transition disabled:opacity-50"
          >
            {savingStart ? "جاري الحفظ..." : `💾 حفظ بداية الطالب (صفحة ${noorStartPage})`}
          </button>
          {startError && <p className="text-[12px] font-bold text-red-600">{startError}</p>}
        </div>
      )}

      {/* 2️⃣ ATTENDANCE SELECTOR */}
      <div className="bg-white rounded-xl border border-[#E5E3DF] p-5 shadow-xs space-y-3">
        <label className="block text-[14px] font-bold font-heading text-[#1F2937]">
          اختيار حالة الحضور والغياب:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus("PRESENT")}
            className={`h-13 rounded-xl border-2 font-bold text-[14px] transition-all duration-200 ease-out flex items-center justify-center gap-2 ${
              status === "PRESENT"
                ? "border-[#059669] bg-[#D1FAE5] text-[#065F46] shadow-xs"
                : "border-[#E5E3DF] bg-white text-[#6B7280] hover:bg-[#F7F5F0]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>🟢 حاضر في الحلقة</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus("ABSENT")}
            className={`h-13 rounded-xl border-2 font-bold text-[14px] transition-all duration-200 ease-out flex items-center justify-center gap-2 ${
              status === "ABSENT"
                ? "border-[#DC2626] bg-[#FEE2E2] text-[#991B1B] shadow-xs"
                : "border-[#E5E3DF] bg-white text-[#6B7280] hover:bg-[#F7F5F0]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>🔴 غائب</span>
          </button>
        </div>
      </div>

      {/* 3️⃣ LESSON CONTENT CARDS (When PRESENT) */}
      {status === "PRESENT" ? (
        !isNoor ? (
          /* QURAN TRACK LESSON CARDS */
          <div className="space-y-4">
            {/* CARD A: NEW MEMORIZATION */}
            <div className="bg-[#EDF5F4] rounded-xl border border-[#0C5C5E]/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#0C5C5E] text-white flex items-center justify-center text-[12px] font-bold">📖</span>
                  <h3 className="text-[15px] font-bold font-heading text-[#0C5C5E]">
                    الحفظ الجديد (مطلوب)
                  </h3>
                </div>

                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noNewMemorization}
                    onChange={(e) => setNoNewMemorization(e.target.checked)}
                    className="w-4 h-4 accent-[#0C5C5E] rounded"
                  />
                  <span>لا يوجد حفظ جديد اليوم</span>
                </label>
              </div>

              {!noNewMemorization && (
                <div className="grid gap-3 sm:grid-cols-2 bg-white p-3.5 rounded-lg border border-[#E5E3DF]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">من سورة:</label>
                    <select
                      value={newSurahId}
                      onChange={(e) => setNewSurahId(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">من آية:</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedNewSurah.versesCount}
                      value={newFromAyah}
                      onChange={(e) => setNewFromAyah(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">إلى سورة:</label>
                    <select
                      value={newEndSurahId}
                      onChange={(e) => setNewEndSurahId(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">إلى آية:</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedNewEndSurah.versesCount}
                      value={newToAyah}
                      onChange={(e) => setNewToAyah(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CARD B: REVISION */}
            <div className="bg-[#FEF3C7]/40 rounded-xl border border-[#D97706]/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-[12px] font-bold">🔄</span>
                  <h3 className="text-[15px] font-bold font-heading text-[#92400E]">
                    المراجعة اليومية
                  </h3>
                </div>

                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noRevision}
                    onChange={(e) => setNoRevision(e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded"
                  />
                  <span>لا يوجد مراجعة اليوم</span>
                </label>
              </div>

              {!noRevision && (
                <div className="grid gap-3 sm:grid-cols-2 bg-white p-3.5 rounded-lg border border-[#E5E3DF]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">من سورة:</label>
                    <select
                      value={revSurahId}
                      onChange={(e) => setRevSurahId(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none focus:border-[#D97706]"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">من آية:</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedRevSurah.versesCount}
                      value={revFromAyah}
                      onChange={(e) => setRevFromAyah(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none focus:border-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">إلى سورة:</label>
                    <select
                      value={revEndSurahId}
                      onChange={(e) => setRevEndSurahId(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none focus:border-[#D97706]"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">إلى آية:</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedRevEndSurah.versesCount}
                      value={revToAyah}
                      onChange={(e) => setRevToAyah(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CARD C: TALQEEN / PREPARATION */}
            <div className="bg-[#EFF6FF] rounded-xl border border-[#3B82F6]/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center text-[12px] font-bold">🗣️</span>
                  <h3 className="text-[15px] font-bold font-heading text-[#1E40AF]">
                    التلقين والتحضير للغد
                  </h3>
                </div>

                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6B7280] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noTaqeen}
                    onChange={(e) => setNoTaqeen(e.target.checked)}
                    className="w-4 h-4 accent-[#3B82F6] rounded"
                  />
                  <span>لا يوجد تلقين</span>
                </label>
              </div>

              {!noTaqeen && (
                <div className="grid gap-3 sm:grid-cols-2 bg-white p-3.5 rounded-lg border border-[#E5E3DF]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">من سورة:</label>
                    <select
                      value={taqeenSurahId}
                      onChange={(e) => setTaqeenSurahId(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none focus:border-[#3B82F6]"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">من آية:</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedTaqeenSurah.versesCount}
                      value={taqeenFromAyah}
                      onChange={(e) => setTaqeenFromAyah(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">إلى سورة:</label>
                    <select
                      value={taqeenEndSurahId}
                      onChange={(e) => setTaqeenEndSurahId(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-semibold text-[#1F2937] outline-none focus:border-[#3B82F6]"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">إلى آية:</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedTaqeenEndSurah.versesCount}
                      value={taqeenToAyah}
                      onChange={(e) => setTaqeenToAyah(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[13px] font-bold text-[#1F2937] outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NOOR AL-BAYAN TRACK LESSON CARDS (INCLUDING JUZ AMMA SURAH PICKERS) */
          <div className="space-y-4">
            {/* JUZ AMMA SURAH PICKERS FOR NOOR AL-BAYAN */}
            <div className="bg-[#EDF5F4] rounded-xl border border-[#0C5C5E]/20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0C5C5E] text-white flex items-center justify-center text-[12px] font-bold">📖</span>
                <h3 className="text-[15px] font-bold font-heading text-[#0C5C5E]">
                  قرآن جزء عم (لطلاب نور البيان)
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 bg-white p-3.5 rounded-lg border border-[#E5E3DF]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">📖 حفظ جزء عم:</label>
                  <select
                    value={noorQuranNewSurah}
                    onChange={(e) => setNoorQuranNewSurah(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[12px] font-semibold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                  >
                    <option value="">-- اختر السورة --</option>
                    {JUZ_AMMA_SURAHS.map((s) => (
                      <option key={s.id} value={`سورة ${s.name}`}>سورة {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">🔄 مراجعة جزء عم:</label>
                  <select
                    value={noorQuranRevisionSurah}
                    onChange={(e) => setNoorQuranRevisionSurah(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[12px] font-semibold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                  >
                    <option value="">-- اختر السورة --</option>
                    {JUZ_AMMA_SURAHS.map((s) => (
                      <option key={s.id} value={`سورة ${s.name}`}>سورة {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">🎤 تلقين جزء عم:</label>
                  <select
                    value={noorQuranTaqeenSurah}
                    onChange={(e) => setNoorQuranTaqeenSurah(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E3DF] p-2 text-[12px] font-semibold text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                  >
                    <option value="">-- اختر السورة --</option>
                    {JUZ_AMMA_SURAHS.map((s) => (
                      <option key={s.id} value={`سورة ${s.name}`}>سورة {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* NOOR AL-BAYAN BOOK LESSON DETAILS */}
            <div className="bg-white rounded-xl border border-[#E5E3DF] p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-[12px] font-bold">📘</span>
                <h3 className="text-[15px] font-bold font-heading text-[#92400E]">
                  متابعة كتاب نور البيان والتمهيدي
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#1F2937] mb-1">الدرس المشروح اليوم (مطلوب):</label>
                  <input
                    type="text"
                    placeholder="مثال: حركة الفتح والكسر مع أمثلة الحروف ص 12"
                    value={noorLearned}
                    onChange={(e) => setNoorLearned(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E3DF] p-2.5 text-[13px] font-medium text-[#1F2937] outline-none focus:border-[#0C5C5E]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#374151] mb-1">تسليم الواجب:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNoorHomework(true)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 ease-out ${
                          noorHomework ? "bg-[#0C5C5E] text-white" : "bg-[#F7F5F0] text-[#6B7280] border border-[#E5E3DF]"
                        }`}
                      >
                        نعم (تم التسليم)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoorHomework(false)}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 ease-out ${
                          !noorHomework ? "bg-[#DC2626] text-white" : "bg-[#F7F5F0] text-[#6B7280] border border-[#E5E3DF]"
                        }`}
                      >
                        لا (لم يسلم)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#374151] mb-1">درجة الواجب (من 5):</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNoorHomeworkGrade(star)}
                          className={`h-9 flex-1 rounded-lg border text-[12px] font-bold transition-all duration-200 ease-out ${
                            noorHomeworkGrade === star
                              ? "border-[#D97706] bg-[#FEF3C7] text-[#92400E]"
                              : "border-[#E5E3DF] bg-white text-[#6B7280]"
                          }`}
                        >
                          {star} ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#374151] mb-1">المشاركة والتفاعل (من 5):</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNoorParticipation(star)}
                        className={`h-9 flex-1 rounded-lg border text-[12px] font-bold transition-all duration-200 ease-out ${
                          noorParticipation === star
                            ? "border-[#0C5C5E] bg-[#EDF5F4] text-[#0C5C5E]"
                            : "border-[#E5E3DF] bg-white text-[#6B7280]"
                        }`}
                      >
                        {star} ⭐
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* ABSENT NOTICE CARD */
        <div className="bg-[#FEE2E2]/30 rounded-xl border border-[#FECACA] p-5 text-center space-y-1">
          <p className="text-[14px] font-bold text-[#991B1B]">
            الطالب مسجّل (غائب) عن حلقة اليوم
          </p>
          <p className="text-[12px] text-[#7F1D1D]">
            يمكنك حفظ التقرير مباشرة لتثبيت غياب الطالب في النظام.
          </p>
        </div>
      )}

      {/* 4️⃣ EVALUATION & BEHAVIOR NOTES CARD */}
      <div className="bg-white rounded-xl border border-[#E5E3DF] p-5 shadow-xs space-y-4">
        <h3 className="text-[15px] font-bold font-heading text-[#1F2937]">
          التقييم السلوكي والملاحظات
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">التقييم السلوكي والانضباط:</label>
            <div className="flex gap-1.5">
              {[
                { grade: 5, label: "5 - ممتاز ⭐" },
                { grade: 4, label: "4 - جيد جداً" },
                { grade: 3, label: "3 - جيد" },
                { grade: 2, label: "2 - مقبول" },
                { grade: 1, label: "1 - متابعة" },
              ].map((item) => (
                <button
                  key={item.grade}
                  type="button"
                  onClick={() => setBehaviorGrade(item.grade)}
                  className={`h-10 flex-1 rounded-lg border text-[12px] font-bold transition-all duration-200 ease-out flex items-center justify-center ${
                    behaviorGrade === item.grade
                      ? "border-[#D97706] bg-[#FEF3C7] text-[#92400E] shadow-xs"
                      : "border-[#E5E3DF] bg-white text-[#6B7280] hover:bg-[#F7F5F0]"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">ملاحظات المعلم السلوكية والتوجيهية (اختياري):</label>
            <textarea
              rows={3}
              placeholder="اكتب أي ملاحظة تشجيعية أو توجيهات للأهل..."
              value={behaviorNotes}
              onChange={(e) => setBehaviorNotes(e.target.value)}
              className="w-full rounded-lg border border-[#E5E3DF] p-3 text-[13px] text-[#1F2937] outline-none focus:border-[#0C5C5E] resize-none"
            />
          </div>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-[13px] font-bold p-4 rounded-xl flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS ISLAMIC TOAST */}
      {success && (
        <div className="bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-[14px] font-bold p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>جزاك الله خيراً، تم حفظ التقرير بنجاح! جارٍ الانتقال...</span>
          </div>
        </div>
      )}

      {/* 5️⃣ PRIMARY SUBMIT ACTION BUTTON */}
      <button
        type="submit"
        disabled={loading || success}
        className="w-full bg-[#0C5C5E] text-white hover:bg-[#0A4D4F] font-bold py-3.5 rounded-xl shadow-xs transition-all duration-200 ease-out text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>جاري حفظ التقرير...</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>{existingReport ? "حفظ التعديلات وتحديث التقرير اليومي ➔" : "حفظ التقرير اليومي ➔"}</span>
          </>
        )}
      </button>
    </form>
  );
}
