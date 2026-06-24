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

export default function QuranClient({ circle, students }: QuranClientProps) {
  // Sidebar visibility state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Active student and page variables
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || "");
  const [quranPage, setQuranPage] = useState<number>(1);
  const [selectedPdf, setSelectedPdf] = useState<"full" | "last_tenth">("full");
  const [selectedSurahName, setSelectedSurahName] = useState<string>("الفاتحة");

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === activeStudentId) || null;
  }, [students, activeStudentId]);

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

  const activeStudentHomework = useMemo(() => {
    if (!activeStudent) return null;
    const lessonHomeworkText = activeStudent.lastReport?.nextLessonHomework || "";
    const reviewHomeworkText = activeStudent.lastReport?.nextReviewHomework || "";
    return {
      lessonText: lessonHomeworkText,
      reviewText: reviewHomeworkText,
      lessonParsed: parseHomeworkRange(lessonHomeworkText),
      reviewParsed: parseHomeworkRange(reviewHomeworkText),
    };
  }, [activeStudent]);

  // Sync Broadcast Channel Setup
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("alrahma-quran-sync");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
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
  }, [activeStudentId, quranPage]);

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
    
    // Auto-switch back to full Quran if user scrolls to pages < 528 while on last tenth
    if (targetPage < 528 && selectedPdf === "last_tenth") {
      setSelectedPdf("full");
    }
    
    channelRef.current?.postMessage({
      type: "QURAN_PAGE_CHANGED",
      payload: { quranPage: targetPage }
    });
  };

  // Auto-jump PDF to active student's lesson page on student change
  useEffect(() => {
    if (!activeStudentHomework?.lessonParsed) return;
    const pageNum = parseInt(activeStudentHomework.lessonParsed.from || String(activeStudent?.lastReport?.pageFrom || ""));
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
      handlePageChange(pageNum);
    }
  }, [activeStudentId]);

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

  // PDF Url Builder
  const pdfUrl = useMemo(() => {
    if (selectedPdf === "full") {
      const fullQuranOffset = 2;
      const pdfPage = Math.max(1, quranPage + fullQuranOffset);
      return `/quran/full_quran.pdf#page=${pdfPage}&navpanes=0&pagemode=bookmarks`;
    } else {
      // Last tenth starts at page 528
      const pdfPage = Math.max(1, quranPage - 528 + 1);
      return `/quran/last_tenth.pdf#page=${pdfPage}&navpanes=0&pagemode=bookmarks`;
    }
  }, [quranPage, selectedPdf]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-100 font-sans animate-fade-in" dir="rtl">
      
      {/* Main Layout Grid - Sidebar (420px) */}
      <div className={`grid h-full w-full transition-all duration-300 ${
        isSidebarOpen ? "grid-cols-[1fr_420px]" : "grid-cols-[1fr]"
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
            {isSidebarOpen ? "◀ إخفاء اللوحة الجانبية" : "📖 عرض واجبات الطلاب والمصحف"}
          </button>

          {/* Native browser PDF viewer iframe */}
          <iframe
            ref={iframeRef}
            key={selectedPdf} // Remounts only when switching PDF files, page changes are instant hash changes
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
              <h1 className="text-sm font-black mt-1">مستعرض المصحف الشريف</h1>
              
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

            {/* Scrollable contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Student Cards Selection List */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500">اختر الطالب لعرض واجبه:</label>
                <div className="grid grid-cols-2 gap-2">
                  {students.map((student) => {
                    const isActive = activeStudentId === student.id;
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
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Student Read-Only Info */}
              {activeStudent && activeStudentHomework && (
                <div className="border-t border-[#d8bf83]/20 pt-4 space-y-4">
                  
                  <div className="bg-white/40 rounded-xl p-3 border border-amber-900/5">
                    <span className="text-[10px] font-bold text-gray-400 block">الطالب الحالي:</span>
                    <span className="text-sm font-black text-gray-800">{activeStudent.fullName}</span>
                  </div>

                  {/* الدرس الجديد (New Lesson) */}
                  <div className="rounded-2xl border border-[#d8bf83]/30 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-black text-[#0a3f2a]">📖 الدرس الجديد المطلوب اليوم</span>
                    </div>
                    
                    <div className="text-xs text-gray-700 leading-relaxed font-bold">
                      {activeStudentHomework.lessonText ? (
                        <span>{activeStudentHomework.lessonText}</span>
                      ) : (
                        <span className="text-gray-400 italic">لا يوجد واجب مسجل للدرس الجديد</span>
                      )}
                    </div>

                    {activeStudentHomework.lessonParsed.from && (
                      <button
                        type="button"
                        onClick={() => {
                          const p = parseInt(activeStudentHomework.lessonParsed.from);
                          if (!isNaN(p)) handlePageChange(p);
                        }}
                        className="w-full text-center text-xs font-black text-[#bd8f2d] hover:text-[#a97d25] bg-[#faf6f0] hover:bg-[#faf6f0]/80 py-2 rounded-xl border border-[#d8bf83]/30 transition"
                      >
                        عرض صفحة الدرس (صفحة {activeStudentHomework.lessonParsed.from}) ◀
                      </button>
                    )}
                  </div>

                  {/* المراجعة (Review) */}
                  <div className="rounded-2xl border border-[#d8bf83]/30 bg-white p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-black text-[#0a3f2a]">🔄 المراجعة المطلوبة اليوم</span>
                    </div>

                    <div className="text-xs text-gray-700 leading-relaxed font-bold">
                      {activeStudentHomework.reviewText ? (
                        <span>{activeStudentHomework.reviewText}</span>
                      ) : (
                        <span className="text-gray-400 italic">لا توجد مراجعة مسجلة اليوم</span>
                      )}
                    </div>

                    {activeStudentHomework.reviewParsed.from && (
                      <button
                        type="button"
                        onClick={() => {
                          const p = parseInt(activeStudentHomework.reviewParsed.from);
                          if (!isNaN(p)) handlePageChange(p);
                        }}
                        className="w-full text-center text-xs font-black text-[#bd8f2d] hover:text-[#a97d25] bg-[#faf6f0] hover:bg-[#faf6f0]/80 py-2 rounded-xl border border-[#d8bf83]/30 transition"
                      >
                        عرض صفحة المراجعة (صفحة {activeStudentHomework.reviewParsed.from}) ◀
                      </button>
                    )}
                  </div>

                  {/* PDF Switching & Downloading Options */}
                  <div className="border-t border-[#d8bf83]/20 pt-4 space-y-3">
                    <span className="text-xs font-black text-gray-500 block">خيارات المصحف الشريف:</span>
                    
                    {/* View Switcher */}
                    <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setSelectedPdf("full")}
                        className={`py-2 text-xs font-black rounded-lg transition ${
                          selectedPdf === "full"
                            ? "bg-[#0a3f2a] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        المصحف الكامل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Default to page 528 if currently on page < 528
                          if (quranPage < 528) {
                            handlePageChange(528);
                          }
                          setSelectedPdf("last_tenth");
                        }}
                        className={`py-2 text-xs font-black rounded-lg transition ${
                          selectedPdf === "last_tenth"
                            ? "bg-[#0a3f2a] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        العشر الأخير
                      </button>
                    </div>

                    {/* Download Links */}
                    <div className="space-y-2 pt-1">
                      <a
                        href="/quran/full_quran.pdf"
                        download="المصحف_الكامل.pdf"
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-xs font-black text-gray-700 transition"
                      >
                        📥 تحميل المصحف الكامل (PDF)
                      </a>
                      <a
                        href="/quran/last_tenth.pdf"
                        download="العشر_الأخير.pdf"
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 py-2.5 text-xs font-black text-gray-700 transition"
                      >
                        📥 تحميل العشر الأخير (PDF)
                      </a>
                    </div>
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
