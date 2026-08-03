"use client";

import { useState } from "react";
import Link from "next/link";
import StudentHistoryModal from "./StudentHistoryModal";

type Priority = "urgent" | "normal" | "done";

type TeacherStudentCardProps = {
  student: {
    id: string;
    fullName: string;
    studentCode?: string | null;
    summerGroup: string | null;
  };
  selectedDateKey: string;
  todayStr: string;
  reportForSelectedDate?: {
    id: string;
    status: string;
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
  priority: Priority;
  priorityReasons: string[];
};

const PRIORITY_CONFIG = {
  urgent: { border: "#DC2626", dot: "bg-[#DC2626]", label: "عاجل", labelColor: "text-[#DC2626]" },
  normal: { border: "#0C5C5E", dot: "bg-[#D97706]", label: "بانتظار", labelColor: "text-[#D97706]" },
  done: { border: "#059669", dot: "bg-[#059669]", label: "تم", labelColor: "text-[#059669]" },
} as const;

export default function TeacherStudentCard({
  student, selectedDateKey, reportForSelectedDate, lastPresentReport,
  missingDateKeys, attendanceRate, totalReports, absentCount,
  lastBehaviorGrade, recentDots, recentDotLabels, priority, priorityReasons,
}: TeacherStudentCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const isDone = Boolean(reportForSelectedDate);
  const isAbsent = isDone && reportForSelectedDate?.status === "ABSENT";
  const isNoor = student.summerGroup === "NOOR_AL_BAYAN";
  const hasStats = totalReports > 0;
  const cfg = isAbsent ? { ...PRIORITY_CONFIG.done, border: "#DC2626" } : PRIORITY_CONFIG[priority];

  const attColor = attendanceRate >= 85 ? "text-[#059669]" : attendanceRate >= 60 ? "text-[#0C5C5E]" : "text-[#DC2626]";
  const stars = (g: number | null) => g === null ? null : <span className="text-[#D97706]">{"★".repeat(Math.min(5, Math.max(1, g)))}{"☆".repeat(5 - Math.min(5, Math.max(1, g)))}</span>;
  const dotColor = (s: string) => s === "present" ? "bg-[#059669]" : s === "absent" ? "bg-[#DC2626]" : "bg-[#D1D5DB]";

  return (
    <>
      <div className={`bg-white rounded-xl border transition-all duration-150 ease-out overflow-hidden ${
        isDone ? (isAbsent ? "border-[#FECACA]" : "border-[#A7F3D0]") : priority === "urgent" ? "border-[#FECACA] hover:shadow-md hover:-translate-y-px" : "border-[#E5E3DF] hover:shadow-md hover:-translate-y-px"
      }`} style={{ borderRightWidth: '3px', borderRightColor: cfg.border }}>
        <div className="px-3.5 py-2.5">
          {/* Name + Priority */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isDone && !isAbsent && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              <h4 className={`text-[14px] font-bold leading-tight truncate ${isDone && !isAbsent ? "text-[#374151]/50" : "text-[#1F2937]"}`}>{student.fullName}</h4>
              <span className={`shrink-0 rounded px-1.5 py-px text-[9px] font-semibold ${isNoor ? "bg-[#D97706]/10 text-[#92400E]" : "bg-[#0C5C5E]/8 text-[#0C5C5E]"}`}>
                {isNoor ? "نور البيان" : "قرآن"}
              </span>
              {student.studentCode === "7500" && <span className="shrink-0 rounded bg-[#DBEAFE] px-1 py-px text-[8px] font-bold text-[#1E40AF]">تجريبي</span>}
            </div>
            {/* Priority indicator */}
            <span className={`shrink-0 text-[10px] font-bold flex items-center gap-1 ${cfg.labelColor}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {isAbsent ? "غائب" : cfg.label}
            </span>
          </div>

          {/* Priority reasons (urgent only) */}
          {priority === "urgent" && !isDone && priorityReasons.length > 0 && (
            <p className="text-[10px] text-[#DC2626] font-semibold mt-1 leading-tight">
              {priorityReasons.join(" • ")}
            </p>
          )}

          {/* Stats line */}
          {hasStats && (
            <p className="text-[10px] text-[#6B7280] mt-1 leading-none flex items-center flex-wrap gap-y-0.5">
              <span className={`font-semibold ${attColor}`}>{attendanceRate}%</span>
              <span className="text-[#D1D5DB] mx-1">•</span>
              <span>{totalReports} تقرير</span>
              {lastBehaviorGrade !== null && (<><span className="text-[#D1D5DB] mx-1">•</span>{stars(lastBehaviorGrade)}</>)}
              {absentCount > 0 && (<><span className="text-[#D1D5DB] mx-1">•</span><span className="text-[#DC2626]">{absentCount} غياب</span></>)}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F4F6]">
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setShowDetails(!showDetails)}
                className={`text-[10px] font-medium transition-colors duration-150 ${showDetails ? "text-[#0C5C5E]" : "text-[#6B7280]/70 hover:text-[#0C5C5E]"}`}>
                {showDetails ? "إخفاء" : "التفاصيل"}
              </button>
              <span className="text-[#E5E3DF] text-[10px]">·</span>
              <button type="button" onClick={() => setShowHistory(true)}
                className="text-[10px] font-medium text-[#6B7280]/70 hover:text-[#0C5C5E] transition-colors duration-150">
                السجل
              </button>
              <span className="text-[#E5E3DF] text-[10px]">·</span>
              <Link href={`/onsite/summer/parent-report/${student.studentCode || student.id}`} target="_blank"
                className="text-[10px] font-medium text-[#0C5C5E]/80 hover:text-[#0C5C5E] transition-colors duration-150 flex items-center gap-0.5">
                <span>التقرير</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </Link>
            </div>
            <Link href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${selectedDateKey}`}
              className={`rounded-lg px-4 py-[7px] text-[13px] font-bold transition-all duration-150 ease-out ${
                isDone ? "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]" : "bg-[#0C5C5E] text-white hover:bg-[#0A4D4F] shadow-sm hover:shadow"
              }`}>
              {isDone ? "تعديل" : "رصد التقرير"}
            </Link>
          </div>

          {/* Expandable */}
          {showDetails && (
            <div className="mt-2 pt-2 border-t border-[#F3F4F6] space-y-2 animate-fadeIn">
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
              {missingDateKeys.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {missingDateKeys.slice(0, 5).map((dKey) => (
                    <Link key={dKey} href={`/onsite/summer/teacher/reports/${student.id}?dateKey=${dKey}`}
                      className="rounded border border-[#FDE68A] bg-[#FFFBEB] px-1.5 py-px text-[9px] font-semibold text-[#92400E] hover:bg-[#FDE68A] transition-colors duration-150">
                      {dKey.slice(5)}
                    </Link>
                  ))}
                  {missingDateKeys.length > 5 && (
                    <button type="button" onClick={() => setShowHistory(true)}
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
      {showHistory && <StudentHistoryModal studentId={student.id} studentName={student.fullName} onClose={() => setShowHistory(false)} />}
    </>
  );
}
