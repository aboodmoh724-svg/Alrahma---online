"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QURAN_SURAHS, getSurahByName } from "@/lib/quran-metadata";

type PreviousReport = {
  id: string;
  status: "PRESENT" | "ABSENT";
  lessonName: string;
  lessonSurah: string | null;
  pageFrom: number | null;
  pageTo: number | null;
  review: string | null;
  reviewSurah: string | null;
  reviewFrom: number | null;
  reviewTo: number | null;
  nextHomework: string | null;
  nextLessonHomework: string | null;
  nextReviewHomework: string | null;
  note: string | null;
};

type Student = {
  id: string;
  fullName: string;
  parentWhatsapp: string | null;
  parentEmail: string | null;
  lastReport: PreviousReport | null;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  zoomUrl: string | null;
};

type Teacher = {
  id: string;
  fullName: string;
};

type CircleSessionClientProps = {
  circle: Circle;
  students: Student[];
  teacher: Teacher;
};

type QuranMark = {
  surah: string;
  page: number;
  ayah: number;
  type: "tajweed_error" | "warning" | "hesitation" | "stutter";
  word?: string;
};

type StudentDraft = {
  studentId: string;
  isAbsent: boolean;
  lessonSurah: string;
  pageFrom: string;
  pageTo: string;
  pagesCount: string;
  lessonMemorized: string;
  lessonErrors: number;
  lessonWarnings: number;
  lessonHasHesitation: boolean;
  
  lastFiveMemorized: string;
  lastFiveErrors: number;
  lastFiveWarnings: number;
  lastFiveHasHesitation: boolean;

  reviewSurah: string;
  reviewFrom: string;
  reviewTo: string;
  reviewPagesCount: string;
  reviewMemorized: boolean;
  reviewErrors: number;
  reviewWarnings: number;

  nextLessonStartSurah: string;
  nextLessonEndSurah: string;
  nextLessonFrom: string;
  nextLessonTo: string;
  nextLessonPagesCount: string;

  nextReviewStartSurah: string;
  nextReviewEndSurah: string;
  nextReviewFrom: string;
  nextReviewTo: string;
  nextReviewPagesCount: string;

  note: string;
  quranMarks: QuranMark[];
  
  lessonCompleted: boolean;
  lastFiveCompleted: boolean;
  reviewCompleted: boolean;
};

const surahNames = QURAN_SURAHS.map((s) => s.name);

const inputClass =
  "w-full rounded-2xl border border-[#d8bf83] bg-white px-3 py-2 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#0f5a35] focus:ring-2 focus:ring-[#0f5a35]/10";

const notePresets = [
  "ممتاز ومتابع بشكل جيد.",
  "يحتاج إلى مزيد من المراجعة اليومية.",
  "مستواه جيد لكن يحتاج إلى تثبيت الحفظ.",
  "نرجو متابعة ولي الأمر للواجب بشكل يومي.",
  "يوجد تشتت أثناء الحلقة ويحتاج إلى تركيز أكبر.",
  "تحسن واضح عن الحصص السابقة.",
];

