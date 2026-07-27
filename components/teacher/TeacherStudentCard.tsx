"use client";

import { useState } from "react";
import Link from "next/link";
import StudentHistoryModal from "./StudentHistoryModal";

type TeacherStudentCardProps = {
  student: {
    id: string;
    fullName: string;
    studentCode?: string | null;
    summerGroup: string | null;
    circleName?: string;
  };
  selectedDateKey: string;
  todayStr: string;
  reportForSelectedDate?: {
    id: string;
    status: string;
    quranNew?: string | null;
    quranRevision?: string | null;
    noorLearned?: string | null;
  } | null;
  lastPresentReport?: {
    dateKey: string;
    quranNew?: string | null;
    quranRevision?: string | null;
    noorLearned?: string | null;
  } | null;
  missingDateKeys: string[];
};

export default function TeacherStudentCard({
  student,
  selectedDateKey,
  todayStr,
  reportForSelectedDate,
  lastPresentReport,
  missingDateKeys,
}: TeacherStudentCardProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const isDone = Boolean(reportForSelectedDate);
  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";

  return (
    <>
      <div
        className={`relative flex flex-col justify-between rounded-3xl border-2 p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 ${
          isDone
            ? "border-emerald-400/80 bg-gradient-to-b from-[#f2faf6] via-white to-[#f4faf7]"
            : "border-[#bd8f2d]/50 bg-white"
        }`}
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none opacity-10 bg-[radial-gradient(#0c5c5e_1px,transparent_1px)] [background-size:6px_6px] rounded-tl-3xl" />

        {/* Top Info Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {isNoor ? (
                  <span className="rounded-full bg-[#bd8f2d] px-3 py-0.5 text-xs font-black text-white font-serif shadow-2xs">
                    📘 طالب نور البيان
                  </span>
                ) : (
                  <span className="rounded-full bg-[#0c5c5e] px-3 py-0.5 text-xs font-black text-white font-serif shadow-2xs">
                    📖 طالب قرآن كريم
                  </span>
                )}

                {student.studentCode === "7500" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-300">
                    تجريبي
                  </span>
                )}
              </div>

              <h4 className="mt-2 text-xl font-bold text-[#162e24] font-serif leading-snug">
                {student.fullName}
              </h4>

              {student.circleName && (
                <p className="text-xs font-bold text-[#bd8f2d] mt-0.5 font-serif">
                  حلقة: {student.circleName}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span
                className={`rounded-full px-3.5 py-1 text-xs font-black font-serif ${
                  isDone
                    ? reportForSelectedDate?.status === "ABSENT"
                      ? "bg-red-600 text-white shadow-2xs"
                      : "bg-emerald-700 text-white shadow-2xs"
                    : "bg-amber-100 text-amber-900 border border-amber-300/80"
                }`}
              >
                {isDone
                  ? reportForSelectedDate?.status === "ABSENT"
                    ? "غائب ❌"
                    : "تم الرصد ✅"
                  : "بانتظار التعبئة ⏳"}
              </span>

              {/* History Modal Trigger Button */}
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="mt-1 flex items-center gap-1.5 rounded-xl border border-[#0c5c5e]/30 bg-[#0c5c5e]/5 px-2.5 py-1 text-xs font-bold text-[#0c5c5e] hover:bg-[#0c5c5e] hover:text-white transition shadow-2xs font-serif"
              >
                <span>📜</span>
                <span>سجل الطالب</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Section: Last Memorized / Lesson */}
          <div className="rounded-2xl border border-[#bd8f2d]/30 bg-[#fdfaf5] p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0c5c5e] font-serif">📌 آخر تقرير حضور مرصود:</span>
              <span className="font-mono font-bold text-gray-500 text-[11px]">
                {lastPresentReport?.dateKey || "لا يوجد سابقاً"}
              </span>
            </div>

            {lastPresentReport ? (
              <div className="space-y-1 text-gray-800">
                {!isNoor ? (
                  <>
                    {lastPresentReport.quranNew && (
                      <p className="font-semibold text-emerald-900 line-clamp-1">
                        📖 الحفظ: <b className="font-bold">{lastPresentReport.quranNew}</b>
                      </p>
                    )}
                    {lastPresentReport.quranRevision && (
                      <p className="font-semibold text-amber-900 line-clamp-1">
                        🔄 المراجعة: <b className="font-bold">{lastPresentReport.quranRevision}</b>
                      </p>
                    )}
                  </>
                ) : (
                  lastPresentReport.noorLearned && (
                    <p className="font-semibold text-emerald-900 line-clamp-1">
                      📘 الدرس: <b className="font-bold">{lastPresentReport.noorLearned}</b>
                    </p>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic text-[11px]">لم يتم تسجيل تقرير حضور سابق للطالب</p>
            )}
          </div>

          {/* Missing Past Days Quick Shortcuts */}
          {missingDateKeys.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="block text-[11px] font-bold text-amber-900 font-serif">
                🔴 الأيام غير المُرصدة مؤخراً ({missingDateKeys.length} أيام):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingDateKeys.slice(0, 4).map((dKey) => (
                  <Link
                    key={dKey}
                    href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${dKey}`}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition font-mono flex items-center gap-1 shadow-2xs"
                  >
                    <span>⚡</span>
                    <span>{dKey.slice(5)}</span>
                  </Link>
                ))}
                {missingDateKeys.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="rounded-lg border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700 hover:bg-gray-200 transition"
                  >
                    +{missingDateKeys.length - 4} المزيد...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-[#d8bf83]/40 pt-3">
          <span className="text-xs font-semibold text-gray-600">
            {isDone
              ? reportForSelectedDate?.status === "ABSENT"
                ? "غائب عن الحلقة"
                : isNoor
                ? `درس اليوم: ${reportForSelectedDate?.noorLearned || "حاضر"}`
                : `حفظ اليوم: ${reportForSelectedDate?.quranNew || "حاضر"}`
              : `تقرير تاريخ: ${selectedDateKey}`}
          </span>

          <Link
            href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${selectedDateKey}`}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition shadow-sm font-serif ${
              isDone
                ? "bg-white text-[#0c5c5e] border-2 border-[#0c5c5e] hover:bg-emerald-50"
                : "bg-[#0c5c5e] text-white hover:bg-[#06484a]"
            }`}
          >
            {isDone ? "تعديل التقرير ✏️" : "تعبئة التقرير 📝"}
          </Link>
        </div>
      </div>

      {/* Interactive History Modal */}
      {showHistoryModal && (
        <StudentHistoryModal
          studentId={student.id}
          studentName={student.fullName}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </>
  );
}
