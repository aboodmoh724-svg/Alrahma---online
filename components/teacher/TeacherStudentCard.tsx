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
    return <span className="text-[#D97706]">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
  };

  const dotColor = (s: string) => {
    if (s === "present") return "bg-[#059669]";
    if (s === "absent") return "bg-[#DC2626]";
    return "bg-[#D1D5DB]";
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl border transition-all duration-150 ease-out overflow-hidden ${
          isDone
            ? isAbsent ? "border-[#FECACA]" : "border-[#A7F3D0]"
            : "border-[#E5E3DF] hover:shadow-md hover:-translate-y-px"
        }`}
        style={{ borderRightWidth: '3px', borderRightColor: isDone ? (isAbsent ? '#DC2626' : '#059669') : '#0C5C5E' }}
      >
        <div className="px-3.5 py-3">
          {/* Row 1: Name + badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isDone && !isAbsent && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              <h4 className={`text-[14px] font-bold leading-tight truncate ${isDone && !isAbsent ? "text-[#374151]/60" : "text-[#1F2937]"}`}>
                {student.fullName}
              </h4>
              <span className={`shrink-0 rounded px-1.5 py-px text-[9px] font-semibold ${
                isNoor ? "bg-[#D97706]/10 text-[#92400E]" : "bg-[#0C5C5E]/8 text-[#0C5C5E]"
              }`}>
                {isNoor ? "نور البيان" : "قرآن"}
              </span>
              {student.studentCode === "7500" && (
                <span className="shrink-0 rounded bg-[#DBEAFE] px-1 py-px text-[8px] font-bold text-[#1E40AF]">تجريبي</span>
              )}
            </div>
            {/* Status */}
            <span className={`shrink-0 text-[10px] font-bold ${
              isDone ? (isAbsent ? "text-[#DC2626]" : "text-[#059669]") : "text-[#9CA3AF]"
            }`}>
              {isDone ? (isAbsent ? "غائب" : "تم ✓") : "بانتظار"}
            </span>
          </div>

          {/* Row 2: Inline micro stats */}
          {hasStats && (
            <p className="text-[10px] text-[#6B7280] mt-1.5 leading-none flex items-center gap-0 flex-wrap">
              <span className={`font-semibold ${attColor}`}>{attendanceRate}% حضور</span>
              <span className="text-[#D1D5DB] mx-1">•</span>
              <span>{totalReports} تقرير</span>
              {lastBehaviorGrade !== null && (<><span className="text-[#D1D5DB] mx-1">•</span>{stars(lastBehaviorGrade)}</>)}
              {absentCount > 0 && (<><span className="text-[#D1D5DB] mx-1">•</span><span className="text-[#DC2626]">{absentCount} غياب</span></>)}
              {missingDateKeys.length > 0 && (<><span className="text-[#D1D5DB] mx-1">•</span><span className="text-[#D97706]">{missingDateKeys.length} ناقص</span></>)}
            </p>
          )}

          {/* Row 3: Actions — CTA is prominent */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F3F4F6]">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setShowDetails(!showDetails)}
                className={`text-[10px] font-medium transition-colors duration-150 ${showDetails ? "text-[#0C5C5E]" : "text-[#C4C4C4] hover:text-[#0C5C5E]"}`}>
                {showDetails ? "إخفاء" : "التفاصيل"}
              </button>
              <span className="text-[#E5E3DF] text-[10px]">·</span>
              <button type="button" onClick={() => setShowHistoryModal(true)}
                className="text-[10px] font-medium text-[#C4C4C4] hover:text-[#0C5C5E] transition-colors duration-150">
                السجل
              </button>
            </div>

            <Link
              href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${selectedDateKey}`}
              className={`rounded-lg px-4 py-[7px] text-[13px] font-bold transition-all duration-150 ease-out ${
                isDone
                  ? "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                  : "bg-[#0C5C5E] text-white hover:bg-[#0A4D4F] shadow-sm hover:shadow"
              }`}
            >
              {isDone ? "تعديل" : "رصد التقرير"}
            </Link>
          </div>

          {/* Expandable details */}
          {showDetails && (
            <div className="mt-2 pt-2 border-t border-[#F3F4F6] space-y-2 animate-fadeIn">
              {/* 7-day dots */}
              {recentDots.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-[#9CA3AF] ml-1">آخر 7 أيام</span>
                  {recentDots.map((dot, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full ${dotColor(dot)} flex items-center justify-center`}>
                        {dot === "present" && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        {dot === "absent" && <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                      </div>
                      <span className="text-[7px] text-[#D1D5DB] mt-px">{recentDotLabels[i]}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Last lesson */}
              {lastPresentReport && (
                <div className="text-[10px] text-[#374151] space-y-0.5">
                  <p><span className="text-[#9CA3AF]">آخر حضور:</span> {lastPresentReport.dateKey}</p>
                  {!isNoor ? (
                    <>
                      {lastPresentReport.quranNew && <p className="truncate"><span className="text-[#059669]">الحفظ:</span> {lastPresentReport.quranNew}</p>}
                      {lastPresentReport.quranRevision && <p className="truncate"><span className="text-[#D97706]">المراجعة:</span> {lastPresentReport.quranRevision}</p>}
                    </>
                  ) : (
                    lastPresentReport.noorLearned && <p className="truncate"><span className="text-[#059669]">الدرس:</span> {lastPresentReport.noorLearned}</p>
                  )}
                </div>
              )}

              {/* Missing day links */}
              {missingDateKeys.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {missingDateKeys.slice(0, 5).map((dKey) => (
                    <Link key={dKey} href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${dKey}`}
                      className="rounded border border-[#FDE68A] bg-[#FFFBEB] px-1.5 py-px text-[9px] font-semibold text-[#92400E] hover:bg-[#FDE68A] transition-colors duration-150">
                      {dKey.slice(5)}
                    </Link>
                  ))}
                  {missingDateKeys.length > 5 && (
                    <button type="button" onClick={() => setShowHistoryModal(true)}
                      className="rounded bg-[#F3F4F6] px-1.5 py-px text-[9px] text-[#9CA3AF] hover:bg-[#E5E7EB] transition-colors duration-150">
                      +{missingDateKeys.length - 5}
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