export default function CircleSessionClient({
  circle,
  students,
  teacher,
}: CircleSessionClientProps) {
  const router = useRouter();
  const isRubaiTrack = circle.track === "RUBAI";

  // Helper to parse student homework ranges
  function parseHomeworkRange(value: string) {
    const text = value.trim();
    if (!text) return { startSurah: "", endSurah: "", from: "", to: "", pagesCount: "" };
    const normalizedText = text.replace(/\(([^)]+)\)/g, " الآية $1");

    const pagesCount = normalizedText.match(/عدد الصفحات:\s*([0-9]+)/)?.[1] || "";
    const crossSurahMatch = normalizedText.match(
      /من سورة\s+(.+?)(?:\s+(?:الآية\s+)?([0-9]+))?\s+إلى سورة\s+(.+?)(?:\s+(?:الآية\s+)?([0-9]+))?/
    );

    if (crossSurahMatch) {
      return {
        startSurah: crossSurahMatch[1]?.trim() || "",
        endSurah: crossSurahMatch[3]?.trim() || "",
        from: crossSurahMatch[2]?.trim() || "",
        to: crossSurahMatch[4]?.trim() || "",
        pagesCount,
      };
    }

    const surah = normalizedText.match(/سورة\s+(.+?)(?:\s+-|$)/)?.[1]?.trim() || "";
    const range = normalizedText.match(/من(?:\s+الآية)?\s+(.+?)\s+إلى(?:\s+الآية)?\s+(.+?)(?:\s+-|$)/);

    return {
      startSurah: surah,
      endSurah: surah,
      from: range?.[1]?.trim() || "",
      to: range?.[2]?.trim() || "",
      pagesCount,
    };
  }

  // Initialize drafts for each student
  const initialDrafts = useMemo(() => {
    const drafts: Record<string, StudentDraft> = {};
    students.forEach((student) => {
      const prevLessonHomework = student.lastReport?.nextLessonHomework || "";
      const prevReviewHomework = student.lastReport?.nextReviewHomework || "";
      
      const parsedLesson = parseHomeworkRange(prevLessonHomework);
      const parsedReview = parseHomeworkRange(prevReviewHomework);

      drafts[student.id] = {
        studentId: student.id,
        isAbsent: false,
        lessonSurah: parsedLesson.startSurah || student.lastReport?.lessonSurah || "",
        pageFrom: String(student.lastReport?.pageFrom || parsedLesson.from || ""),
        pageTo: String(student.lastReport?.pageTo || parsedLesson.to || ""),
        pagesCount: parsedLesson.pagesCount || "",
        lessonMemorized: "",
        lessonErrors: 0,
        lessonWarnings: 0,
        lessonHasHesitation: false,
        
        lastFiveMemorized: "",
        lastFiveErrors: 0,
        lastFiveWarnings: 0,
        lastFiveHasHesitation: false,

        reviewSurah: parsedReview.startSurah || student.lastReport?.reviewSurah || "",
        reviewFrom: String(student.lastReport?.reviewFrom || parsedReview.from || ""),
        reviewTo: String(student.lastReport?.reviewTo || parsedReview.to || ""),
        reviewPagesCount: parsedReview.pagesCount || "",
        reviewMemorized: true,
        reviewErrors: 0,
        reviewWarnings: 0,

        nextLessonStartSurah: "",
        nextLessonEndSurah: "",
        nextLessonFrom: "",
        nextLessonTo: "",
        nextLessonPagesCount: "",

        nextReviewStartSurah: "",
        nextReviewEndSurah: "",
        nextReviewFrom: "",
        nextReviewTo: "",
        nextReviewPagesCount: "",

        note: "",
        quranMarks: [],
        
        lessonCompleted: false,
        lastFiveCompleted: false,
        reviewCompleted: false,
      };
    });
    return drafts;
  }, [students]);

  const [sessionDrafts, setSessionDrafts] = useState<Record<string, StudentDraft>>(initialDrafts);
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || "");
  const [activeSection, setActiveSection] = useState<"LESSON" | "LAST_FIVE" | "REVIEW">("LESSON");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync Broadcast Channel Setup
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("alrahma-quran-sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "SYNC_DRAFTS" || type === "UPDATE_DRAFTS") {
        if (payload.drafts) {
          setSessionDrafts(payload.drafts);
        }
      }
      if (type === "SYNC_DRAFTS" || type === "SET_ACTIVE_STUDENT") {
        if (payload.studentId) {
          setActiveStudentId(payload.studentId);
        }
      }
      if (type === "SYNC_DRAFTS" || type === "SET_ACTIVE_SECTION") {
        if (payload.activeSection) {
          setActiveSection(payload.activeSection);
        }
      }
      if (type === "REQUEST_SYNC") {
        // Send state to the newly opened Quran tab
        channel.postMessage({
          type: "SYNC_DRAFTS",
          payload: {
            drafts: sessionDrafts,
            activeStudentId,
            activeSection,
          }
        });
      }
    };

    return () => {
      channel.close();
    };
  }, [sessionDrafts, activeStudentId, activeSection]);

  const handleSelectStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    channelRef.current?.postMessage({
      type: "SET_ACTIVE_STUDENT",
      payload: { studentId }
    });
  };

  const handleSelectSection = (section: "LESSON" | "LAST_FIVE" | "REVIEW") => {
    setActiveSection(section);
    channelRef.current?.postMessage({
      type: "SET_ACTIVE_SECTION",
      payload: { activeSection: section }
    });
  };

  const activeDraft = useMemo(() => {
    return sessionDrafts[activeStudentId] || null;
  }, [sessionDrafts, activeStudentId]);

  // Update a field in the draft of a student
  const updateDraftField = (
    studentId: string,
    field: keyof StudentDraft,
    value: any
  ) => {
    setSessionDrafts((prev) => {
      const studentDraft = { ...prev[studentId] };
      (studentDraft as any)[field] = value;
      
      // Auto compute review status if errors/warnings change
      if (field === "reviewErrors" || field === "reviewWarnings") {
        const errors = field === "reviewErrors" ? value : studentDraft.reviewErrors;
        const warnings = field === "reviewWarnings" ? value : studentDraft.reviewWarnings;
        studentDraft.reviewMemorized = errors <= 3 && warnings <= 6;
      }

      const newDrafts = {
        ...prev,
        [studentId]: studentDraft,
      };

      // Broadcast to Quran tab
      channelRef.current?.postMessage({
        type: "UPDATE_DRAFTS",
        payload: { drafts: newDrafts }
      });

      return newDrafts;
    });
  };

  // Remove a specific Quran mark directly from here
  const removeQuranMark = (index: number) => {
    if (!activeDraft) return;

    const markToRemove = activeDraft.quranMarks[index];
    const updatedMarks = activeDraft.quranMarks.filter((_, i) => i !== index);

    let updatedFields: Partial<StudentDraft> = { quranMarks: updatedMarks };

    // Decrement counters accordingly
    if (activeSection === "LESSON") {
      if (markToRemove.type === "tajweed_error") {
        updatedFields.lessonErrors = Math.max(0, activeDraft.lessonErrors - 1);
      } else if (markToRemove.type === "warning") {
        updatedFields.lessonWarnings = Math.max(0, activeDraft.lessonWarnings - 1);
      }
    } else if (activeSection === "LAST_FIVE") {
      if (markToRemove.type === "tajweed_error") {
        updatedFields.lastFiveErrors = Math.max(0, activeDraft.lastFiveErrors - 1);
      } else if (markToRemove.type === "warning") {
        updatedFields.lastFiveWarnings = Math.max(0, activeDraft.lastFiveWarnings - 1);
      }
    } else if (activeSection === "REVIEW") {
      if (markToRemove.type === "tajweed_error") {
        updatedFields.reviewErrors = Math.max(0, activeDraft.reviewErrors - 1);
      } else if (markToRemove.type === "warning") {
        updatedFields.reviewWarnings = Math.max(0, activeDraft.reviewWarnings - 1);
      }
    }

    const newDrafts = {
      ...sessionDrafts,
      [activeStudentId]: {
        ...sessionDrafts[activeStudentId],
        ...updatedFields,
      }
    };

    setSessionDrafts(newDrafts);
    channelRef.current?.postMessage({
      type: "UPDATE_DRAFTS",
      payload: { drafts: newDrafts }
    });
  };

  // Format homework range for final submission
  const buildHomeworkRangeStr = ({
    startSurah,
    endSurah,
    from,
    to,
    pagesCount,
  }: {
    startSurah: string;
    endSurah: string;
    from: string;
    to: string;
    pagesCount: string;
  }) => {
    const start = startSurah.trim();
    const end = endSurah.trim();
    const fromText = from.trim();
    const toText = to.trim();
    const pagesText = pagesCount.trim();

    if (!start && !end && !fromText && !toText && !pagesText) {
      return "";
    }

    const isCrossSurah = Boolean(start && end && start !== end);
    const surahText = isCrossSurah
      ? [
          `من سورة ${start}${fromText ? ` الآية ${fromText}` : ""}`,
          `إلى سورة ${end}${toText ? ` الآية ${toText}` : ""}`,
        ].join(" ")
      : start || end
        ? `سورة ${start || end}`
        : "";

    const rangeText = isCrossSurah
      ? ""
      : fromText || toText
        ? `من الآية ${fromText || "-"} إلى الآية ${toText || "-"}`
        : "";
    const pagesLabel = pagesText ? `عدد الصفحات: ${pagesText}` : "";

    return [surahText, rangeText, pagesLabel].filter(Boolean).join(" - ");
  };

  // Submit all reports at once
  const handleBulkSubmit = async () => {
    setSubmitting(true);
    
    const reportsPayload = students.map((student) => {
      const draft = sessionDrafts[student.id];

      const nextLessonHomework = buildHomeworkRangeStr({
        startSurah: draft.nextLessonStartSurah,
        endSurah: draft.nextLessonEndSurah,
        from: draft.nextLessonFrom,
        to: draft.nextLessonTo,
        pagesCount: draft.nextLessonPagesCount,
      });

      const nextReviewHomework = buildHomeworkRangeStr({
        startSurah: draft.nextReviewStartSurah,
        endSurah: draft.nextReviewEndSurah,
        from: draft.nextReviewFrom,
        to: draft.nextReviewTo,
        pagesCount: draft.nextReviewPagesCount,
      });

      const nextHomework = [
        nextLessonHomework ? `الدرس الجديد: ${nextLessonHomework}` : "",
        nextReviewHomework ? `المراجعة: ${nextReviewHomework}` : "",
      ].filter(Boolean).join(" | ");

      const lessonName = draft.isAbsent
        ? "غياب"
        : `الدرس الجديد: سورة ${draft.lessonSurah}`;

      const reviewText = draft.reviewSurah || draft.reviewFrom || draft.reviewTo
        ? `سورة ${draft.reviewSurah} من الآية ${draft.reviewFrom || "-"} إلى الآية ${draft.reviewTo || "-"}`
        : "";

      return {
        studentId: student.id,
        status: draft.isAbsent ? "ABSENT" : "PRESENT",
        lessonName,
        lessonSurah: draft.lessonSurah,
        pageFrom: draft.pageFrom ? parseInt(draft.pageFrom) : null,
        pageTo: draft.pageTo ? parseInt(draft.pageTo) : null,
        pagesCount: draft.pagesCount ? parseInt(draft.pagesCount) : null,
        lessonMemorized: draft.isAbsent ? null : (draft.lessonErrors === 0 && draft.lessonWarnings === 0 && !draft.lessonHasHesitation),
        lessonErrors: draft.lessonErrors,
        lessonWarnings: draft.lessonWarnings,
        lessonHasHesitation: draft.lessonHasHesitation,
        
        lastFiveMemorized: isRubaiTrack ? (draft.lastFiveErrors === 0 && draft.lastFiveWarnings === 0 && !draft.lastFiveHasHesitation) : null,
        lastFiveErrors: isRubaiTrack ? draft.lastFiveErrors : 0,
        lastFiveWarnings: isRubaiTrack ? draft.lastFiveWarnings : 0,
        lastFiveHasHesitation: isRubaiTrack ? draft.lastFiveHasHesitation : false,

        review: reviewText,
        reviewSurah: draft.reviewSurah,
        reviewFrom: draft.reviewFrom ? parseInt(draft.reviewFrom) : null,
        reviewTo: draft.reviewTo ? parseInt(draft.reviewTo) : null,
        reviewPagesCount: draft.reviewPagesCount ? parseInt(draft.reviewPagesCount) : null,
        reviewMemorized: draft.reviewMemorized,
        reviewErrors: draft.reviewErrors,
        reviewWarnings: draft.reviewWarnings,
        reviewPenaltyScore: draft.reviewErrors * 2 + draft.reviewWarnings,

        homework: student.lastReport?.nextHomework || "-",
        nextHomework,
        nextLessonHomework,
        nextReviewHomework,
        note: draft.note,
        quranMarks: draft.quranMarks,
      };
    });

    try {
      const res = await fetch("/api/reports/bulk-parent-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          circleId: circle.id,
          reports: reportsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء حفظ تقارير الحلقة");
        return;
      }

      alert("تم حفظ تقارير الحلقة بالكامل وإرسالها لأولياء الأمور عبر الواتساب بنجاح!");
      router.push(`/remote/teacher/dashboard?circleId=${circle.id}`);
      router.refresh();
    } catch (error) {
      console.error("BULK SUBMIT ERROR =>", error);
      alert("حدث خطأ في الاتصال بالخادم أثناء حفظ التقارير");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rahma-shell min-h-screen bg-[#faf6f0] px-4 py-4 flex flex-col" dir="rtl">
      {/* Top Header */}
      <header className="mb-4 flex flex-col gap-4 rounded-3xl bg-[#0a3f2a] p-4 text-white shadow-md md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold text-[#f2d18a]">{circle.name}</span>
          <h1 className="text-xl font-black md:text-2xl">لوحة متابعة ورصد تقارير الحلقة</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {circle.zoomUrl && (
            <a
              href={circle.zoomUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
            >
              <span>🎥 بدء درس الزوم</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => window.open(`/remote/teacher/quran?circleId=${circle.id}`, "_blank")}
            className="flex items-center gap-2 rounded-xl bg-[#bd8f2d] hover:bg-[#a37a24] px-4 py-2 text-xs font-black text-white transition-all shadow-md hover:scale-[1.02] active:scale-95 duration-150"
          >
            <span>📖 فتح المصحف التفاعلي (شاشة مستقلة)</span>
          </button>

          <Link
            href={`/remote/teacher/dashboard?circleId=${circle.id}`}
            className="rounded-xl bg-white/15 px-4 py-2 text-xs font-black text-white hover:bg-white/25 transition"
          >
            رجوع
          </Link>
        </div>
      </header>

      {/* Main Grid Layout: Right side is Student List, Left is Form details */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr] flex-1">
        
        {/* Right Side: Student List Cards */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-[#d8bf83]/50 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-black text-[#1c2d31] border-b border-[#f6eee7] pb-2">طلاب الحلقة ({students.length})</h3>
            
            <div className="grid gap-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
              {students.map((student) => {
                const draft = sessionDrafts[student.id];
                if (!draft) return null;
                const isActive = activeStudentId === student.id;
                
                // Count completed tasks
                const completedCount = [
                  draft.isAbsent ? true : (draft.lessonErrors > 0 || draft.lessonWarnings > 0 || draft.lessonCompleted),
                  isRubaiTrack ? (draft.isAbsent ? true : (draft.lastFiveErrors > 0 || draft.lastFiveWarnings > 0 || draft.lastFiveCompleted)) : true,
                  draft.isAbsent ? true : (draft.reviewErrors > 0 || draft.reviewWarnings > 0 || draft.reviewCompleted),
                ].filter(Boolean).length;

                const maxTasks = isRubaiTrack ? 3 : 2;

                return (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student.id)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 ${
                      isActive
                        ? "border-[#0f5a35] bg-[#fffaf4] shadow-md ring-2 ring-[#0f5a35]/20"
                        : "border-[#e7d7b4]/40 bg-[#fffaf4]/40 hover:bg-[#fffaf4]/85"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-[#1c2d31]">{student.fullName}</h4>
                      <div className="flex items-center gap-1.5">
                        {draft.isAbsent ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700">غائب</span>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                            completedCount === maxTasks ? "bg-emerald-100 text-emerald-700" : "bg-[#f6eee7] text-[#8a661f]"
                          }`}>
                            {completedCount}/{maxTasks}
                          </span>
                        )}
                        <input
                          type="radio"
                          checked={isActive}
                          onChange={() => handleSelectStudent(student.id)}
                          className="accent-[#0f5a35]"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] text-[#1c2d31]/60 truncate">
                      المطلوب: {student.lastReport?.nextLessonHomework || "غير محدد"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Left Side: Detailed Report Form */}
        <section className="space-y-4 flex flex-col flex-1">
          {activeDraft ? (
            <div className="rounded-3xl border border-[#d8bf83]/50 bg-white p-6 shadow-sm space-y-6 flex-1 flex flex-col">
              
              {/* Header and Absent Switch */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f6eee7] pb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#bd8f2d]">تعبئة وحفظ تقرير الطالب اليومي</span>
                  <h2 className="text-lg font-black text-[#1c2d31]">
                    الطالب: {students.find(s => s.id === activeStudentId)?.fullName}
                  </h2>
                </div>

                <label className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-xs font-black text-red-800 cursor-pointer transition hover:bg-red-100/80 active:scale-95">
                  <input
                    type="checkbox"
                    checked={activeDraft.isAbsent}
                    onChange={(e) => updateDraftField(activeStudentId, "isAbsent", e.target.checked)}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <span>تسجيل الطالب غائباً اليوم</span>
                </label>
              </div>

              {!activeDraft.isAbsent ? (
                <div className="space-y-6 flex-1">
                  
                  {/* Grid for Section Tabs and Counters */}
                  <div className="grid gap-6 md:grid-cols-[1fr_250px]">
                    
                    {/* Left: Section Details and Inputs */}
                    <div className="space-y-4">
                      {/* Section Tabs */}
                      <div>
                        <label className="mb-2 block text-xs font-black text-[#1c2d31]">القسم النشط الحالي لتسجيل البيانات:</label>
                        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#f6eee7] p-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectSection("LESSON")}
                            className={`rounded-xl py-2.5 text-xs font-black transition ${
                              activeSection === "LESSON" ? "bg-[#0f5a35] text-white shadow-sm" : "text-[#1c2d31]/80 hover:bg-white/40"
                            }`}
                          >
                            الدرس الجديد
                          </button>
                          {isRubaiTrack && (
                            <button
                              type="button"
                              onClick={() => handleSelectSection("LAST_FIVE")}
                              className={`rounded-xl py-2.5 text-xs font-black transition ${
                                activeSection === "LAST_FIVE" ? "bg-[#0f5a35] text-white shadow-sm" : "text-[#1c2d31]/80 hover:bg-white/40"
                              }`}
                            >
                              آخر 5 صفحات
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectSection("REVIEW")}
                            className={`rounded-xl py-2.5 text-xs font-black transition ${
                              activeSection === "REVIEW" ? "bg-[#0f5a35] text-white shadow-sm" : "text-[#1c2d31]/80 hover:bg-white/40"
                            }`}
                          >
                            المراجعة
                          </button>
                        </div>
                      </div>

                      {/* Section Inputs depending on Selection */}
                      {activeSection === "LESSON" && (
                        <div className="rounded-2xl border border-[#0f5a35]/15 bg-[#0f5a35]/5 p-4 space-y-4">
                          <h3 className="text-xs font-black text-[#0f5a35] flex items-center gap-1">
                            <span>🟢</span>
                            الدرس الجديد الحالي للمستمع
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <SurahInput
                              label="سورة الدرس"
                              value={activeDraft.lessonSurah}
                              onChange={(val) => updateDraftField(activeStudentId, "lessonSurah", val)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="mb-1 block text-xs font-bold text-[#1c2d31]">من صفحة</label>
                                <input
                                  type="number"
                                  value={activeDraft.pageFrom}
                                  onChange={(e) => updateDraftField(activeStudentId, "pageFrom", e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-[#1c2d31]">إلى صفحة</label>
                                <input
                                  type="number"
                                  value={activeDraft.pageTo}
                                  onChange={(e) => updateDraftField(activeStudentId, "pageTo", e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 border-t border-[#0f5a35]/10 pt-3">
                            <CounterInput
                              label="عدد الأخطاء"
                              value={activeDraft.lessonErrors}
                              onChange={(val) => updateDraftField(activeStudentId, "lessonErrors", val)}
                            />
                            <CounterInput
                              label="عدد التنبيهات"
                              value={activeDraft.lessonWarnings}
                              onChange={(val) => updateDraftField(activeStudentId, "lessonWarnings", val)}
                            />
                            <div className="flex flex-col justify-end pb-2.5">
                              <label className="flex items-center gap-2 text-xs font-bold text-[#1c2d31] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={activeDraft.lessonHasHesitation}
                                  onChange={(e) => updateDraftField(activeStudentId, "lessonHasHesitation", e.target.checked)}
                                  className="accent-[#0f5a35] h-4 w-4"
                                />
                                <span>تردد/تلكؤ</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSection === "LAST_FIVE" && isRubaiTrack && (
                        <div className="rounded-2xl border border-[#bd8f2d]/15 bg-[#bd8f2d]/5 p-4 space-y-4">
                          <h3 className="text-xs font-black text-[#bd8f2d] flex items-center gap-1">
                            <span>🟡</span>
                            تسميع آخر 5 صفحات
                          </h3>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <CounterInput
                              label="الأخطاء"
                              value={activeDraft.lastFiveErrors}
                              onChange={(val) => updateDraftField(activeStudentId, "lastFiveErrors", val)}
                            />
                            <CounterInput
                              label="التنبيهات"
                              value={activeDraft.lastFiveWarnings}
                              onChange={(val) => updateDraftField(activeStudentId, "lastFiveWarnings", val)}
                            />
                            <div className="flex flex-col justify-end pb-2.5">
                              <label className="flex items-center gap-2 text-xs font-bold text-[#1c2d31] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={activeDraft.lastFiveHasHesitation}
                                  onChange={(e) => updateDraftField(activeStudentId, "lastFiveHasHesitation", e.target.checked)}
                                  className="accent-[#bd8f2d] h-4 w-4"
                                />
                                <span>تردد/تلكؤ</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSection === "REVIEW" && (
                        <div className="rounded-2xl border border-[#8a661f]/15 bg-[#8a661f]/5 p-4 space-y-4">
                          <h3 className="text-xs font-black text-[#8a661f] flex items-center gap-1">
                            <span>🟤</span>
                            مراجعة الورد المحدد
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <SurahInput
                              label="سورة المراجعة"
                              value={activeDraft.reviewSurah}
                              onChange={(val) => updateDraftField(activeStudentId, "reviewSurah", val)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="mb-1 block text-xs font-bold text-[#1c2d31]">من صفحة</label>
                                <input
                                  type="number"
                                  value={activeDraft.reviewFrom}
                                  onChange={(e) => updateDraftField(activeStudentId, "reviewFrom", e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-bold text-[#1c2d31]">إلى صفحة</label>
                                <input
                                  type="number"
                                  value={activeDraft.reviewTo}
                                  onChange={(e) => updateDraftField(activeStudentId, "reviewTo", e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-[#8a661f]/10 pt-3">
                            <CounterInput
                              label="أخطاء المراجعة"
                              value={activeDraft.reviewErrors}
                              onChange={(val) => updateDraftField(activeStudentId, "reviewErrors", val)}
                            />
                            <CounterInput
                              label="تنبيهات المراجعة"
                              value={activeDraft.reviewWarnings}
                              onChange={(val) => updateDraftField(activeStudentId, "reviewWarnings", val)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Quran Marks Visual Feed */}
                    <div className="rounded-2xl border border-[#d8bf83]/30 bg-[#fffaf4]/50 p-4 flex flex-col min-h-[220px]">
                      <div className="border-b border-[#e7d7b4] pb-2 mb-3">
                        <h4 className="text-xs font-black text-[#1c2d31]">علامات المصحف التفاعلي</h4>
                        <span className="text-[9px] text-gray-400">العلامات المرصودة حالياً للقسم النشط:</span>
                      </div>

                      {/* Filter marks for current active section */}
                      {(() => {
                        const currentSectionMarks = activeDraft.quranMarks.filter((mark) => {
                          if (activeSection === "LESSON") {
                            return mark.surah === activeDraft.lessonSurah;
                          } else if (activeSection === "REVIEW") {
                            return mark.surah === activeDraft.reviewSurah;
                          }
                          return true; // LAST_FIVE showing all
                        });

                        if (currentSectionMarks.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center text-center p-4 flex-1 text-gray-400">
                              <span className="text-2xl mb-1">📖</span>
                              <p className="text-[10px] leading-5">
                                لم يتم رصد علامات في سورة هذا القسم بعد.
                              </p>
                              <button
                                type="button"
                                onClick={() => window.open(`/remote/teacher/quran?circleId=${circle.id}`, "_blank")}
                                className="mt-2 text-[9px] font-black text-[#0f5a35] underline"
                              >
                                افتح المصحف لرصد الأخطاء
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2 overflow-y-auto max-h-[220px] flex-1 pr-1">
                            {currentSectionMarks.map((mark, mIdx) => {
                              const typeLabels = {
                                tajweed_error: "خطأ تجويدي",
                                warning: "تنبيه تلقيني",
                                hesitation: "تردد",
                                stutter: "تلكؤ",
                              };

                              return (
                                <div
                                  key={mIdx}
                                  className="flex items-center justify-between rounded-xl bg-white px-2.5 py-2 text-[10px] text-gray-700 border border-gray-200 shadow-sm"
                                >
                                  <div>
                                    <span className="font-black text-[#0f5a35]">{mark.surah}</span>
                                    <span className="mx-1">آية {mark.ayah}</span>
                                    <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] text-amber-800 font-bold border border-amber-200">
                                      {typeLabels[mark.type]}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeQuranMark(mIdx)}
                                    className="font-bold text-red-500 hover:text-red-700"
                                  >
                                    حذف
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Notes & presets */}
                  <div className="border-t border-[#f6eee7] pt-4">
                    <label className="mb-2 block text-xs font-black text-[#1c2d31]">الملاحظات والتعليمات التربوية المرسلة لولي الأمر:</label>
                    <textarea
                      value={activeDraft.note}
                      onChange={(e) => updateDraftField(activeStudentId, "note", e.target.value)}
                      className="h-20 w-full rounded-2xl border border-[#d8bf83] bg-white p-3 text-right text-xs outline-none focus:border-[#0f5a35]"
                      placeholder="اكتب ملاحظاتك للطالب التي ستظهر في تقرير ولي الأمر..."
                    />

                    {/* Presets */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {notePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => updateDraftField(activeStudentId, "note", preset)}
                          className="rounded-lg bg-[#f6eee7] px-2.5 py-1.5 text-[10px] text-[#1c2d31]/80 hover:bg-[#bd8f2d]/10 transition"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Next Lesson Homework assignments */}
                  <div className="border-t border-[#f6eee7] pt-4 space-y-4">
                    <h3 className="text-sm font-black text-[#1c2d31]">تحديد واجب التسميع لليوم القادم</h3>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Next Lesson */}
                      <div className="rounded-2xl border border-[#0f5a35]/15 bg-[#0f5a35]/5 p-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-[#0f5a35]">واجب الدرس الجديد لليوم القادم</span>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={activeDraft.nextLessonStartSurah}
                            onChange={(e) => updateDraftField(activeStudentId, "nextLessonStartSurah", e.target.value)}
                            className="rounded-xl border border-[#d8bf83] bg-white px-2 py-1.5 text-center text-xs outline-none"
                          >
                            <option value="">السورة</option>
                            {surahNames.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input
                            type="number"
                            placeholder="الآية من"
                            value={activeDraft.nextLessonFrom}
                            onChange={(e) => updateDraftField(activeStudentId, "nextLessonFrom", e.target.value)}
                            className="rounded-xl border border-[#d8bf83] bg-white px-2 py-1.5 text-center text-xs outline-none"
                          />
                          <input
                            type="number"
                            placeholder="الآية إلى"
                            value={activeDraft.nextLessonTo}
                            onChange={(e) => updateDraftField(activeStudentId, "nextLessonTo", e.target.value)}
                            className="rounded-xl border border-[#d8bf83] bg-white px-2 py-1.5 text-center text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* Next Review */}
                      <div className="rounded-2xl border border-[#bd8f2d]/15 bg-[#bd8f2d]/5 p-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-[#bd8f2d]">واجب المراجعة لليوم القادم</span>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={activeDraft.nextReviewStartSurah}
                            onChange={(e) => updateDraftField(activeStudentId, "nextReviewStartSurah", e.target.value)}
                            className="rounded-xl border border-[#d8bf83] bg-white px-2 py-1.5 text-center text-xs outline-none"
                          >
                            <option value="">السورة</option>
                            {surahNames.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input
                            type="number"
                            placeholder="الآية من"
                            value={activeDraft.nextReviewFrom}
                            onChange={(e) => updateDraftField(activeStudentId, "nextReviewFrom", e.target.value)}
                            className="rounded-xl border border-[#d8bf83] bg-white px-2 py-1.5 text-center text-xs outline-none"
                          />
                          <input
                            type="number"
                            placeholder="الآية إلى"
                            value={activeDraft.nextReviewTo}
                            onChange={(e) => updateDraftField(activeStudentId, "nextReviewTo", e.target.value)}
                            className="rounded-xl border border-[#d8bf83] bg-white px-2 py-1.5 text-center text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center text-sm text-red-600 bg-red-50 rounded-2xl font-black border border-red-200 flex-1 flex flex-col justify-center items-center">
                  <span className="text-4xl mb-2">🛑</span>
                  تم تسجيل غياب هذا الطالب اليوم.
                  <p className="mt-1 text-xs text-red-500/80">
                    سيتم إرسال تقرير الغياب التلقائي لولي الأمر بعد الضغط على زر الحفظ النهائي للحلقة.
                  </p>
                </div>
              )}

              {/* Bottom Bulk Submit Action for all student reports */}
              <div className="border-t border-[#f6eee7] pt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-bold">
                  * يتم حفظ كل التعديلات بشكل تلقائي. عند انتهاء الحلقة، اضغط على الزر لحفظ تقارير جميع الطلاب معاً.
                </span>
                
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={submitting}
                  className="rounded-[1.5rem] bg-[#0a3f2a] hover:bg-[#0f5a35] px-8 py-4 text-center text-sm font-black text-[#f2d18a] transition shadow-lg disabled:opacity-50 active:scale-95 duration-100"
                >
                  {submitting ? "جاري الحفظ الموحد وإرسال التقارير..." : "✓ حفظ وإرسال تقارير الحلقة كاملة دفعة واحدة"}
                </button>
              </div>

            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-gray-400 flex-1 flex flex-col justify-center items-center">
              اختر طالباً من قائمة الطلاب للبدء في تعبئة التقرير.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// Sub components helpers
function SurahInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-[#1c2d31]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">اختر السورة</option>
        {surahNames.map((surah) => (
          <option key={surah} value={surah}>
            {surah}
          </option>
        ))}
      </select>
    </div>
  );
}

function CounterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 items-center">
      <label className="text-[10px] font-bold text-[#1c2d31]/80">{label}</label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8bf83] bg-white text-xs font-bold text-[#1c2d31] hover:bg-[#f6eee7] transition-all"
        >
          -
        </button>
        <div className="flex h-8 w-10 items-center justify-center rounded-lg bg-white text-xs font-black text-[#1c2d31] ring-1 ring-[#d8bf83] shadow-inner">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8bf83] bg-white text-xs font-bold text-[#1c2d31] hover:bg-[#f6eee7] transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}
