"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { QURAN_SURAHS, getSurahByName } from "@/lib/quran-metadata";

type PreviousReport = {
  id: string;
  lessonSurah: string | null;
  pageFrom: number | null;
  reviewSurah: string | null;
  nextLessonHomework: string | null;
  nextReviewHomework: string | null;
};

type Student = {
  id: string;
  fullName: string;
  lastReport: PreviousReport | null;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  zoomUrl: string | null;
};

type QuranClientProps = {
  circle: Circle;
  students: Student[];
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
  lessonTaqeeni: number;
  lessonTanbeehi: number;
  lessonTajweedi: number;
  
  lastFiveMemorized: string;
  lastFiveErrors: number;
  lastFiveWarnings: number;
  lastFiveHasHesitation: boolean;
  lastFiveTaqeeni: number;
  lastFiveTanbeehi: number;
  lastFiveTajweedi: number;

  reviewSurah: string;
  reviewFrom: string;
  reviewTo: string;
  reviewPagesCount: string;
  reviewMemorized: boolean;
  reviewErrors: number;
  reviewWarnings: number;
  reviewTaqeeni: number;
  reviewTanbeehi: number;
  reviewTajweedi: number;

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

export default function QuranClient({ circle, students }: QuranClientProps) {
  const isRubaiTrack = circle.track === "RUBAI";

  // Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // PDF Page variables
  const [sessionDrafts, setSessionDrafts] = useState<Record<string, StudentDraft>>({});
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || "");
  const [quranPage, setQuranPage] = useState<number>(1);
  const [fullQuranOffset] = useState<number>(2); // Fixed default offset
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [notePresets, setNotePresets] = useState<string[]>([]);

  // Load note presets on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await fetch("/api/report-note-presets");
        const data = await res.json();
        if (res.ok && Array.isArray(data.presets)) {
          setNotePresets(data.presets);
        } else {
          setNotePresets([
            "نشكر الطالب على أدائه المميز هذا اليوم.",
            "نحث الطالب على الحضور في الوقت المحدد وعدم التأخر.",
            "نحث الطالب على الانضباط في الحلقة والإستماع إلى توجيهات المعلم.",
            "نحث الطالب على تحضير المراجعة اليومية جيدا في المنزل.",
            "نحث الطالب على تحضير اخر 5 صفحات جيدا في المنزل.",
            "نحث الطالب على تحضير اخر 5 صفحات والمراجعة اليومية جيدا في المنزل.",
            "نحث الطالب على تحضير الدرس جيدا في المنزل.",
            "نحث الطالب على مراجعة الأخطاء المكررة جيدا."
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPresets();
  }, []);

  const activeDraft = useMemo(() => {
    return sessionDrafts[activeStudentId] || null;
  }, [sessionDrafts, activeStudentId]);

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
        pageTo: String(parsedLesson.to || ""),
        pagesCount: parsedLesson.pagesCount || "",
        lessonMemorized: "",
        lessonErrors: 0,
        lessonWarnings: 0,
        lessonHasHesitation: false,
        lessonTaqeeni: 0,
        lessonTanbeehi: 0,
        lessonTajweedi: 0,
        
        lastFiveMemorized: "",
        lastFiveErrors: 0,
        lastFiveWarnings: 0,
        lastFiveHasHesitation: false,
        lastFiveTaqeeni: 0,
        lastFiveTanbeehi: 0,
        lastFiveTajweedi: 0,

        reviewSurah: parsedReview.startSurah || student.lastReport?.reviewSurah || "",
        reviewFrom: String(parsedReview.from || ""),
        reviewTo: String(parsedReview.to || ""),
        reviewPagesCount: parsedReview.pagesCount || "",
        reviewMemorized: true,
        reviewErrors: 0,
        reviewWarnings: 0,
        reviewTaqeeni: 0,
        reviewTanbeehi: 0,
        reviewTajweedi: 0,

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

  // Load saved drafts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("alrahma-quran-drafts");
    if (saved) {
      try {
        setSessionDrafts(JSON.parse(saved));
      } catch (e) {
        setSessionDrafts(initialDrafts);
      }
    } else {
      setSessionDrafts(initialDrafts);
    }
  }, [initialDrafts]);

  // Sync Broadcast Channel Setup
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("alrahma-quran-sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "SYNC_DRAFTS" || type === "UPDATE_DRAFTS") {
        if (payload.drafts) {
          setSessionDrafts((prev) => {
            const merged = { ...prev };
            Object.keys(payload.drafts).forEach((sId) => {
              merged[sId] = {
                ...merged[sId],
                ...payload.drafts[sId],
              };
            });
            return merged;
          });
        }
      }
      if (type === "SYNC_DRAFTS" || type === "SET_ACTIVE_STUDENT") {
        if (payload.studentId) {
          setActiveStudentId(payload.studentId);
        }
      }
      if (type === "QURAN_PAGE_CHANGED") {
        if (payload.quranPage) {
          setQuranPage(payload.quranPage);
        }
      }
      if (type === "REQUEST_SYNC") {
        channel.postMessage({
          type: "UPDATE_DRAFTS",
          payload: { drafts: sessionDrafts }
        });
        channel.postMessage({
          type: "SET_ACTIVE_STUDENT",
          payload: { studentId: activeStudentId }
        });
        channel.postMessage({
          type: "QURAN_PAGE_CHANGED",
          payload: { quranPage }
        });
      }
    };

    channel.postMessage({ type: "REQUEST_SYNC" });

    return () => {
      channel.close();
    };
  }, [sessionDrafts, activeStudentId, quranPage]);

  // Handle selecting a student
  const handleSelectStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    channelRef.current?.postMessage({
      type: "SET_ACTIVE_STUDENT",
      payload: { studentId }
    });
  };

  // Main Page Jump function
  const handlePageChange = (page: number) => {
    const targetPage = Math.max(1, Math.min(604, page));
    setQuranPage(targetPage);
    
    channelRef.current?.postMessage({
      type: "QURAN_PAGE_CHANGED",
      payload: { quranPage: targetPage }
    });
  };

  // Auto-jump PDF to active student's lesson page on student change
  useEffect(() => {
    if (!activeDraft) return;
    const pageNum = parseInt(activeDraft.pageFrom);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
      setQuranPage(pageNum);
    }
  }, [activeStudentId]);

  // Incrementor/decrementor field updater
  const updateDraftField = (field: keyof StudentDraft, value: any) => {
    if (!activeDraft) return;
    
    let updatedDraft = {
      ...activeDraft,
      [field]: value,
    };

    // Auto-calculate DB fields for Lesson
    if (field === "lessonTaqeeni") {
      updatedDraft.lessonErrors = value;
    }
    if (field === "lessonTanbeehi" || field === "lessonTajweedi") {
      const tanbeehi = field === "lessonTanbeehi" ? value : updatedDraft.lessonTanbeehi;
      const tajweedi = field === "lessonTajweedi" ? value : updatedDraft.lessonTajweedi;
      updatedDraft.lessonWarnings = tanbeehi + tajweedi;
      updatedDraft.lessonHasHesitation = tanbeehi > 0;
    }

    // Auto-calculate DB fields for Last Five Pages
    if (field === "lastFiveTaqeeni") {
      updatedDraft.lastFiveErrors = value;
    }
    if (field === "lastFiveTanbeehi" || field === "lastFiveTajweedi") {
      const tanbeehi = field === "lastFiveTanbeehi" ? value : updatedDraft.lastFiveTanbeehi;
      const tajweedi = field === "lastFiveTajweedi" ? value : updatedDraft.lastFiveTajweedi;
      updatedDraft.lastFiveWarnings = tanbeehi + tajweedi;
      updatedDraft.lastFiveHasHesitation = tanbeehi > 0;
    }

    // Auto-calculate DB fields for Review
    if (field === "reviewTaqeeni") {
      updatedDraft.reviewErrors = value;
      updatedDraft.reviewMemorized = value <= 3 && updatedDraft.reviewWarnings <= 6;
    }
    if (field === "reviewTanbeehi" || field === "reviewTajweedi") {
      const tanbeehi = field === "reviewTanbeehi" ? value : updatedDraft.reviewTanbeehi;
      const tajweedi = field === "reviewTajweedi" ? value : updatedDraft.reviewTajweedi;
      updatedDraft.reviewWarnings = tanbeehi + tajweedi;
      updatedDraft.reviewMemorized = updatedDraft.reviewErrors <= 3 && (tanbeehi + tajweedi) <= 6;
    }

    const updatedDrafts = {
      ...sessionDrafts,
      [activeStudentId]: updatedDraft,
    };
    setSessionDrafts(updatedDrafts);
    
    // Broadcast updated drafts in real-time
    channelRef.current?.postMessage({
      type: "UPDATE_DRAFTS",
      payload: { drafts: updatedDrafts }
    });
  };

  // Save Draft explicitly to localStorage and trigger visual toast
  const handleSaveDraft = () => {
    localStorage.setItem("alrahma-quran-drafts", JSON.stringify(sessionDrafts));
    
    // Broadcast active sync
    channelRef.current?.postMessage({
      type: "UPDATE_DRAFTS",
      payload: { drafts: sessionDrafts }
    });
    
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const nextPage = () => {
    if (quranPage < 604) {
      handlePageChange(quranPage + 1);
    }
  };

  const prevPage = () => {
    if (quranPage > 1) {
      handlePageChange(quranPage - 1);
    }
  };

  // Local selected Surah inside the page
  const [selectedSurahName, setSelectedSurahName] = useState<string>("الفاتحة");

  // Handle Surah dropdown selection
  const handleSurahSelect = (surahName: string) => {
    setSelectedSurahName(surahName);
    const metadata = getSurahByName(surahName);
    if (metadata) {
      handlePageChange(metadata.startPage);
    }
  };

  // Keep dropdown Surah synced when page is flipped
  useEffect(() => {
    const matchedSurahs = QURAN_SURAHS.filter(s => quranPage >= s.startPage && quranPage <= s.endPage);
    if (matchedSurahs.length > 0) {
      if (!matchedSurahs.some(s => s.name === selectedSurahName)) {
        setSelectedSurahName(matchedSurahs[0].name);
      }
    }
  }, [quranPage]);

  // PDF Page calculation for URL
  const pdfPage = useMemo(() => {
    return Math.max(1, quranPage + fullQuranOffset);
  }, [quranPage, fullQuranOffset]);

  // Clean PDF Url (Always use full_quran.pdf to avoid laggy swapping)
  const pdfUrl = `/quran/full_quran.pdf#page=${pdfPage}&navpanes=1&pagemode=bookmarks`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100 font-sans animate-fade-in" dir="rtl">
      
      {/* Main Layout Grid - Wider sidebar (480px) */}
      <div className={`grid h-full w-full transition-all duration-300 ${
        isSidebarOpen ? "grid-cols-[1fr_480px]" : "grid-cols-[1fr]"
      }`}>
        
        {/* Right Pane: PDF Viewer */}
        <section className="relative h-full w-full flex flex-col bg-gray-200">
          
          {/* Top minimal control overlay */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-2xl bg-[#0a3f2a]/95 px-4 py-2 text-white shadow-lg backdrop-blur-sm border border-[#d8bf83]/20">
            <button
              onClick={prevPage}
              type="button"
              className="text-xs font-black hover:text-[#f2d18a] transition px-2"
            >
              ◀ السابقة
            </button>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-xs font-bold px-1">
              صفحة {quranPage} من 604
            </span>
            <div className="h-4 w-px bg-white/20" />
            <button
              onClick={nextPage}
              type="button"
              className="text-xs font-black hover:text-[#f2d18a] transition px-2"
            >
              التالية ▶
            </button>
          </div>

          {/* Quick Page Jump Buttons */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
            <button
              onClick={() => handlePageChange(528)}
              type="button"
              className="rounded-xl bg-[#bd8f2d] hover:bg-[#a97d25] px-3.5 py-2 text-[10px] font-black text-white shadow-lg transition active:scale-95"
            >
              📖 العشر الأخير (سورة القمر ص 528)
            </button>
            <button
              onClick={() => handlePageChange(1)}
              type="button"
              className="rounded-xl bg-[#0a3f2a] hover:bg-[#0f5a35] px-3.5 py-2 text-[10px] font-black text-white shadow-lg transition active:scale-95"
            >
              📖 بداية المصحف الشريف (ص 1)
            </button>
          </div>

          {/* Floating Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            type="button"
            className="absolute top-3 right-3 z-10 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0a3f2a] hover:bg-[#0f5a35] px-4 text-xs font-black text-white shadow-lg transition active:scale-95"
          >
            {isSidebarOpen ? "◀ إخفاء اللوحة الجانبية" : "📝 فتح التقرير والمتابعة"}
          </button>

          {/* Native browser PDF viewer iframe */}
          <iframe
            ref={iframeRef}
            key={pdfPage} // Remounts to jump page in Chrome/Edge, loads instantly from browser disk cache
            src={pdfUrl}
            className="h-full w-full border-0"
            title="المصحف الشريف"
          />
        </section>

        {/* Left Pane: Collapsible interactive sidebar */}
        {isSidebarOpen && (
          <aside className="h-full border-r border-[#d8bf83]/30 bg-[#faf6f0] shadow-2xl flex flex-col z-20 overflow-hidden">
            
            {/* Header section inside sidebar */}
            <div className="bg-[#0a3f2a] p-4 text-white">
              <h2 className="text-xs font-bold text-[#f2d18a]">{circle.name}</h2>
              <h1 className="text-sm font-black mt-1">مستعرض المصحف ورصد المتابعة</h1>
              
              <div className="mt-3 flex items-center gap-1.5">
                <label className="text-[10px] font-bold text-white/70 whitespace-nowrap">الذهاب لسورة:</label>
                <select
                  value={selectedSurahName}
                  onChange={(e) => handleSurahSelect(e.target.value)}
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs outline-none text-white font-black"
                >
                  {QURAN_SURAHS.map(s => <option key={s.name} value={s.name} className="text-gray-800">{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Scrollable controls list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Student Cards Selection List */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-500">اختر الطالب المستمع إليه:</label>
                <div className="grid grid-cols-2 gap-2">
                  {students.map((student) => {
                    const draft = sessionDrafts[student.id];
                    const isActive = activeStudentId === student.id;
                    if (!draft) return null;

                    return (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student.id)}
                        className={`rounded-xl border p-2.5 text-center text-xs transition truncate ${
                          isActive
                            ? "border-[#0f5a35] bg-[#0f5a35]/5 font-black text-[#0f5a35]"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <span className="block truncate font-black">{student.fullName}</span>
                        {draft.isAbsent && (
                          <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-[9px] text-red-700 font-bold">غائب</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Student status details */}
              {activeDraft && (
                <div className="border-t border-[#d8bf83]/20 pt-4 space-y-4">
                  
                  {/* Absent Toggle */}
                  <label className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 p-3 cursor-pointer hover:bg-red-50 transition">
                    <input
                      type="checkbox"
                      checked={activeDraft.isAbsent}
                      onChange={(e) => updateDraftField("isAbsent", e.target.checked)}
                      className="h-4 w-4 accent-red-600"
                    />
                    <span className="text-xs font-black text-red-800">تسجيل غياب الطالب للحلقة</span>
                  </label>

                  <div className={`space-y-4 transition-opacity duration-200 ${activeDraft.isAbsent ? "opacity-30 pointer-events-none" : ""}`}>
                    
                    {/* الدرس الجديد (New Lesson) */}
                    <div className="rounded-2xl border border-[#d8bf83]/30 bg-white p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs font-black text-[#0a3f2a]">📖 الدرس الجديد</span>
                        {activeDraft.pageFrom && (
                          <button
                            type="button"
                            onClick={() => {
                              const p = parseInt(activeDraft.pageFrom);
                              if (!isNaN(p)) handlePageChange(p);
                            }}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-800 underline bg-amber-50 px-2 py-0.5 rounded"
                          >
                            صفحة {activeDraft.pageFrom} ◀
                          </button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600 leading-relaxed font-bold">
                        {activeDraft.lessonSurah ? (
                          <span>سورة {activeDraft.lessonSurah} من صفحة {activeDraft.pageFrom} إلى {activeDraft.pageTo || "-"}</span>
                        ) : (
                          <span className="text-gray-400 italic">لا يوجد واجب مسجل للدرس</span>
                        )}
                      </div>

                      {/* Counters - 3 Columns */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <CounterControl
                          label="خطأ تلقيني"
                          value={activeDraft.lessonTaqeeni}
                          onChange={(val) => updateDraftField("lessonTaqeeni", val)}
                        />
                        <CounterControl
                          label="خطأ تنبيهي"
                          value={activeDraft.lessonTanbeehi}
                          onChange={(val) => updateDraftField("lessonTanbeehi", val)}
                        />
                        <CounterControl
                          label="خطأ تجويدي"
                          value={activeDraft.lessonTajweedi}
                          onChange={(val) => updateDraftField("lessonTajweedi", val)}
                        />
                      </div>
                    </div>

                    {/* آخر 5 صفحات (Last 5 Pages) */}
                    {isRubaiTrack && (
                      <div className="rounded-2xl border border-[#d8bf83]/30 bg-white p-4 space-y-3 shadow-sm">
                        <span className="block text-xs font-black text-[#0a3f2a] border-b border-gray-100 pb-2">🔁 آخر 5 صفحات</span>

                        <div className="grid grid-cols-3 gap-2">
                          <CounterControl
                            label="خطأ تلقيني"
                            value={activeDraft.lastFiveTaqeeni}
                            onChange={(val) => updateDraftField("lastFiveTaqeeni", val)}
                          />
                          <CounterControl
                            label="خطأ تنبيهي"
                            value={activeDraft.lastFiveTanbeehi}
                            onChange={(val) => updateDraftField("lastFiveTanbeehi", val)}
                          />
                          <CounterControl
                            label="خطأ تجويدي"
                            value={activeDraft.lastFiveTajweedi}
                            onChange={(val) => updateDraftField("lastFiveTajweedi", val)}
                          />
                        </div>
                      </div>
                    )}

                    {/* المراجعة (Review) */}
                    <div className="rounded-2xl border border-[#d8bf83]/30 bg-white p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs font-black text-[#0a3f2a]">🔄 المراجعة</span>
                        {activeDraft.reviewFrom && (
                          <button
                            type="button"
                            onClick={() => {
                              const p = parseInt(activeDraft.reviewFrom);
                              if (!isNaN(p)) handlePageChange(p);
                            }}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-800 underline bg-amber-50 px-2 py-0.5 rounded"
                          >
                            صفحة {activeDraft.reviewFrom} ◀
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 leading-relaxed font-bold">
                        {activeDraft.reviewSurah ? (
                          <span>سورة {activeDraft.reviewSurah} من صفحة {activeDraft.reviewFrom} إلى {activeDraft.reviewTo || "-"}</span>
                        ) : (
                          <span className="text-gray-400 italic">لا توجد مراجعة مسجلة</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <CounterControl
                          label="خطأ تلقيني"
                          value={activeDraft.reviewTaqeeni}
                          onChange={(val) => updateDraftField("reviewTaqeeni", val)}
                        />
                        <CounterControl
                          label="خطأ تنبيهي"
                          value={activeDraft.reviewTanbeehi}
                          onChange={(val) => updateDraftField("reviewTanbeehi", val)}
                        />
                        <CounterControl
                          label="خطأ تجويدي"
                          value={activeDraft.reviewTajweedi}
                          onChange={(val) => updateDraftField("reviewTajweedi", val)}
                        />
                      </div>
                    </div>

                    {/* ملاحظات المعلم (Teacher Notes) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500">ملاحظات أو تعليق التقرير:</label>
                      {notePresets.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              updateDraftField("note", e.target.value);
                            }
                          }}
                          className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs outline-none text-gray-800 font-bold mb-1.5 focus:border-[#0f5a35]"
                        >
                          <option value="">اختر ملاحظة جاهزة لإدراجها تلقائيًا</option>
                          {notePresets.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      <textarea
                        value={activeDraft.note}
                        onChange={(e) => updateDraftField("note", e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-xs outline-none focus:border-[#0f5a35] h-20 resize-none font-bold"
                        placeholder="اكتب ملاحظاتك للطالب هنا..."
                      />
                    </div>

                  </div>

                  {/* Save Draft & Sync Button */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="w-full rounded-2xl bg-[#0a3f2a] hover:bg-[#0f5a35] py-3.5 text-sm font-black text-[#f2d18a] shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      💾 حفظ المسودة ومزامنة التقرير
                    </button>

                    {showSaveSuccess && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-black text-emerald-800 animate-fade-in">
                        ✓ تم حفظ المسودة ومزامنتها بنجاح مع التقرير الأساسي!
                      </div>
                    )}
                  </div>

                  {/* Sync status indicator */}
                  <div className="pt-3 border-t border-[#d8bf83]/20 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      التقرير متصل ومزامن لحظياً
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        window.focus(); // Try focusing
                        alert("تمت مزامنة المسودة بنجاح. يرجى مراجعة التقرير في الصفحة الأساسية وحفظه رسمياً من هناك.");
                      }}
                      className="text-amber-700 font-bold hover:underline"
                    >
                      ذهاب لصفحة التقرير ◀
                    </button>
                  </div>

                </div>
              )}

            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// Inline Helper Counter Control Component - Larger buttons and fonts
type CounterProps = {
  label: string;
  value: number;
  onChange: (val: number) => void;
};

function CounterControl({ label, value, onChange }: CounterProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-center space-y-2 shadow-sm">
      <span className="block text-[10px] font-black text-gray-500">{label}</span>
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-100 active:scale-95 shadow-sm"
        >
          -
        </button>
        <span className="text-sm font-black text-gray-800">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-100 active:scale-95 shadow-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}
