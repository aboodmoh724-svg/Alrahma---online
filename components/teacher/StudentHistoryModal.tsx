"use client";

import { useEffect, useState } from "react";

type StudentHistoryModalProps = {
  studentId: string | null;
  studentName?: string;
  onClose: () => void;
  onSelectMissingDate?: (studentId: string, dateKey: string) => void;
};

export default function StudentHistoryModal({
  studentId,
  studentName,
  onClose,
  onSelectMissingDate,
}: StudentHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/summer/teacher/students/${studentId}/history`)
      .then((res) => {
        if (!res.ok) throw new Error("تعذر جلب سجل الطالب");
        return res.json();
      })
      .then((resData) => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "حدث خطأ في الاتصال");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 dir-rtl"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#faf8f4] border-2 border-[#bd8f2d]/60 shadow-2xl overflow-hidden animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative bg-gradient-to-r from-[#0c5c5e] via-[#117073] to-[#0c5c5e] px-6 py-5 text-white border-b-4 border-[#bd8f2d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-[#bd8f2d]/50 flex items-center justify-center text-xl shadow-inner">
              📜
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-[#fbf6ef]">
                سجل إنجاز وتقارير الطالب
              </h2>
              <p className="text-xs font-semibold text-cyan-100">
                {studentName || data?.student?.fullName || "جاري التحميل..."}
                {data?.student?.circleName && ` | حلقة: ${data.student.circleName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition border border-white/20"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Timeline */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[radial-gradient(#bd8f2d_1px,transparent_1px)] [background-size:20px_20px] bg-opacity-20">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#0c5c5e] border-t-transparent" />
              <p className="text-sm font-bold text-[#0c5c5e] font-serif">
                جاري تحضير السجل اليومي للطالب... ⏳
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center text-sm font-bold text-red-700">
              {error}
            </div>
          ) : (
            <>
              {/* Missing Days Action Pills Banner if any */}
              {data?.missingDateKeys && data.missingDateKeys.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm font-serif">
                    <span>🔴 الأيام غير المُرصدة مؤخراً ({data.missingDateKeys.length} أيام):</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {data.missingDateKeys.slice(0, 6).map((dKey: string) => (
                      <button
                        key={dKey}
                        onClick={() => {
                          if (onSelectMissingDate) {
                            onSelectMissingDate(data.student.id, dKey);
                            onClose();
                          } else {
                            window.location.href = `/onsite/summer/teacher/reports/${data.student.id}?dateKey=${dKey}`;
                          }
                        }}
                        className="rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100 transition shadow-2xs font-mono flex items-center gap-1.5"
                      >
                        <span>📝 تعبئة</span>
                        <span>{dKey}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quran Progress Start Point Card if registered */}
              {data?.initialStartProgress && (
                <div className="rounded-2xl border border-[#bd8f2d]/50 bg-[#fffdf9] p-4 text-xs font-bold text-[#0c5c5e] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-black text-[#bd8f2d]">📌 نقطة بداية الطالب عند التحاقه بالدورة:</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-700">
                    {data.initialStartProgress.startSurahName && (
                      <span>سورة البداية: <b>{data.initialStartProgress.startSurahName} (الآية {data.initialStartProgress.startAyah || 1})</b></span>
                    )}
                    {data.initialStartProgress.currentSurahName && (
                      <span>آخر سورة وصل لها: <b>{data.initialStartProgress.currentSurahName}</b></span>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline List Header */}
              <div className="flex items-center justify-between border-b border-[#bd8f2d]/30 pb-2">
                <h3 className="text-base font-bold text-[#0c5c5e] font-serif">
                  📋 المسار الزمني لتقارير الطالب اليومية ({data?.reports?.length || 0} تقرير)
                </h3>
                <span className="text-xs font-semibold text-gray-500">مرتبة تنازلياً من الأحدث للأقدم</span>
              </div>

              {/* Reports Timeline */}
              {data?.reports?.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#bd8f2d] bg-white p-10 text-center text-sm font-bold text-gray-500">
                  لم يتم رصد أي تقارير لهذا الطالب حتى الآن.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.reports.map((rep: any) => {
                    const isAbsent = rep.status === "ABSENT";
                    const isNoor = data?.student?.summerGroup === "NOOR_AL_BAYAN";

                    return (
                      <div
                        key={rep.id}
                        className={`rounded-2xl border p-4.5 transition-all shadow-xs space-y-3 ${
                          isAbsent
                            ? "border-red-200 bg-red-50/40"
                            : "border-[#bd8f2d]/40 bg-white hover:shadow-md"
                        }`}
                      >
                        {/* Report Date & Status Row */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">📅</span>
                            <span className="font-mono text-sm font-bold text-[#0c5c5e]">
                              {rep.dateKey}
                            </span>
                          </div>

                          <span
                            className={`rounded-full px-3 py-0.5 text-xs font-black font-serif ${
                              isAbsent
                                ? "bg-red-600 text-white shadow-2xs"
                                : "bg-emerald-700 text-white shadow-2xs"
                            }`}
                          >
                            {isAbsent ? "غائب ❌" : "حاضر ✅"}
                          </span>
                        </div>

                        {/* Report Content */}
                        {!isAbsent && (
                          <div className="grid gap-3 sm:grid-cols-2 text-xs">
                            {!isNoor ? (
                              <>
                                {/* Quran Fields */}
                                {rep.quranNew && (
                                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 space-y-1">
                                    <span className="font-bold text-emerald-900 font-serif block">
                                      📖 الحفظ الجديد:
                                    </span>
                                    <p className="font-bold text-emerald-800">{rep.quranNew}</p>
                                  </div>
                                )}

                                {rep.quranRevision && (
                                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 space-y-1">
                                    <span className="font-bold text-amber-900 font-serif block">
                                      🔄 المراجعة:
                                    </span>
                                    <p className="font-bold text-amber-800">{rep.quranRevision}</p>
                                  </div>
                                )}

                                {rep.quranTaqeen && (
                                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-2.5 space-y-1 sm:col-span-2">
                                    <span className="font-bold text-cyan-900 font-serif block">
                                      🗣️ التلقين والتحضير:
                                    </span>
                                    <p className="font-bold text-cyan-800">{rep.quranTaqeen}</p>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {/* Noor Al Bayan Fields */}
                                {rep.noorLearned && (
                                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 space-y-1 sm:col-span-2">
                                    <span className="font-bold text-emerald-900 font-serif block">
                                      📘 الدرس المشروح اليوم:
                                    </span>
                                    <p className="font-bold text-emerald-800">{rep.noorLearned}</p>
                                  </div>
                                )}

                                {rep.noorHomeworkGrade !== null && rep.noorHomeworkGrade !== undefined && (
                                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 space-y-1">
                                    <span className="font-bold text-amber-900 font-serif block">
                                      📝 تقييم الواجب:
                                    </span>
                                    <p className="font-bold text-amber-800">
                                      {rep.noorHomeworkGrade === 0
                                        ? "0 من 5 ❌ (لم يسلم الواجب)"
                                        : `${rep.noorHomeworkGrade} من 5 ⭐`}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Behavior & Notes */}
                            {(rep.behaviorGrade || rep.behaviorNotes) && (
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 space-y-1 sm:col-span-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-700 font-serif">
                                    🌟 التقييم السلوكي:
                                  </span>
                                  {rep.behaviorGrade && (
                                    <span className="font-bold text-amber-600">
                                      {"⭐".repeat(Math.min(5, Math.max(1, rep.behaviorGrade)))}
                                    </span>
                                  )}
                                </div>
                                {rep.behaviorNotes && (
                                  <p className="text-gray-600 italic mt-0.5">{rep.behaviorNotes}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer / Compact Summary Stats */}
        {data?.stats && (
          <div className="bg-[#f0e8db] border-t border-[#bd8f2d]/40 px-6 py-3 text-xs font-bold text-[#0c5c5e] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4">
              <span>إجمالي التقارير: <b className="font-mono text-sm">{data.stats.totalRecorded}</b></span>
              <span className="text-emerald-700">حاضر: <b className="font-mono text-sm">{data.stats.presentCount}</b></span>
              <span className="text-red-600">غائب: <b className="font-mono text-sm">{data.stats.absentCount}</b></span>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl bg-[#0c5c5e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#084547] transition font-serif"
            >
              إغلاق السجل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
