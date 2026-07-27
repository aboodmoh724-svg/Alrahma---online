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
  lastPresentReport?: { quranTaqeen?: string | null; quranRevision?: string | null; noorLearned?: string | null } | null;
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

  // Noor Quran Surah fields (Juz Amma only - surah name only, no ayah ranges)
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

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [requestingEdit, setRequestingEdit] = useState<boolean>(false);
  const [requestEditMsg, setRequestEditMsg] = useState<string>("");

  const handleRequestEdit = async () => {
    setRequestingEdit(true);
    setRequestEditMsg("");
    try {
      const res = await fetch("/api/summer/teacher/request-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          dateKey,
          reason: "طلب إذن تعديل التقرير اليومي من الإدارة",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إرسال طلب التعديل");

      setRequestEditMsg("✅ تم تقديم طلب التعديل للإدارة بنجاح! ستظهر لك صلاحية التعديل فور موافقة المدير.");
    } catch (err) {
      setRequestEditMsg(err instanceof Error ? err.message : "حدث خطأ أثناء طلب التعديل");
    } finally {
      setRequestingEdit(false);
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
      {/* 🌟 Islamic Motivational Calligraphy Banner */}
      <div className="mb-6 rounded-3xl border-2 border-[#bd8f2d]/60 bg-gradient-to-r from-[#0c5c5e] via-[#117073] to-[#0c5c5e] p-5 shadow-xl text-white text-center space-y-2 relative overflow-hidden dir-rtl" dir="rtl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#bd8f2d_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
        <div className="relative z-10 space-y-1.5">
          <span className="inline-block rounded-full bg-[#bd8f2d]/25 border border-[#bd8f2d]/40 px-3 py-0.5 text-xs font-bold text-[#fbf6ef] font-serif">
            ✨ بشارة لحَفَظَةِ كِتَابِ اللَّهِ ✨
          </span>
          <h2 className="text-xl sm:text-3xl font-bold text-[#bd8f2d] font-ruqaa leading-snug tracking-wide">
            «وَلِحَامِلِ الْقُرْآنِ شَرَفٌ فِي الأُمَمِ ... وَبِهِ يُعْلَى مَقَامُ الْمَرْءِ وَيَرْتَقِي»
          </h2>
        </div>
      </div>

      {/* Header Info */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#d8bf83]/30 pb-4">
        <div>
          <span className="inline-block rounded-full bg-[#0c5c5e]/10 px-3 py-1 text-xs font-black text-[#0c5c5e]">
            {isNoor ? "📘 طالب نور البيان" : "📖 طالب قرآن كريم"}
          </span>
          <h2 className="mt-1 text-2xl font-black text-[#0c5c5e]">
            {student.fullName}
          </h2>
          {student.circleName && (
            <p className="text-sm font-bold text-[#bd8f2d]">
              الحلقة: {student.circleName}
            </p>
          )}
        </div>
        <div className="text-left text-sm font-bold text-[#18322a]/60">
          تاريخ التقرير: <span className="font-mono text-[#0c5c5e]">{dateKey}</span>
        </div>
      </div>

      {dateKey < new Date().toISOString().split("T")[0] && (
        <div className="mb-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm font-serif">
            <span>⚠️ تنبيه تعبئة تاريخ سابق:</span>
            <span className="bg-amber-200 px-2.5 py-0.5 rounded-md font-mono">{dateKey}</span>
          </div>
          <p className="text-xs font-bold text-amber-800">
            أنت تقوم بتعبئة/تعديل تقرير ليوم سابق. سيتم حفظ التقرير وإرسال إشعار وطلب اعتماد للإدارة لمراجعته بالموافقة.
          </p>
        </div>
      )}

      {/* 📌 Optional One-Time Start Point Registration for Quran Students */}
      {!isNoor && !startSaved && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-[#bd8f2d] bg-[#fdf9f0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0c5c5e] font-serif flex items-center gap-1.5">
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
              <label className="text-xs font-bold text-[#0c5c5e] block mb-1">اسم السورة:</label>
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
              <label className="text-xs font-bold text-[#0c5c5e] block mb-1">من الآية رقم:</label>
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
              className="rounded-xl bg-[#bd8f2d] px-4 py-2.5 text-xs font-black text-[#0c5c5e] hover:bg-[#d8bf83] disabled:opacity-50 font-serif"
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

      {existingReport && (
        <div className="mb-6 rounded-2xl border border-[#d8bf83] bg-[#fdfaf3] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <div>
              <h4 className="font-bold text-[#0c5c5e] text-sm font-serif">تعديل التقرير اليومي المباشر</h4>
              <p className="text-xs text-gray-600 font-semibold">تم رصد هذا التقرير مسبقاً. يمكنك تعديل أي حقل وحفظ التحديثات مباشرة دون الحاجة لموافقة الإدارة.</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300 shrink-0 font-serif">
            وضع التعديل المباشر ✅
          </span>
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
                ? "bg-[#0c5c5e] text-white ring-2 ring-[#0c5c5e] ring-offset-2"
                : "bg-white text-[#0c5c5e] border border-[#d8bf83] hover:bg-[#f6eee7]"
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
              <h3 className="text-base font-black text-[#0c5c5e] font-serif border-b border-gray-100 pb-2">
                📖 متابعة حفظ وتسميع القرآن الكريم
              </h3>

              {/* 1. الحفظ الجديد */}
              <div className="rounded-xl border border-[#d8bf83]/50 bg-[#fcf9f4] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-black text-[#0c5c5e] font-serif">
                    ✨ الحفظ الجديد (من سورة/آية — إلى سورة/آية):
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoNewMemorization(!noNewMemorization)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      noNewMemorization
                        ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    {noNewMemorization ? "✅ تم اختيار: لا يوجد حفظ جديد اليوم" : "❌ لا يوجد حفظ جديد اليوم"}
                  </button>
                </div>

                {!noNewMemorization && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5">سورة البداية:</span>
                      <select
                        value={newSurahId}
                        onChange={(e) => {
                          setNewSurahId(Number(e.target.value));
                          setNewFromAyah(1);
                        }}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5">من الآية:</span>
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
                      <span className="text-[11px] font-bold text-amber-700 block mb-0.5">سورة النهاية:</span>
                      <select
                        value={newEndSurahId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setNewEndSurahId(val);
                          const endSurah = QURAN_SURAHS.find((s) => s.id === val);
                          if (endSurah) setNewToAyah(Math.min(newToAyah, endSurah.versesCount));
                        }}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-amber-700 block mb-0.5">إلى الآية:</span>
                      <select
                        value={newToAyah}
                        onChange={(e) => setNewToAyah(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {Array.from({ length: selectedNewEndSurah.versesCount }, (_, i) => i + 1).map((a) => (
                          <option key={a} value={a}>
                            الآية {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-[#0c5c5e]/5 border border-[#0c5c5e]/20 px-3.5 py-2 mt-1">
                  <span className="text-[11px] font-bold text-[#0c5c5e]/60">📝 نص التقرير:</span>
                  <p className="text-xs font-bold text-[#0c5c5e]">{quranNew || "—"}</p>
                </div>
              </div>

              {/* 2. المراجعة اليومية */}
              <div className="rounded-xl border border-[#d8bf83]/50 bg-[#fcf9f4] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-black text-[#0c5c5e] font-serif">
                    🔄 المراجعة اليومية (من سورة/آية — إلى سورة/آية):
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoRevision(!noRevision)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      noRevision
                        ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    {noRevision ? "✅ تم اختيار: لا يوجد مراجعة اليوم" : "❌ لا يوجد مراجعة اليوم"}
                  </button>
                </div>

                {!noRevision && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5">سورة البداية:</span>
                      <select
                        value={revSurahId}
                        onChange={(e) => {
                          setRevSurahId(Number(e.target.value));
                          setRevFromAyah(1);
                        }}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5">من الآية:</span>
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
                      <span className="text-[11px] font-bold text-amber-700 block mb-0.5">سورة النهاية:</span>
                      <select
                        value={revEndSurahId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRevEndSurahId(val);
                          const endSurah = QURAN_SURAHS.find((s) => s.id === val);
                          if (endSurah) setRevToAyah(Math.min(revToAyah, endSurah.versesCount));
                        }}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-amber-700 block mb-0.5">إلى الآية:</span>
                      <select
                        value={revToAyah}
                        onChange={(e) => setRevToAyah(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {Array.from({ length: selectedRevEndSurah.versesCount }, (_, i) => i + 1).map((a) => (
                          <option key={a} value={a}>
                            الآية {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-[#0c5c5e]/5 border border-[#0c5c5e]/20 px-3.5 py-2 mt-1">
                  <span className="text-[11px] font-bold text-[#0c5c5e]/60">📝 نص التقرير:</span>
                  <p className="text-xs font-bold text-[#0c5c5e]">{quranRevision || "—"}</p>
                </div>
              </div>

              {/* 3. التلقين والتحضير */}
              <div className="rounded-xl border border-[#d8bf83]/50 bg-[#fcf9f4] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-black text-[#0c5c5e] font-serif">
                    🗣️ التلقين والتحضير (من سورة/آية — إلى سورة/آية):
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoTaqeen(!noTaqeen)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      noTaqeen
                        ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    {noTaqeen ? "✅ تم اختيار: لا يوجد تلقين اليوم" : "❌ لا يوجد تلقين اليوم"}
                  </button>
                </div>

                {!noTaqeen && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5">سورة البداية:</span>
                      <select
                        value={taqeenSurahId}
                        onChange={(e) => {
                          setTaqeenSurahId(Number(e.target.value));
                          setTaqeenFromAyah(1);
                        }}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-0.5">من الآية:</span>
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
                      <span className="text-[11px] font-bold text-amber-700 block mb-0.5">سورة النهاية:</span>
                      <select
                        value={taqeenEndSurahId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTaqeenEndSurahId(val);
                          const endSurah = QURAN_SURAHS.find((s) => s.id === val);
                          if (endSurah) setTaqeenToAyah(Math.min(taqeenToAyah, endSurah.versesCount));
                        }}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {QURAN_SURAHS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-amber-700 block mb-0.5">إلى الآية:</span>
                      <select
                        value={taqeenToAyah}
                        onChange={(e) => setTaqeenToAyah(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#d8bf83] bg-white p-2 text-xs font-bold outline-none"
                      >
                        {Array.from({ length: selectedTaqeenEndSurah.versesCount }, (_, i) => i + 1).map((a) => (
                          <option key={a} value={a}>
                            الآية {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-[#0c5c5e]/5 border border-[#0c5c5e]/20 px-3.5 py-2 mt-1">
                  <span className="text-[11px] font-bold text-[#0c5c5e]/60">📝 نص التقرير:</span>
                  <p className="text-xs font-bold text-[#0c5c5e]">{quranTaqeen || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Fields for Noor Al-Bayan Students */}
          {isNoor && (
            <>
            {/* Noor Quran Surahs Section (Juz Amma) */}
            <div className="space-y-4 rounded-2xl border border-[#0c5c5e]/30 bg-[#f0faf9] p-5 shadow-xs">
              <h3 className="text-base font-black text-[#0c5c5e] font-serif border-b border-[#0c5c5e]/10 pb-2">
                📖 متابعة قصار السور (جزء عمّ)
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                اختر اسم السورة فقط لكل قسم — يكفي تحديد سورة واحدة من جزء عمّ
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. درس جديد */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-1.5">
                  <label className="block text-xs font-black text-emerald-900 font-serif">
                    ✨ الدرس الجديد
                  </label>
                  <select
                    value={noorQuranNewSurah}
                    onChange={(e) => setNoorQuranNewSurah(e.target.value)}
                    className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c5c5e]"
                  >
                    <option value="">-- اختر السورة --</option>
                    {JUZ_AMMA_SURAHS.map((s) => (
                      <option key={s.id} value={`سورة ${s.name}`}>
                        سورة {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. مراجعة */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 space-y-1.5">
                  <label className="block text-xs font-black text-blue-900 font-serif">
                    🔄 المراجعة
                  </label>
                  <select
                    value={noorQuranRevisionSurah}
                    onChange={(e) => setNoorQuranRevisionSurah(e.target.value)}
                    className="w-full rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c5c5e]"
                  >
                    <option value="">-- اختر السورة --</option>
                    {JUZ_AMMA_SURAHS.map((s) => (
                      <option key={s.id} value={`سورة ${s.name}`}>
                        سورة {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. تلقين */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-1.5">
                  <label className="block text-xs font-black text-amber-900 font-serif">
                    🎤 التلقين
                  </label>
                  <select
                    value={noorQuranTaqeenSurah}
                    onChange={(e) => setNoorQuranTaqeenSurah(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c5c5e]"
                  >
                    <option value="">-- اختر السورة --</option>
                    {JUZ_AMMA_SURAHS.map((s) => (
                      <option key={s.id} value={`سورة ${s.name}`}>
                        سورة {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[#d8bf83]/40 bg-white p-4">
              <h3 className="text-base font-black text-[#0c5c5e]">
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
                  className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c5c5e]"
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
                        noorHomework ? "bg-[#0c5c5e] text-white" : "bg-gray-100 text-gray-700"
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
                    {[5, 4, 3, 2, 1, 0].map((val) => (
                      <option key={val} value={val}>
                        {val === 0 ? "0 من 5 ❌ (لم ينجز الواجب)" : `${val} من 5 ⭐`}
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
          </>
          )}

          {/* Behavior & Discipline */}
          <div className="rounded-2xl border border-[#d8bf83]/40 bg-white p-4">
            <h3 className="mb-3 text-base font-black text-[#0c5c5e]">
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
                        ? "bg-[#bd8f2d] text-[#0c5c5e] shadow-md border-2 border-[#0c5c5e]"
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
                className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c5c5e]"
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
          className="w-full rounded-2xl bg-[#0c5c5e] py-4 text-base font-black text-white shadow-lg transition hover:bg-[#06484a] disabled:opacity-50"
        >
          {loading ? "جاري الحفظ..." : existingReport ? "💾 حفظ التعديلات وتحديث التقرير اليومي" : "💾 حفظ التقرير اليومي"}
        </button>
      </div>
    </form>
  );
}
