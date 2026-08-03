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
  attendanceRate: number;
  totalReports: number;
  absentCount: number;
  lastBehaviorGrade: number | null;
  recentDots: Array<"present" | "absent" | "missing" | "future">;
  recentDotLabels: string[];
};

export default function TeacherStudentCard({
  student,
  selectedDateKey,
  todayStr,
  reportForSelectedDate,
  lastPresentReport,
  missingDateKeys,
  attendanceRate,
  totalReports,
  absentCount,
  lastBehaviorGrade,
  recentDots,
  recentDotLabels,
}: TeacherStudentCardProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const isDone = Boolean(reportForSelectedDate);
  const isAbsent = isDone && reportForSelectedDate?.status === "ABSENT";
  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";
  const hasStats = totalReports > 0;

  const attColor = attendanceRate >= 85 ? "text-[#059669]" : attendanceRate >= 60 ? "text-[#0C5C5E]" : "text-[#DC2626]";

  const stars = (grade: number | null) => {
    if (grade === null) return null;
    const n = Math.min(5, Math.max(1, grade));
    return <span className="text-[#D97706] tracking-tight">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
  };

  const dotColor = (s: string) => {
    if (s === "present") return "bg-[#059669]";
    if (s === "absent") return "bg-[#DC2626]";
    if (s === "future") return "bg-[#E5E3DF]";
    return "bg-[#D1D5DB]";
  };

  return (
    <>
      <div
        className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
          isDone
            ? isAbsent ? "border-[#FECACA]" : "border-[#A7F3D0]"
            : "border-[#E5E3DF] hover:shadow-md hover:-translate-y-0.5"
        }`}
        style={{
          borderRightWidth: '3px',
          borderRightColor: isDone ? (isAbsent ? '#DC2626' : '#059669') : '#0C5C5E',
        }}
      >
        <div className="p-3.5">
          {/* Row 1: Name + Track + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className={`text-[15px] font-bold leading-tight truncate ${
                  isDone && !isAbsent ? "text-[#374151]/70" : "text-[#1F2937]"
                }`}>
                  {isDone && !isAbsent && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 -mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {student.fullName}
                </h4>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  isNoor ? "bg-[#D97706]/10 text-[#92400E]" : "bg-[#0C5C5E]/10 text-[#0C5C5E]"
                }`}>
                  {isNoor ? "نور البيان" : "قرآن"}
                </span>
                {student.studentCode === "7500" && (
                  <span className="shrink-0 rounded bg-[#DBEAFE] px-1.5 py-0.5 text-[9px] font-semibold text-[#1E40AF]">تجريبي</span>
                )}
                {missingDateKeys.length > 0 && (
                  <span className="shrink-0 text-[9px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                    {missingDateKeys.length} ناقص
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 ${
              isDone
                ? isAbsent ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#D1FAE5] text-[#059669]"
                : "bg-[#EDF5F4] text-[#0C5C5E]"
            }`}>
              {isDone ? (isAbsent ? "غائب" : "تم") : "بانتظار"}
            </span>
          </div>

          {/* Row 2: Micro Stats */}
          {hasStats && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-[#6B7280]">
              <span className={`font-semibold ${attColor}`}>{attendanceRate}%</span>
              <span className="text-[#E5E3DF]">·</span>
              <span>{totalReports} تقرير</span>
              {lastBehaviorGrade !== null && (
                <>{" "}<span className="text-[#E5E3DF]">·</span>{" "}{stars(lastBehaviorGrade)}</>
              )}
              {absentCount > 0 && (
                <>{" "}<span className="text-[#E5E3DF]">·</span>{" "}<span className="text-[#DC2626]">{absentCount} غياب</span></>
              )}
            </div>
          )}

          {/* Row 3: Actions */}
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`text-[11px] font-medium transition-colors duration-200 ${
                  showDetails ? "text-[#0C5C5E]" : "text-[#9CA3AF] hover:text-[#0C5C5E]"
                }`}
              >
                {showDetails ? "إخفاء" : "التفاصيل"}
              </button>
              <span className="text-[#E5E3DF]">·</span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#0C5C5E] transition-colors duration-200"
              >
                السجل
              </button>
            </div>

            <Link
              href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${selectedDateKey}`}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all duration-200 ease-out ${
                isDone
                  ? "bg-[#EDF5F4] text-[#0C5C5E] hover:bg-[#D4ECEB]"
                  : "bg-[#0C5C5E] text-white hover:bg-[#0A4D4F] shadow-xs"
              }`}
            >
              {isDone ? "تعديل" : "رصد التقرير"}
            </Link>
          </div>

          {/* Expandable Quick Summary */}
          {showDetails && (
            <div className="mt-2.5 pt-2.5 border-t border-[#F3F4F6] space-y-2 animate-fadeIn">
              {/* Recent 7 Days Dots */}
              {recentDots.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#9CA3AF] font-medium ml-1">آخر 7 أيام:</span>
                  {recentDots.map((dot, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div className={`w-4 h-4 rounded-full ${dotColor(dot)} flex items-center justify-center`}>
                        {dot === "present" && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        {dot === "absent" && <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      </div>
                      <span className="text-[8px] text-[#D1D5DB]">{recentDotLabels[i]}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Info row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#6B7280]">
                <span><strong className="text-[#374151]">آخر حضور:</strong> {lastPresentReport?.dateKey || "—"}</span>
                {absentCount > 0 && <span className="text-[#DC2626]"><strong>الغياب:</strong> {absentCount} مرات</span>}
              </div>

              {/* Last lesson */}
              {lastPresentReport && (
                <div className="text-[11px] text-[#374151] space-y-0.5">
                  {!isNoor ? (
                    <>
                      {lastPresentReport.quranNew && <p className="truncate"><span className="text-[#059669] font-semibold">الحفظ:</span> {lastPresentReport.quranNew}</p>}
                      {lastPresentReport.quranRevision && <p className="truncate"><span className="text-[#D97706] font-semibold">المراجعة:</span> {lastPresentReport.quranRevision}</p>}
                    </>
                  ) : (
                    lastPresentReport.noorLearned && <p className="truncate"><span className="text-[#059669] font-semibold">الدرس:</span> {lastPresentReport.noorLearned}</p>
                  )}
                </div>
              )}

              {/* Missing days shortcuts */}
              {missingDateKeys.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {missingDateKeys.slice(0, 4).map((dKey) => (
                    <Link key={dKey} href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${dKey}`}
                      className="rounded border border-[#FDE68A] bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-semibold text-[#92400E] hover:bg-[#FDE68A] transition">
                      {dKey.slice(5)}
                    </Link>
                  ))}
                  {missingDateKeys.length > 4 && (
                    <button type="button" onClick={() => setShowHistoryModal(true)}
                      className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280] hover:bg-[#E5E7EB] transition">
                      +{missingDateKeys.length - 4}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showHistoryModal && (
        <StudentHistoryModal studentId={student.id} studentName={student.fullName} onClose={() => setShowHistoryModal(false)} />
      )}
    </>
  );
}
