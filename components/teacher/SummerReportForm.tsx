"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StudentProps = {
  id: string;
  fullName: string;
  summerGroup: string | null;
};

type InitialReportProps = {
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
} | null;

type SummerReportFormProps = {
  student: StudentProps;
  initialReport: InitialReportProps;
  todayKey: string;
};

export default function SummerReportForm({
  student,
  initialReport,
  todayKey,
}: SummerReportFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"PRESENT" | "ABSENT">(
    initialReport?.status || "PRESENT"
  );
  
  // Quran fields
  const [quranNew, setQuranNew] = useState(initialReport?.quranNew || "");
  const [quranRevision, setQuranRevision] = useState(
    initialReport?.quranRevision || ""
  );
  const [quranTaqeen, setQuranTaqeen] = useState(initialReport?.quranTaqeen || "");

  // Noor Al-Bayan fields
  const [noorLearned, setNoorLearned] = useState(initialReport?.noorLearned || "");
  const [noorHomework, setNoorHomework] = useState<boolean>(
    initialReport?.noorHomework !== false // default true
  );
  const [noorHomeworkGrade, setNoorHomeworkGrade] = useState<number>(
    initialReport?.noorHomeworkGrade ?? 10
  );
  const [noorParticipation, setNoorParticipation] = useState<number>(
    initialReport?.noorParticipation ?? 10
  );

  // Shared fields
  const [behaviorGrade, setBehaviorGrade] = useState<number>(
    initialReport?.behaviorGrade ?? 10
  );
  const [behaviorNotes, setBehaviorNotes] = useState(
    initialReport?.behaviorNotes || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isQuran = student.summerGroup === "QURAN";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        studentId: student.id,
        dateKey: todayKey,
        status,
        ...(status === "PRESENT"
          ? isQuran
            ? {
                quranNew,
                quranRevision,
                quranTaqeen,
                behaviorGrade,
                behaviorNotes,
              }
            : {
                noorLearned,
                noorHomework,
                noorHomeworkGrade: noorHomework ? noorHomeworkGrade : null,
                noorParticipation,
                behaviorGrade,
                behaviorNotes,
              }
          : {}),
      };

      const response = await fetch("/api/summer/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "حدث خطأ أثناء حفظ التقرير");
        setLoading(false);
        return;
      }

      router.push("/onsite/summer/teacher");
      router.refresh();
    } catch (error) {
      console.error("SUMMER REPORT SAVE ERROR:", error);
      setErrorMessage("عذراً، حدث خطأ أثناء الاتصال بالخادم.");
      setLoading(false);
    }
  }

  const gradesOptions = Array.from({ length: 10 }, (_, i) => 10 - i); // 10 to 1

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Attendance Status Toggle */}
      <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-6 shadow-sm backdrop-blur">
        <h3 className="text-sm font-bold text-slate-500 mb-4">حالة حضور الطالب اليوم</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setStatus("PRESENT")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-black transition-all duration-300 ${
              status === "PRESENT"
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20 ring-2 ring-green-600 ring-offset-2"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-xl">🟢</span> حاضر
          </button>
          <button
            type="button"
            onClick={() => setStatus("ABSENT")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-black transition-all duration-300 ${
              status === "ABSENT"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20 ring-2 ring-red-600 ring-offset-2"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="text-xl">🔴</span> غائب
          </button>
        </div>
      </div>

      {status === "PRESENT" && (
        <div className="space-y-6">
          {/* Group Specific Fields */}
          {isQuran ? (
            /* Quran Student Fields */
            <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-6 shadow-sm backdrop-blur space-y-4">
              <h3 className="text-[#0d9488] font-black border-b border-[#9cc4c0]/20 pb-3 mb-2">📚 تفاصيل مقرر القرآن الكريم</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">الحفظ الجديد</label>
                  <textarea
                    value={quranNew}
                    onChange={(e) => setQuranNew(e.target.value)}
                    placeholder="مثال: سورة الكهف من آية 1 إلى 10"
                    rows={3}
                    className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none transition focus:border-[#0d9488] focus:bg-white resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">المراجعة</label>
                  <textarea
                    value={quranRevision}
                    onChange={(e) => setQuranRevision(e.target.value)}
                    placeholder="مثال: سورة يس بالكامل"
                    rows={3}
                    className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none transition focus:border-[#0d9488] focus:bg-white resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">التلقين (مقرر الحفظ القادم)</label>
                  <textarea
                    value={quranTaqeen}
                    onChange={(e) => setQuranTaqeen(e.target.value)}
                    placeholder="مثال: سورة مريم من آية 1 إلى 15"
                    rows={3}
                    className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none transition focus:border-[#0d9488] focus:bg-white resize-none"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Noor Al-Bayan Student Fields */
            <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-6 shadow-sm backdrop-blur space-y-4">
              <h3 className="text-[#0d9488] font-black border-b border-[#9cc4c0]/20 pb-3 mb-2">✨ تفاصيل مقرر نور البيان</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">ماذا تعلم الطالب اليوم؟</label>
                  <textarea
                    value={noorLearned}
                    onChange={(e) => setNoorLearned(e.target.value)}
                    placeholder="مثال: تم أخذ درس المد الطبيعي بالواو وحل التمارين"
                    rows={2}
                    className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none transition focus:border-[#0d9488] focus:bg-white resize-none"
                    required
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3 items-center">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">تسليم الواجب</label>
                    <div className="flex gap-2 p-1 rounded-2xl bg-slate-100/60 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setNoorHomework(true)}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all ${
                          noorHomework
                            ? "bg-white text-emerald-800 shadow-sm border border-emerald-100"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        ✅ تم التسليم
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoorHomework(false)}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all ${
                          !noorHomework
                            ? "bg-white text-red-800 shadow-sm border border-red-100"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        ❌ لم يسلم
                      </button>
                    </div>
                  </div>

                  {noorHomework && (
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">درجة الواجب (من 10)</label>
                      <select
                        value={noorHomeworkGrade}
                        onChange={(e) => setNoorHomeworkGrade(Number(e.target.value))}
                        className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none focus:border-[#0d9488] focus:bg-white"
                      >
                        {gradesOptions.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade} / 10
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">درجة المشاركة والتفاعل (من 10)</label>
                    <select
                      value={noorParticipation}
                      onChange={(e) => setNoorParticipation(Number(e.target.value))}
                      className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none focus:border-[#0d9488] focus:bg-white"
                    >
                      {gradesOptions.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade} / 10
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Behavior & General Details */}
          <div className="rounded-3xl border border-[#9cc4c0]/20 bg-white/60 p-6 shadow-sm backdrop-blur space-y-4">
            <h3 className="text-[#0d9488] font-black border-b border-[#9cc4c0]/20 pb-3 mb-2">⭐ التقييم السلوكي والانضباط</h3>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">درجة السلوك والانضباط (من 10)</label>
                <select
                  value={behaviorGrade}
                  onChange={(e) => setBehaviorGrade(Number(e.target.value))}
                  className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none focus:border-[#0d9488] focus:bg-white"
                >
                  {gradesOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade} / 10
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">ملاحظات السلوك والانضباط</label>
                <textarea
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظات إضافية حول أداء وسلوك الطالب اليوم (مثال: متميز جداً اليوم ومطيع)"
                  rows={2}
                  className="w-full rounded-2xl border border-[#9cc4c0]/40 bg-[#fffdfa] px-4 py-3 text-sm text-[#1c2d31] outline-none transition focus:border-[#0d9488] focus:bg-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-2xl bg-[#0d9488] px-6 py-4 text-base font-black text-white shadow-lg shadow-[#0d9488]/20 transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-75"
        >
          {loading ? "جاري الحفظ..." : "💾 حفظ التقرير اليومي"}
        </button>
        <Link
          href="/onsite/summer/teacher"
          className="rounded-2xl bg-slate-100 px-6 py-4 text-base font-bold text-slate-700 transition hover:bg-slate-200"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}

