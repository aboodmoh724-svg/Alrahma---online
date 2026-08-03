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
  // Smart Analytics Props
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

  // Attendance rate color
  const getAttendanceColor = (rate: number) => {
    if (rate >= 85) return "text-[#059669]";
    if (rate >= 60) return "text-[#0C5C5E]";
    return "text-[#DC2626]";
  };

  // Render stars from behavior grade
  const renderStars = (grade: number | null) => {
    if (grade === null || grade === undefined) return null;
    const filled = Math.min(5, Math.max(1, grade));
    return (
      <span className="text-[#D97706]">
        {"★".repeat(filled)}
        {"☆".repeat(5 - filled)}
      </span>
    );
  };

  // Dot color for recent 7 days
  const getDotColor = (status: string) => {
    switch (status) {
      case "present": return "bg-[#059669]";
      case "absent": return "bg-[#DC2626]";
      case "missing": return "bg-[#D1D5DB]";
      case "future": return "bg-[#E5E3DF] border border-dashed border-[#D1D5DB]";
      default: return "bg-[#E5E3DF]";
    }
  };

  const hasStats = totalReports > 0;

  return (
    <>
      <div
        className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
          isDone
            ? isAbsent
              ? "border-[#FECACA] hover:shadow-md"
              : "border-[#A7F3D0] hover:shadow-md"
            : "border-[#E5E3DF] hover:shadow-lg hover:-translate-y-0.5"
        }`}
        style={{
          borderRightWidth: '3px',
          borderRightColor: isDone
            ? isAbsent ? '#DC2626' : '#059669'
            : '#0C5C5E',
        }}
      >
        <div className="p-4">
          {/* Row 1: Name + Track + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`text-[16px] font-bold leading-tight truncate ${
                  isDone && !isAbsent ? "text-[#374151]/70" : "text-[#1F2937]"
                }`}>
                  {isDone && !isAbsent && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 -mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {student.fullName}
                </h4>

                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  isNoor
                    ? "bg-[#D97706]/10 text-[#92400E]"
                    : "bg-[#0C5C5E]/10 text-[#0C5C5E]"
                }`}>
                  {isNoor ? "نور البيان" : "قرآن"}
                </span>

                {student.studentCode === "7500" && (
                  <span className="shrink-0 rounded-md bg-[#DBEAFE] px-1.5 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                    تجريبي
                  </span>
                )}

                {/* Missing days alert badge on header */}
                {missingDateKeys.length > 0 && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-md">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{missingDateKeys.length} يوم ناقص</span>
                  </span>
                )}
              </div>

              {/* Circle name - subtle */}
              {student.circleName && (
                <p className="text-[12px] text-[#9CA3AF] mt-0.5 truncate">
                  {student.circleName}
                </p>
              )}
            </div>

            {/* Status badge */}
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 ${
              isDone
                ? isAbsent
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : "bg-[#D1FAE5] text-[#059669]"
                : "bg-[#FEF3C7] text-[#D97706]"
            }`}>
              {isDone ? (
                isAbsent ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>غائب</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>تم الرصد</span>
                  </>
                )
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>بانتظار الرصد</span>
                </>
              )}
            </span>
          </div>

          {/* Row 2: Micro Stats (Notion-style) */}
          {hasStats && (
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-[#E5E3DF]/50 text-[11px]">
              <span className={`font-semibold ${getAttendanceColor(attendanceRate)}`}>
                📊 {attendanceRate}%
              </span>
              <span className="text-[#D1D5DB]">|</span>
              <span className="font-medium text-[#6B7280]">
                📝 {totalReports} تقرير
              </span>
              {lastBehaviorGrade !== null && (
                <>
                  <span className="text-[#D1D5DB]">|</span>
                  <span className="text-[11px]">{renderStars(lastBehaviorGrade)}</span>
                </>
              )}
              {absentCount > 0 && (
                <>
                  <span className="text-[#D1D5DB]">|</span>
                  <span className="font-medium text-[#DC2626]">
                    {absentCount} غياب
                  </span>
                </>
              )}
            </div>
          )}

          {/* Row 3: Quick info + Actions */}
          <div className={`flex items-center justify-between ${hasStats ? 'mt-2.5 pt-2.5' : 'mt-3 pt-3'} border-t border-[#E5E3DF]/60`}>
            <div className="flex items-center gap-2">
              {/* More button - shows details */}
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-1 text-[12px] font-medium transition-colors duration-200 ease-out ${
                  showDetails ? "text-[#0C5C5E]" : "text-[#6B7280] hover:text-[#0C5C5E]"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showDetails ? (
                    <><polyline points="18 15 12 9 6 15"/></>
                  ) : (
                    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>
                  )}
                </svg>
                <span>{showDetails ? "إخفاء" : "التفاصيل"}</span>
              </button>

              {/* History button */}
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1 text-[12px] font-medium text-[#6B7280] hover:text-[#0C5C5E] transition-colors duration-200 ease-out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>السجل</span>
              </button>
            </div>

            {/* Primary action button */}
            <Link
              href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${selectedDateKey}`}
              className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-all duration-200 ease-out flex items-center gap-1.5 ${
                isDone
                  ? "bg-[#EDF5F4] text-[#0C5C5E] hover:bg-[#D4ECEB] border border-[#0C5C5E]/20"
                  : "bg-[#0C5C5E] text-white hover:bg-[#0A4D4F] shadow-xs hover:shadow-sm"
              }`}
            >
              {isDone ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>تعديل</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  <span>رصد التقرير</span>
                </>
              )}
            </Link>
          </div>

          {/* Expandable Quick Summary Section */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-[#E5E3DF]/60 space-y-3 animate-fadeIn">

              {/* Recent 7 Days Dots */}
              {recentDots.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#374151] mb-1.5">آخر 7 أيام:</p>
                  <div className="flex items-center gap-1.5">
                    {recentDots.map((dot, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className={`w-5 h-5 rounded-full ${getDotColor(dot)} flex items-center justify-center`}>
                          {dot === "present" && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          {dot === "absent" && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          )}
                        </div>
                        <span className="text-[9px] text-[#9CA3AF] font-medium">{recentDotLabels[i] || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance & Absence Stats */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
                <div className="text-[#6B7280]">
                  <span className="font-semibold text-[#374151]">آخر حضور: </span>
                  <span>{lastPresentReport?.dateKey || "لا يوجد"}</span>
                </div>
                {absentCount > 0 && (
                  <div className="text-[#DC2626]">
                    <span className="font-semibold">الغياب: </span>
                    <span>{absentCount} {absentCount <= 10 ? "مرات" : "مرة"}</span>
                  </div>
                )}
              </div>

              {/* Last lesson info */}
              {lastPresentReport && (
                <div className="text-[12px] text-[#374151] space-y-1">
                  {!isNoor ? (
                    <>
                      {lastPresentReport.quranNew && (
                        <p className="truncate">
                          <span className="text-[#059669] font-semibold">آخر حفظ:</span> {lastPresentReport.quranNew}
                        </p>
                      )}
                      {lastPresentReport.quranRevision && (
                        <p className="truncate">
                          <span className="text-[#D97706] font-semibold">آخر مراجعة:</span> {lastPresentReport.quranRevision}
                        </p>
                      )}
                    </>
                  ) : (
                    lastPresentReport.noorLearned && (
                      <p className="truncate">
                        <span className="text-[#059669] font-semibold">آخر درس:</span> {lastPresentReport.noorLearned}
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Missing days shortcuts */}
              {missingDateKeys.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {missingDateKeys.slice(0, 4).map((dKey) => (
                    <Link
                      key={dKey}
                      href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${dKey}`}
                      className="rounded-md border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#92400E] hover:bg-[#FDE68A] transition"
                    >
                      {dKey.slice(5)}
                    </Link>
                  ))}
                  {missingDateKeys.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#6B7280] hover:bg-[#E5E7EB] transition"
                    >
                      +{missingDateKeys.length - 4} المزيد
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Modal */}
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
