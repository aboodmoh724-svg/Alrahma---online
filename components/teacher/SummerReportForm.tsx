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
  initialStartProgress?: { startSurah: string; startAyah?: number | null; startPage?: number | null } | null;
  dateKey: string;
};

export default function SummerReportForm({
  student,
  existingReport,
  initialStartProgress,
  dateKey,
}: SummerReportFormProps) {
  const router = useRouter();
  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

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
  // 1. New Memorization
  const [newSurahId, setNewSurahId] = useState<number>(78);
  const [newFromAyah, setNewFromAyah] = useState<number>(1);
  const [newToAyah, setNewToAyah] = useState<number>(10);
  const [quranNew, setQuranNew] = useState(existingReport?.quranNew || "");

  // 2. Revision
  const [revSurahId, setRevSurahId] = useState<number>(78);
  const [revFromAyah, setRevFromAyah] = useState<number>(1);
  const [revToAyah, setRevToAyah] = useState<number>(40);
  const [quranRevision, setQuranRevision] = useState(existingReport?.quranRevision || "");

  // 3. Talqeen / Preparation
  const [taqeenSurahId, setTaqeenSurahId] = useState<number>(78);
  const [taqeenFromAyah, setTaqeenFromAyah] = useState<number>(1);
  const [taqeenToAyah, setTaqeenToAyah] = useState<number>(10);
  const [quranTaqeen, setQuranTaqeen] = useState(existingReport?.quranTaqeen || "");

  // Update text representations when dropdowns change (only if not pre-existing)
  const selectedNewSurah = QURAN_SURAHS.find((s) => s.id === newSurahId) || QURAN_SURAHS[77];
  const selectedRevSurah = QURAN_SURAHS.find((s) => s.id === revSurahId) || QURAN_SURAHS[77];
  const selectedTaqeenSurah = QURAN_SURAHS.find((s) => s.id === taqeenSurahId) || QURAN_SURAHS[77];
  const selectedStartSurah = QURAN_SURAHS.find((s) => s.id === startSurahId) || QURAN_SURAHS[77];

  const applyNewMemorizationFormat = () => {
    setQuranNew(`سورة ${selectedNewSurah.name} من آية ${newFromAyah} إلى ${newToAyah}`);
  };

  const applyRevisionFormat = () => {
    setQuranRevision(`سورة ${selectedRevSurah.name} من آية ${revFromAyah} إلى ${revToAyah}`);
  };

  const applyTaqeenFormat = () => {
    setQuranTaqeen(`سورة ${selectedTaqeenSurah.name} من آية ${taqeenFromAyah} إلى ${taqeenToAyah}`);
  };

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

    try {
      const res = await fetch("/api/summer/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          dateKey,
          status,
          quranNew: isNoor ? undefined : quranNew,
          quranRevision: isNoor ? undefined : quranRevision,
          quranTaqeen: isNoor ? undefined : quranTaqeen,
          noorLearned: isNoor ? noorLearned : undefined,
          noorHomework: isNoor ? noorHomework : undefined,
          noorHomeworkGrade: isNoor ? noorHomeworkGrade : undefined,
          noorParticipation: isNoor ? noorParticipation : undefined,
          behaviorGrade,
          behaviorNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل حفظ التقرير");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/onsite/summer/teacher");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غامض");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#d8bf83]/50 bg-[#fffaf4] p-6 shadow-md dir-rtl"
      dir="rtl"
    >
      {/* Header Info */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#d8bf83]/30 pb-4">
        <div>
          <span className="inline-block rounded-full bg-[#0f5a35]/10 px-3 py-1 text-xs font-black text-[#0f5a35]">
            {isNoor ? "📘 طالب نور البيان" : "📖 طالب قرآن كريم"}
          </span>
          <h2 className="mt-1 text-2xl font-black text-[#0f5a35]">
            {student.fullName}
          </h2>
          {student.circleName && (
            <p className="text-sm font-bold text-[#bd8f2d]">
              الحلقة: {student.circleName}
            </p>
          )}
        </div>
        <div className="text-left text-sm font-bold text-[#18322a]/60">
          تاريخ التقرير: <span className="font-mono text-[#0f5a35]">{dateKey}</span>
        </div>
      </div>

      {/* 📌 Optional One-Time Start Point Registration for Quran Students */}
      {!isNoor && !startSaved && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-[#bd8f2d] bg-[#fdf9f0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0b4231] font-serif flex items-center gap-1.5">
              📌 تسجيل بداية الطالب مع المعلم (مرة واحدة عند التحاق الطالب):
            </h3>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              إحصائية الإشراف
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-600">
            حدد أين بدأ الطالب معك في الدورة الصيفية (تختفي هذه الخانة تلقائياً بعد حفظها لمرة واحدة):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-[#0b4231] block mb-1">اسم السورة:</label>
              <select
                value={startSurahId}
                onChange={(e) => {
                  setStartSurahId(Number(e.target.value));
                  setStartFromAyah(1);
                }}
                className="w-full rounded-xl border border-[#d8bf83] bg-white p-2.5 text-xs font-bold outline-none"
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. سورة {s.name} ({s.versesCount} آية)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#0b4231] block mb-1">من الآية رقم:</label>
              <select
                value={startFromAyah}
                onChange={(e) => setStartFromAyah(Number(e.target.value))}
                className="w-full rounded-xl border border-[#d8bf83] bg-white p-2.5 text-xs font-bold outline-none"
              >
                {Array.from({ length: selectedStartSurah.versesCount }, (_, i) => i + 1).map((a) => (
                  <option key={a} value={a}>
                    الآية {a}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveStartPoint}
              disabled={savingStart}
              className="rounded-xl bg-[#bd8f2d] px-4 py-2.5 text-xs font-black text-[#0b4231] hover:bg-[#d8bf83] disabled:opacity-50 font-serif"
            >
              {savingStart ? "جاري الحفظ..." : "💾 حفظ نقطة البداية"}
            </button>
          </div>
          {startError && <div className="text-xs font-bold text-red-600">{startError}</div>}
        </div>
      )}

      {/* 📌 Optional One-Time Start Point Registration for Noor Al-Bayan Students */}
      {isNoor && !startSaved && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-[#2563eb] bg-[#f0f7ff] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1e3a8a] font-serif flex items-center gap-1.5">
              📌 تسجيل بداية الطالب مع المعلم في كتاب (نور البيان):
            </h3>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
              إحصائية الإشراف
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-600">
            حدد رقم الصفحة التي بدأ منها الطالب في كتاب نور البيان (تختفي الخانة تلقائياً بعد حفظها لمرة واحدة):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-[#1e3a8a] block mb-1">رقم صفحة البداية في نور البيان:</label>
              <select
                value={noorStartPage}
                onChange={(e) => setNoorStartPage(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-300 bg-white p-2.5 text-xs font-bold outline-none"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map((pg) => (
                  <option key={pg} value={pg}>
                    صفحة رقم {pg}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveNoorStartPoint}
              disabled={savingStart}
              className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs font-black text-white hover:bg-[#1d4ed8] disabled:opacity-50 font-serif"
            >
              {savingStart ? "جاري الحفظ..." : `💾 حفظ البداية (صفحة ${noorStartPage})`}
            </button>
          </div>
          {startError && <div className="text-xs font-bold text-red-600">{startError}</div>}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 border border-emerald-200">
          ✅ تم حفظ التقرير اليومي بنجاح! جاري العودة...
        </div>
      )}

      {/* Attendance Toggle Buttons */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-black text-[#18322a]">
          حالة الحضور اليوم
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setStatus("PRESENT")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all shadow-sm ${
              status === "PRESENT"
                ? "bg-[#0f5a35] text-white ring-2 ring-[#0f5a35] ring-offset-2"
                : "bg-white text-[#0f5a35] border border-[#d8bf83] hover:bg-[#f6eee7]"
            }`}
          >
            <span>✅</span> حاضر
          </button>
          <button
            type="button"
            onClick={() => setStatus("ABSENT")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-black transition-all shadow-sm ${
              status === "ABSENT"
                ? "bg-red-600 text-white ring-2 ring-red-600 ring-offset-2"
                : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
            }`}
          >
            <span>❌</span> غائب
          </button>
        </div>
      </div>

      {status === "PRESENT" && (
        <div className="space-y-5">
          {/* Dynamic Fields for Quran Students with Dropdown Selectors */}
          {!isNoor && (
            <div className="space-y-5 rounded-2xl border border-[#d8bf83]/40 bg-white p-5 shadow-xs">
              <h3 className="text-base font-black text-[#0f5a35] font-serif border-b border-gray-100 pb-2">
                📖 متابعة حفظ وتسميع القرآن الكريم
              </h3>

              {/* 1. الحفظ الجديد */}
              <div className="rounded-xl border border-[#d8bf83]/50 bg-[#fcf9f4] p-3.5 space-y-2">
                <label className="block text-xs font-black text-[#0f5a35] font-serif">
                  ✨ الحفظ الجديد (اختيار السورة والآيات من وإلى):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">السورة:</span>
                    <select
                      value={newSurahId}
                      onChange={(e) => {
                        setNewSurahId(Number(e.target.value));
                        setNewFromAyah(1);
                        setNewToAyah(10);
                      }}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}. سورة {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">من الآية:</span>
                    <select
                      value={newFromAyah}
                      onChange={(e) => setNewFromAyah(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {Array.from({ length: selectedNewSurah.versesCount }, (_, i) => i + 1).map((a) => (
                        <option key={a} value={a}>
                          الآية {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">إلى الآية:</span>
                    <select
                      value={newToAyah}
                      onChange={(e) => setNewToAyah(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {Array.from({ length: selectedNewSurah.versesCount }, (_, i) => i + 1).map((a) => (
                        <option key={a} value={a}>
                          الآية {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={applyNewMemorizationFormat}
                    className="rounded-lg bg-[#0f5a35] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#0a3f2a]"
                  >
                    ⚡ اعتماد صيغة القوائم
                  </button>
                  <input
                    type="text"
                    value={quranNew}
                    onChange={(e) => setQuranNew(e.target.value)}
                    placeholder="نص الحفظ الجديد الذي سيظهر في التقرير..."
                    className="flex-1 rounded-xl border border-[#d8bf83] bg-white px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* 2. المراجعة اليومية */}
              <div className="rounded-xl border border-[#d8bf83]/50 bg-[#fcf9f4] p-3.5 space-y-2">
                <label className="block text-xs font-black text-[#0f5a35] font-serif">
                  🔄 المراجعة اليومية:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">السورة:</span>
                    <select
                      value={revSurahId}
                      onChange={(e) => {
                        setRevSurahId(Number(e.target.value));
                        setRevFromAyah(1);
                        setRevToAyah(selectedRevSurah.versesCount);
                      }}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}. سورة {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">من الآية:</span>
                    <select
                      value={revFromAyah}
                      onChange={(e) => setRevFromAyah(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {Array.from({ length: selectedRevSurah.versesCount }, (_, i) => i + 1).map((a) => (
                        <option key={a} value={a}>
                          الآية {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">إلى الآية:</span>
                    <select
                      value={revToAyah}
                      onChange={(e) => setRevToAyah(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {Array.from({ length: selectedRevSurah.versesCount }, (_, i) => i + 1).map((a) => (
                        <option key={a} value={a}>
                          الآية {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={applyRevisionFormat}
                    className="rounded-lg bg-[#0f5a35] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#0a3f2a]"
                  >
                    ⚡ اعتماد صيغة القوائم
                  </button>
                  <input
                    type="text"
                    value={quranRevision}
                    onChange={(e) => setQuranRevision(e.target.value)}
                    placeholder="نص المراجعة اليومية الذي سيظهر في التقرير..."
                    className="flex-1 rounded-xl border border-[#d8bf83] bg-white px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* 3. التلقين والتحضير */}
              <div className="rounded-xl border border-[#d8bf83]/50 bg-[#fcf9f4] p-3.5 space-y-2">
                <label className="block text-xs font-black text-[#0f5a35] font-serif">
                  🗣️ التلقين والتحضير:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">السورة:</span>
                    <select
                      value={taqeenSurahId}
                      onChange={(e) => {
                        setTaqeenSurahId(Number(e.target.value));
                        setTaqeenFromAyah(1);
                        setTaqeenToAyah(10);
                      }}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {QURAN_SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}. سورة {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">من الآية:</span>
                    <select
                      value={taqeenFromAyah}
                      onChange={(e) => setTaqeenFromAyah(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {Array.from({ length: selectedTaqeenSurah.versesCount }, (_, i) => i + 1).map((a) => (
                        <option key={a} value={a}>
                          الآية {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-500 block mb-0.5">إلى الآية:</span>
                    <select
                      value={taqeenToAyah}
                      onChange={(e) => setTaqeenToAyah(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                    >
                      {Array.from({ length: selectedTaqeenSurah.versesCount }, (_, i) => i + 1).map((a) => (
                        <option key={a} value={a}>
                          الآية {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={applyTaqeenFormat}
                    className="rounded-lg bg-[#0f5a35] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#0a3f2a]"
                  >
                    ⚡ اعتماد صيغة القوائم
                  </button>
                  <input
                    type="text"
                    value={quranTaqeen}
                    onChange={(e) => setQuranTaqeen(e.target.value)}
                    placeholder="نص التلقين والتحضير الذي سيظهر في التقرير..."
                    className="flex-1 rounded-xl border border-[#d8bf83] bg-white px-3 py-1.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Fields for Noor Al-Bayan Students */}
          {isNoor && (
            <div className="space-y-4 rounded-2xl border border-[#d8bf83]/40 bg-white p-4">
              <h3 className="text-base font-black text-[#0f5a35]">
                📘 متابعة نور البيان والتمهيدي
              </h3>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#18322a]">
                  ماذا تعلم الطالب اليوم؟
                </label>
                <input
                  type="text"
                  value={noorLearned}
                  onChange={(e) => setNoorLearned(e.target.value)}
                  placeholder="مثال: حركة الفتح والكسر مع أمثلة الحروف"
                  className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#18322a]">
                    تسليم الواجب
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNoorHomework(true)}
                      className={`flex-1 rounded-xl py-2 text-sm font-black ${
                        noorHomework ? "bg-[#0f5a35] text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      نعم (تم التسليم)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoorHomework(false)}
                      className={`flex-1 rounded-xl py-2 text-sm font-black ${
                        !noorHomework ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      لا (لم يسلم)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#18322a]">
                    درجة الواجب (من 5)
                  </label>
                  <select
                    value={noorHomeworkGrade}
                    onChange={(e) => setNoorHomeworkGrade(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2 text-sm font-bold outline-none"
                  >
                    {[5, 4, 3, 2, 1].map((val) => (
                      <option key={val} value={val}>
                        {val} من 5 ⭐
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#18322a]">
                  درجة المشاركة والتفاعل (من 5)
                </label>
                <select
                  value={noorParticipation}
                  onChange={(e) => setNoorParticipation(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2 text-sm font-bold outline-none"
                >
                  {[5, 4, 3, 2, 1].map((val) => (
                    <option key={val} value={val}>
                      {val} من 5 ⭐
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Behavior & Discipline */}
          <div className="rounded-2xl border border-[#d8bf83]/40 bg-white p-4">
            <h3 className="mb-3 text-base font-black text-[#0f5a35]">
              ⭐ السلوك والانضباط والملاحظات
            </h3>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-[#18322a]">
                درجة السلوك والانضباط:
              </label>
              <div className="grid grid-cols-5 gap-2">
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
                    className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                      behaviorGrade === item.grade
                        ? "bg-[#bd8f2d] text-[#0b4231] shadow-md border-2 border-[#0b4231]"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#18322a]">
                ملاحظات المعلم السلوكية والتوجيهية
              </label>
              <textarea
                rows={2}
                value={behaviorNotes}
                onChange={(e) => setBehaviorNotes(e.target.value)}
                placeholder="ملاحظات تشجيعية أو توجيهات للأهل..."
                className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#0f5a35] py-4 text-base font-black text-white shadow-lg transition hover:bg-[#0a3f2a] disabled:opacity-50"
        >
          {loading ? "جاري حفظ التقرير..." : "💾 حفظ التقرير اليومي"}
        </button>
      </div>
    </form>
  );
}
