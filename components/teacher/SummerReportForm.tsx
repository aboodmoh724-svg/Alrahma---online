"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  dateKey: string;
};

export default function SummerReportForm({
  student,
  existingReport,
  dateKey,
}: SummerReportFormProps) {
  const router = useRouter();
  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

  const [status, setStatus] = useState<"PRESENT" | "ABSENT">(
    existingReport?.status || "PRESENT"
  );
  // Quran fields
  const [quranNew, setQuranNew] = useState(existingReport?.quranNew || "");
  const [quranRevision, setQuranRevision] = useState(existingReport?.quranRevision || "");
  const [quranTaqeen, setQuranTaqeen] = useState(existingReport?.quranTaqeen || "");

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
          {/* Dynamic Fields for Quran Students */}
          {!isNoor && (
            <div className="space-y-4 rounded-2xl border border-[#d8bf83]/40 bg-white p-4">
              <h3 className="text-base font-black text-[#0f5a35]">
                📖 متابعة حفظ القرآن الكريم
              </h3>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#18322a]">
                  الحفظ الجديد (الآيات / الصفحات)
                </label>
                <input
                  type="text"
                  value={quranNew}
                  onChange={(e) => setQuranNew(e.target.value)}
                  placeholder="مثال: سورة البقرة من آية 1 إلى 15"
                  className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#18322a]">
                  المراجعة اليومية
                </label>
                <input
                  type="text"
                  value={quranRevision}
                  onChange={(e) => setQuranRevision(e.target.value)}
                  placeholder="مثال: جزء عم من النبأ إلى الناس"
                  className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-[#18322a]">
                  التلقين والتحضير
                </label>
                <input
                  type="text"
                  value={quranTaqeen}
                  onChange={(e) => setQuranTaqeen(e.target.value)}
                  placeholder="مثال: تلقين سورة آل عمران الآيات 1-10"
                  className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0f5a35]"
                />
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
              <label className="mb-1 block text-sm font-bold text-[#18322a]">
                درجة السلوك والانضباط
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setBehaviorGrade(star)}
                    className={`text-2xl transition ${
                      star <= behaviorGrade ? "text-[#bd8f2d] scale-110" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="mr-2 text-sm font-bold text-[#bd8f2d]">
                  ({behaviorGrade} من 5)
                </span>
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
