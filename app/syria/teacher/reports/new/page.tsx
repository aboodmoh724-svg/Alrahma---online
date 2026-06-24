"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  findNoorAlBayanLesson,
  formatNoorAlBayanRange,
  noorAlBayanReviewOptions,
} from "@/lib/noor-al-bayan-lessons";

type Student = {
  id: string;
  fullName: string;
  circle?: {
    id: string;
    name: string;
    track?: string | null;
  } | null;
};

const surahNames = [
  "الفاتحة",
  "البقرة",
  "آل عمران",
  "النساء",
  "المائدة",
  "الأنعام",
  "الأعراف",
  "الأنفال",
  "التوبة",
  "يونس",
  "هود",
  "يوسف",
  "الرعد",
  "إبراهيم",
  "الحجر",
  "النحل",
  "الإسراء",
  "الكهف",
  "مريم",
  "طه",
  "الأنبياء",
  "الحج",
  "المؤمنون",
  "النور",
  "الفرقان",
  "الشعراء",
  "النمل",
  "القصص",
  "العنكبوت",
  "الروم",
  "لقمان",
  "السجدة",
  "الأحزاب",
  "سبأ",
  "فاطر",
  "يس",
  "الصافات",
  "ص",
  "الزمر",
  "غافر",
  "فصلت",
  "الشورى",
  "الزخرف",
  "الدخان",
  "الجاثية",
  "الأحقاف",
  "محمد",
  "الفتح",
  "الحجرات",
  "ق",
  "الذاريات",
  "الطور",
  "النجم",
  "القمر",
  "الرحمن",
  "الواقعة",
  "الحديد",
  "المجادلة",
  "الحشر",
  "الممتحنة",
  "الصف",
  "الجمعة",
  "المنافقون",
  "التغابن",
  "الطلاق",
  "التحريم",
  "الملك",
  "القلم",
  "الحاقة",
  "المعارج",
  "نوح",
  "الجن",
  "المزمل",
  "المدثر",
  "القيامة",
  "الإنسان",
  "المرسلات",
  "النبأ",
  "النازعات",
  "عبس",
  "التكوير",
  "الانفطار",
  "المطففين",
  "الانشقاق",
  "البروج",
  "الطارق",
  "الأعلى",
  "الغاشية",
  "الفجر",
  "البلد",
  "الشمس",
  "الليل",
  "الضحى",
  "الشرح",
  "التين",
  "العلق",
  "القدر",
  "البينة",
  "الزلزلة",
  "العاديات",
  "القارعة",
  "التكاثر",
  "العصر",
  "الهمزة",
  "الفيل",
  "قريش",
  "الماعون",
  "الكوثر",
  "الكافرون",
  "النصر",
  "المسد",
  "الإخلاص",
  "الفلق",
  "الناس",
];

const inputClass =
  "w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#0f5a35] focus:ring-4 focus:ring-[#0f5a35]/10";

const sectionClass =
  "rounded-[2rem] border border-[#d8bf83]/70 bg-white/86 p-5 shadow-sm";

const notePresetOptions = [
  "نشكر الطالب على أدائه المميز هذا اليوم.",
  "نحث الطالب على الحضور في الوقت المحدد وعدم التأخر.",
  "نحث الطالب على الانضباط في الحلقة والإستماع إلى توجيهات المعلم.",
  "نحث الطالب على تحضير المراجعة اليومية جيدا في المنزل.",
  "نحث الطالب على تحضير الدرس جيدا في المنزل.",
  "نحث الطالب على مراجعة الأخطاء المكررة جيدا.",
];

function SurahInput({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        required={required}
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

type HomeworkRange = {
  startSurah: string;
  endSurah: string;
  from: string;
  to: string;
  pagesCount: string;
};

const emptyHomeworkRange: HomeworkRange = {
  startSurah: "",
  endSurah: "",
  from: "",
  to: "",
  pagesCount: "",
};

function parseHomeworkRange(value: string): HomeworkRange {
  const text = value.trim();
  if (!text) return emptyHomeworkRange;
  const normalizedText = text.replace(/\(([^)]+)\)/g, " الآية $1");

  const pagesCount = normalizedText.match(/عدد الصفحات:\s*([0-9٠-٩]+)/)?.[1] || "";
  const crossSurahMatch = normalizedText.match(
    /من سورة\s+(.+?)(?:\s+(?:الآية\s+)?([0-9٠-٩]+))?\s+إلى سورة\s+(.+?)(?:\s+(?:الآية\s+)?([0-9٠-٩]+))?(?:\s+-|$)/
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

function parseNoorHomeworkRange(value: string) {
  const numbers = value.match(/[0-9٠-٩]+/g) || [];

  return {
    pageFrom: numbers[0] || "",
    pageTo: numbers[1] || numbers[0] || "",
    linesCount: numbers[2] || numbers[0] || "",
  };
}

function MemorizedSelect({
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
      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">اختر الحالة</option>
        <option value="true">حافظ</option>
        <option value="false">غير حافظ</option>
      </select>
    </div>
  );
}

function NewReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId") || "";
  const circleIdFromUrl = searchParams.get("circleId") || "";
  const reportIdFromUrl = searchParams.get("reportId") || "";
  const isEditingReport = Boolean(reportIdFromUrl);

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [suggestedHomework, setSuggestedHomework] = useState("");
  const [selectedNotePreset, setSelectedNotePreset] = useState("");
  const [reportNotePresetOptions, setReportNotePresetOptions] = useState(notePresetOptions);
  const [progressData, setProgressData] = useState({
    startSurah: "",
    startAyah: "",
    startPage: "",
    note: "",
  });

  const [formData, setFormData] = useState({
    studentId: studentIdFromUrl,
    isAbsent: false,
    lessonSurah: "",
    pageFrom: "",
    pageTo: "",
    pagesCount: "",
    lessonMemorized: "",
    lastFiveMemorized: "",
    reviewSurah: "",
    reviewFrom: "",
    reviewTo: "",
    reviewPagesCount: "",
    reviewMemorized: "",
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
    noorLinesCount: "",
    noorProgressUnit: "PAGE",
    noorReviewScope: "مراجعة آخر درس",
    noorReviewCustom: "",
    noorNextPageFrom: "",
    noorNextPageTo: "",
    noorNextLinesCount: "",
    noorNextUnit: "PAGE",
    note: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      studentId: studentIdFromUrl,
    }));
  }, [studentIdFromUrl]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const studentsUrl = new URL("/api/students", window.location.origin);
        studentsUrl.searchParams.set("studyMode", "ONSITE_SYRIA");
        if (circleIdFromUrl) {
          studentsUrl.searchParams.set("circleId", circleIdFromUrl);
        }

        const res = await fetch(studentsUrl.toString(), { cache: "no-store" });
        const data = await res.json();
        setStudents(res.ok && Array.isArray(data.students) ? data.students : []);
      } catch (error) {
        console.error("FETCH STUDENTS ERROR =>", error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [circleIdFromUrl]);

  useEffect(() => {
    const fetchReportNotePresets = async () => {
      try {
        const response = await fetch("/api/report-note-presets", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.presets)) {
          return;
        }

        const normalizedPresets = data.presets
          .map((item: unknown) => String(item || "").trim())
          .filter(Boolean)
          .filter((item: string) => !item.includes("خمس") && !item.includes("5"));

        if (normalizedPresets.length > 0) {
          setReportNotePresetOptions(normalizedPresets);
        }
      } catch (error) {
        console.error("FETCH REPORT NOTE PRESETS ERROR =>", error);
      }
    };

    fetchReportNotePresets();
  }, []);

  useEffect(() => {
    if (reportIdFromUrl) {
      return;
    }

    if (!formData.studentId) {
      setSuggestedHomework("");
      setFormData((prev) => ({
        ...prev,
        lessonSurah: "",
        pageFrom: "",
        pageTo: "",
        pagesCount: "",
        reviewSurah: "",
        reviewFrom: "",
        reviewTo: "",
        reviewPagesCount: "",
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
      }));
      return;
    }

    const fetchStudentHistory = async () => {
      try {
        setLoadingHistory(true);
        const historyUrl = new URL(
          `/api/students/${formData.studentId}/history`,
          window.location.origin
        );
        historyUrl.searchParams.set("studyMode", "ONSITE_SYRIA");

        const res = await fetch(historyUrl.toString(), {
          cache: "no-store",
        });
        const data = await res.json();
        const targetReport = data.lastPresentReport || data.previousReport;
        const previousLessonHomework =
          res.ok && typeof targetReport?.nextLessonHomework === "string"
            ? targetReport.nextLessonHomework
            : "";
        const previousReviewHomework =
          res.ok && typeof targetReport?.nextReviewHomework === "string"
            ? targetReport.nextReviewHomework
            : "";
        const previousHomework =
          res.ok && typeof data.lastNextHomework === "string"
            ? data.lastNextHomework
            : "";
        const lessonHomework = parseHomeworkRange(previousLessonHomework);
        const reviewHomework = parseHomeworkRange(previousReviewHomework);
        const noorHomework = parseNoorHomeworkRange(previousLessonHomework);

        setSuggestedHomework(previousHomework);
        setFormData((prev) => ({
          ...prev,
          lessonSurah: lessonHomework.startSurah,
          pageFrom: lessonHomework.from || noorHomework.pageFrom,
          pageTo: lessonHomework.to || noorHomework.pageTo,
          pagesCount: lessonHomework.pagesCount,
          noorLinesCount: noorHomework.linesCount,
          noorProgressUnit: "PAGE",
          reviewSurah: reviewHomework.startSurah,
          reviewFrom: reviewHomework.from,
          reviewTo: reviewHomework.to,
          reviewPagesCount: reviewHomework.pagesCount,
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
        }));
      } catch (error) {
        console.error("FETCH STUDENT HISTORY ERROR =>", error);
        setSuggestedHomework("");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchStudentHistory();
  }, [formData.studentId, reportIdFromUrl]);

  useEffect(() => {
    if (!formData.studentId || reportIdFromUrl) {
      setHasSavedProgress(false);
      setProgressData({
        startSurah: "",
        startAyah: "",
        startPage: "",
        note: "",
      });
      return;
    }

    const fetchStudentProgress = async () => {
      try {
        setLoadingProgress(true);
        const response = await fetch(`/api/students/${formData.studentId}/progress`, {
          cache: "no-store",
        });
        const data = await response.json();
        const progress = response.ok ? data.progress : null;

        setHasSavedProgress(Boolean(progress));
        setProgressData({
          startSurah: progress?.startSurah || "",
          startAyah: progress?.startAyah ? String(progress.startAyah) : "",
          startPage: progress?.startPage ? String(progress.startPage) : "",
          note: progress?.note || "",
        });
      } catch (error) {
        console.error("FETCH STUDENT PROGRESS ERROR =>", error);
        setHasSavedProgress(false);
      } finally {
        setLoadingProgress(false);
      }
    };

    void fetchStudentProgress();
  }, [formData.studentId, reportIdFromUrl]);

  const selectedStudentExists = students.some(
    (student) => student.id === formData.studentId
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === formData.studentId) || null,
    [formData.studentId, students]
  );

  const selectedStudentName = useMemo(
    () => selectedStudent?.fullName || "الطالب",
    [selectedStudent]
  );

  const isNoorAlBayanReport = useMemo(() => {
    const circleName = selectedStudent?.circle?.name || "";
    const circleTrack = selectedStudent?.circle?.track || "";

    return (
      circleTrack === "ONSITE_NOUR_AL_BAYAN" ||
      /نور|بيان/i.test(circleName)
    );
  }, [selectedStudent]);

  const currentNoorLesson = useMemo(
    () => findNoorAlBayanLesson(formData.pageFrom),
    [formData.pageFrom]
  );

  const nextNoorLesson = useMemo(
    () => findNoorAlBayanLesson(formData.noorNextPageFrom),
    [formData.noorNextPageFrom]
  );

  const setField = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setProgressField = (name: keyof typeof progressData, value: string) => {
    setProgressData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setHasSavedProgress(false);
  };

  const saveStudentProgress = async () => {
    if (!formData.studentId) {
      alert("اختر الطالب أولا");
      return false;
    }

    if (!progressData.startSurah.trim()) {
      alert("اسم سورة بداية الطالب مطلوب");
      return false;
    }

    try {
      setSavingProgress(true);
      const response = await fetch(`/api/students/${formData.studentId}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressData),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "حدث خطأ أثناء حفظ بداية الطالب");
        return false;
      }

      setHasSavedProgress(true);
      return true;
    } catch (error) {
      console.error("SAVE STUDENT PROGRESS ERROR =>", error);
      alert("حدث خطأ أثناء حفظ بداية الطالب");
      return false;
    } finally {
      setSavingProgress(false);
    }
  };

  const booleanToField = (value: boolean | null | undefined) => {
    if (value === true) return "true";
    if (value === false) return "false";
    return "";
  };

  const toBooleanOrNull = (value: string) => {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    return null;
  };

  const buildHomeworkRange = ({
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
    return [surahText, rangeText].filter(Boolean).join(" - ");
  };

  const buildNextHomework = () => {
    const nextLessonHomework =
      buildHomeworkRange({
        startSurah: formData.nextLessonStartSurah,
        endSurah: formData.nextLessonEndSurah,
        from: formData.nextLessonFrom,
        to: formData.nextLessonTo,
        pagesCount: formData.nextLessonPagesCount,
      });
    const nextReviewHomework =
      buildHomeworkRange({
        startSurah: formData.nextReviewStartSurah,
        endSurah: formData.nextReviewEndSurah,
        from: formData.nextReviewFrom,
        to: formData.nextReviewTo,
        pagesCount: formData.nextReviewPagesCount,
      });
    const parts = [
      nextLessonHomework ? `الدرس الجديد: ${nextLessonHomework}` : "",
      nextReviewHomework ? `المراجعة: ${nextReviewHomework}` : "",
    ].filter(Boolean);

    return parts.join(" | ");
  };

  const calculatePageCount = (from: string, to: string, fallback: string) => {
    if (fallback.trim()) {
      return fallback.trim();
    }

    const fromNumber = Number(from);
    const toNumber = Number(to || from);

    if (!Number.isFinite(fromNumber) || !Number.isFinite(toNumber)) {
      return "";
    }

    return String(Math.max(1, toNumber - fromNumber + 1));
  };

  const noorAmountLabel = (amount: string, unit: string) => {
    const value = amount.trim();

    if (!value) {
      return "";
    }

    return `${value} ${unit === "PAGE" ? "صفحة" : "سطر"}`;
  };

  const buildNoorNextLessonHomework = () => {
    return formatNoorAlBayanRange({
      pageFrom: formData.noorNextPageFrom,
      pageTo: formData.noorNextPageTo,
      linesCount: formData.noorNextLinesCount,
      amountUnit: formData.noorNextUnit,
    });
  };

  const buildNoorNextHomework = () => {
    const nextLessonHomework = buildNoorNextLessonHomework();

    return nextLessonHomework ? `واجب نور البيان: ${nextLessonHomework}` : "";
  };

  useEffect(() => {
    if (!reportIdFromUrl) return;

    const fetchReport = async () => {
      try {
        setLoadingReport(true);
        const response = await fetch(`/api/reports/${reportIdFromUrl}`, {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.report) {
          alert(data.error || "تعذر جلب التقرير للتعديل");
          return;
        }

        const report = data.report as {
          studentId: string;
          status: "PRESENT" | "ABSENT";
          lessonSurah: string | null;
          lessonMemorized: boolean | null;
          lastFiveMemorized: boolean | null;
          pageFrom: number | null;
          pageTo: number | null;
          pagesCount: number | null;
          reviewSurah: string | null;
          reviewFrom: number | null;
          reviewTo: number | null;
          reviewPagesCount: number | null;
          reviewMemorized: boolean | null;
          nextLessonHomework: string | null;
          nextReviewHomework: string | null;
          note: string | null;
        };
        const lessonHomework = parseHomeworkRange(report.nextLessonHomework || "");
        const reviewHomework = parseHomeworkRange(report.nextReviewHomework || "");
        const noorHomework = parseNoorHomeworkRange(report.nextLessonHomework || "");

        setSuggestedHomework("");
        setFormData((prev) => ({
          ...prev,
          studentId: report.studentId,
          isAbsent: report.status === "ABSENT",
          lessonSurah: report.lessonSurah || "",
          pageFrom: report.pageFrom ? String(report.pageFrom) : "",
          pageTo: report.pageTo ? String(report.pageTo) : "",
          pagesCount: report.pagesCount ? String(report.pagesCount) : "",
          lessonMemorized: booleanToField(report.lessonMemorized),
          lastFiveMemorized: booleanToField(report.lastFiveMemorized),
          reviewSurah: report.reviewSurah || "",
          reviewFrom: report.reviewFrom ? String(report.reviewFrom) : "",
          reviewTo: report.reviewTo ? String(report.reviewTo) : "",
          reviewPagesCount: report.reviewPagesCount ? String(report.reviewPagesCount) : "",
          reviewMemorized: booleanToField(report.reviewMemorized),
          nextLessonStartSurah: lessonHomework.startSurah,
          nextLessonEndSurah: lessonHomework.endSurah,
          nextLessonFrom: lessonHomework.from || noorHomework.pageFrom,
          nextLessonTo: lessonHomework.to || noorHomework.pageTo,
          nextLessonPagesCount: lessonHomework.pagesCount,
          nextReviewStartSurah: reviewHomework.startSurah,
          nextReviewEndSurah: reviewHomework.endSurah,
          nextReviewFrom: reviewHomework.from,
          nextReviewTo: reviewHomework.to,
          nextReviewPagesCount: reviewHomework.pagesCount,
          noorNextPageFrom: noorHomework.pageFrom,
          noorNextPageTo: noorHomework.pageTo,
          noorNextLinesCount: noorHomework.linesCount,
          note: report.note || "",
        }));
      } catch (error) {
        console.error("FETCH REPORT FOR EDIT ERROR =>", error);
        alert("تعذر جلب التقرير للتعديل");
      } finally {
        setLoadingReport(false);
      }
    };

    void fetchReport();
  }, [reportIdFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextHomework = isNoorAlBayanReport
      ? buildNoorNextHomework()
      : buildNextHomework();
    const nextLessonHomework =
      isNoorAlBayanReport
        ? buildNoorNextLessonHomework()
        : buildHomeworkRange({
            startSurah: formData.nextLessonStartSurah,
            endSurah: formData.nextLessonEndSurah,
            from: formData.nextLessonFrom,
            to: formData.nextLessonTo,
            pagesCount: formData.nextLessonPagesCount,
          });
    const nextReviewHomework =
      isNoorAlBayanReport
        ? ""
        : buildHomeworkRange({
            startSurah: formData.nextReviewStartSurah,
            endSurah: formData.nextReviewEndSurah,
            from: formData.nextReviewFrom,
            to: formData.nextReviewTo,
            pagesCount: formData.nextReviewPagesCount,
          });
    const noorLessonTitle = currentNoorLesson
      ? `${currentNoorLesson.section}: ${currentNoorLesson.title}`
      : "نور البيان";
    const noorProgressText = noorAmountLabel(
      formData.noorLinesCount,
      formData.noorProgressUnit
    );
    const noorReviewScope =
      formData.noorReviewScope === "مراجعة مخصصة"
        ? formData.noorReviewCustom.trim() || formData.noorReviewScope
        : formData.noorReviewScope;
    const lessonName = formData.isAbsent
      ? "غياب"
      : isNoorAlBayanReport
        ? `نور البيان: ${noorLessonTitle}${noorProgressText ? ` - الإنجاز: ${noorProgressText}` : ""}`
        : formData.pageFrom || formData.pageTo
          ? `الدرس الجديد: سورة ${formData.lessonSurah} من الآية ${formData.pageFrom || "-"} إلى الآية ${formData.pageTo || "-"}`
          : `الدرس الجديد: سورة ${formData.lessonSurah}`;

    const payload = {
      studentId: formData.studentId,
      status: formData.isAbsent ? "ABSENT" : "PRESENT",
      lessonName,
      lessonSurah: isNoorAlBayanReport ? noorLessonTitle : formData.lessonSurah,
      pageFrom: formData.pageFrom,
      pageTo: formData.pageTo,
      pagesCount: isNoorAlBayanReport
        ? formData.noorProgressUnit === "PAGE"
          ? formData.noorLinesCount || calculatePageCount(formData.pageFrom, formData.pageTo, "")
          : ""
        : calculatePageCount(
            formData.pageFrom,
            formData.pageTo,
            formData.pagesCount
          ),
      lessonMemorized: toBooleanOrNull(formData.lessonMemorized),
      lastFiveMemorized: isNoorAlBayanReport
        ? null
        : toBooleanOrNull(formData.lastFiveMemorized),
      review: isNoorAlBayanReport
        ? noorReviewScope
          ? `${noorReviewScope} - ${formData.reviewMemorized === "true" ? "حافظ" : formData.reviewMemorized === "false" ? "غير حافظ" : "لم تحدد الحالة"}`
          : ""
        : formData.reviewSurah || formData.reviewFrom || formData.reviewTo
          ? `سورة ${formData.reviewSurah} من الآية ${formData.reviewFrom || "-"} إلى الآية ${formData.reviewTo || "-"}`
          : "",
      reviewSurah: isNoorAlBayanReport ? noorReviewScope : formData.reviewSurah,
      reviewFrom: isNoorAlBayanReport ? "" : formData.reviewFrom,
      reviewTo: isNoorAlBayanReport ? "" : formData.reviewTo,
      reviewPagesCount: isNoorAlBayanReport ? "" : formData.reviewPagesCount,
      reviewMemorized: toBooleanOrNull(formData.reviewMemorized),
      homework: suggestedHomework || "-",
      nextHomework,
      nextLessonHomework,
      nextReviewHomework,
      note: formData.note,
    };

    try {
      setSubmitting(true);
      const res = await fetch(
        isEditingReport ? `/api/reports/${reportIdFromUrl}` : "/api/reports",
        {
          method: isEditingReport ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء حفظ التقرير");
        return;
      }

      const whatsappStatus =
        data?.whatsapp?.attempted && data?.whatsapp?.sent === false
          ? `\n\nتنبيه: تعذر إرسال رسالة واتساب تلقائيًا.\nالسبب: ${data.whatsapp.error || "غير معروف"}`
          : "";

      alert(
        (isEditingReport
          ? "تم تعديل التقرير بنجاح"
          : formData.isAbsent
            ? "تم حفظ غياب الطالب"
            : "تم حفظ التقرير بنجاح") +
          whatsappStatus
      );
      router.push(
        circleIdFromUrl
          ? `/syria/teacher/dashboard?circleId=${circleIdFromUrl}`
          : "/syria/teacher/dashboard"
      );
      router.refresh();
    } catch (error) {
      console.error("SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء حفظ التقرير");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-[#0a3f2a] p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#f2d18a]">تقرير اليوم</p>
            <h1 className="mt-2 text-3xl font-black">
              {isEditingReport ? "تعديل تقرير الطالب" : "إضافة تقرير للطالب"}
            </h1>
            <p className="mt-2 text-sm leading-7 text-white/72">
              {isEditingReport
                ? "عدّل البيانات المطلوبة ثم احفظ التقرير. عند التعديل سيحتاج التقرير إلى إرسال جديد لولي الأمر."
                : "اختر الطالب، ثم إن كان غائبا احفظ الغياب مباشرة. وإن كان حاضرا أدخل الدرس والمراجعة وواجب الغد."}
            </p>
          </div>
          <Link
            href={
              circleIdFromUrl
                ? `/syria/teacher/dashboard?circleId=${circleIdFromUrl}`
                : "/syria/teacher/dashboard"
            }
            className="rounded-2xl bg-white/12 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/20"
          >
            رجوع للوحة المعلم
          </Link>
        </div>

        {loadingReport ? (
          <div className="mb-4 rounded-2xl bg-[#edf6ee] p-4 text-sm font-bold text-[#0f5a35]">
            جاري تحميل التقرير للتعديل...
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className={sectionClass}>
            <label className="mb-2 block text-sm font-black text-[#1c2d31]">
              اسم الطالب
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setField("studentId", e.target.value)}
              className={inputClass}
              required
              disabled={loadingStudents || isEditingReport}
            >
              <option value="">
                {loadingStudents ? "جاري تحميل الطلاب..." : "اختر الطالب"}
              </option>
              {formData.studentId && !selectedStudentExists ? (
                <option value={formData.studentId}>
                  الطالب المحدد من الرابط
                </option>
              ) : null}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>

            {formData.studentId && !isEditingReport ? (
              <div className="mt-4 rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-[#1c2d31]">
                      بداية الطالب مع هذا المعلم
                    </h2>
                    <p className="mt-1 text-xs font-bold leading-6 text-[#1c2d31]/60">
                      تسجل مرة واحدة، ويمكن تعديلها عند الحاجة. تُستخدم لاحقا في ملخصات الإنجاز الشهرية.
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                      hasSavedProgress
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {loadingProgress
                      ? "جاري الفحص"
                      : hasSavedProgress
                        ? "محفوظة"
                        : "تحتاج حفظ"}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-[1.5fr_0.75fr_0.75fr]">
                  <SurahInput
                    id="progress-start-surah-list"
                    label="سورة البداية"
                    value={progressData.startSurah}
                    onChange={(value) => setProgressField("startSurah", value)}
                    required={!formData.isAbsent}
                  />
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                      رقم الآية
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={progressData.startAyah}
                      onChange={(e) => setProgressField("startAyah", e.target.value)}
                      className={inputClass}
                      placeholder="اختياري"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                      رقم الصفحة
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="604"
                      value={progressData.startPage}
                      onChange={(e) => setProgressField("startPage", e.target.value)}
                      className={inputClass}
                      placeholder="اختياري"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                    ملاحظة البداية
                  </label>
                  <input
                    value={progressData.note}
                    onChange={(e) => setProgressField("note", e.target.value)}
                    className={inputClass}
                    placeholder="مثال: بدأ من سورة الناس للمراجعة والتثبيت"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveStudentProgress}
                  disabled={savingProgress || loadingProgress}
                  className="mt-4 rounded-2xl bg-[#0a3f2a] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f5a35] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProgress ? "جاري حفظ البداية..." : "حفظ بداية الطالب"}
                </button>
              </div>
            ) : null}

            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f6eee7] p-4 text-sm font-black text-[#1c2d31]">
              <input
                type="checkbox"
                checked={formData.isAbsent}
                onChange={(e) => setField("isAbsent", e.target.checked)}
                className="h-5 w-5"
              />
              الطالب غائب
            </label>

            {formData.isAbsent ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                سيتم حفظ غياب {selectedStudentName} مباشرة دون الحاجة لتعبئة الدرس أو المراجعة.
              </div>
            ) : null}
          </section>

          {!formData.isAbsent ? (
            <>
              {loadingHistory ? (
                <div className="rounded-2xl bg-[#edf6ee] p-4 text-sm font-bold text-[#0f5a35]">
                  جاري تعبئة واجب اليوم من آخر تقرير...
                </div>
              ) : null}

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">
                  {isNoorAlBayanReport ? "درس نور البيان" : "الدرس الجديد"}
                </h2>
                {isNoorAlBayanReport ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-[0.75fr_0.75fr_0.75fr_0.75fr_1.4fr]">
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          من صفحة
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.pageFrom}
                          onChange={(e) => setField("pageFrom", e.target.value)}
                          className={inputClass}
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          إلى صفحة
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.pageTo}
                          onChange={(e) => setField("pageTo", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          الكمية
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.noorLinesCount}
                          onChange={(e) =>
                            setField("noorLinesCount", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          نوع الكمية
                        </label>
                        <select
                          value={formData.noorProgressUnit}
                          onChange={(e) =>
                            setField("noorProgressUnit", e.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="PAGE">صفحة</option>
                          <option value="LINE">سطر</option>
                        </select>
                      </div>
                      <div className="rounded-2xl bg-[#f6eee7] p-4">
                        <p className="text-xs font-black text-[#0f5a35]">
                          الدرس التلقائي
                        </p>
                        <p className="mt-2 text-sm font-black leading-7 text-[#1c2d31]">
                          {currentNoorLesson
                            ? `${currentNoorLesson.section}: ${currentNoorLesson.title}`
                            : "أدخل رقم الصفحة ليظهر عنوان الدرس"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 max-w-xs">
                      <MemorizedSelect
                        label="حالة الدرس"
                        value={formData.lessonMemorized}
                        onChange={(value) => setField("lessonMemorized", value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                      <SurahInput
                        id="lesson-surah-list"
                        label="اسم السورة"
                        value={formData.lessonSurah}
                        onChange={(value) => setField("lessonSurah", value)}
                        required
                      />
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          من الآية
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.pageFrom}
                          onChange={(e) => setField("pageFrom", e.target.value)}
                          placeholder="مثال: 1"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          إلى الآية
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.pageTo}
                          onChange={(e) => setField("pageTo", e.target.value)}
                          placeholder="مثال: 10"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="mt-4 max-w-xs">
                      <MemorizedSelect
                        label="حالة الدرس"
                        value={formData.lessonMemorized}
                        onChange={(value) => setField("lessonMemorized", value)}
                      />
                    </div>
                  </>
                )}
              </section>



              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">
                  المراجعة <span className="text-sm font-bold text-[#1c2d31]/40">(اختياري)</span>
                </h2>
                {isNoorAlBayanReport ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                        نطاق المراجعة
                      </label>
                      <select
                        value={formData.noorReviewScope}
                        onChange={(e) =>
                          setField("noorReviewScope", e.target.value)
                        }
                        className={inputClass}
                      >
                        {noorAlBayanReviewOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formData.noorReviewScope === "مراجعة مخصصة" ? (
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          وصف المراجعة
                        </label>
                        <input
                          value={formData.noorReviewCustom}
                          onChange={(e) =>
                            setField("noorReviewCustom", e.target.value)
                          }
                          placeholder="مثال: مراجعة من صفحة 12 إلى صفحة 18"
                          className={inputClass}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                    <SurahInput
                      id="review-surah-list"
                      label="اسم السورة"
                      value={formData.reviewSurah}
                      onChange={(value) => setField("reviewSurah", value)}
                    />
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                        من الآية
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.reviewFrom}
                        onChange={(e) => setField("reviewFrom", e.target.value)}
                        placeholder="مثال: 30"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                        إلى الآية
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.reviewTo}
                        onChange={(e) => setField("reviewTo", e.target.value)}
                        placeholder="مثال: 5"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
                <div className="mt-4 max-w-xs">
                  <MemorizedSelect
                    label="حالة المراجعة"
                    value={formData.reviewMemorized}
                    onChange={(value) => setField("reviewMemorized", value)}
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">
                  واجب اليوم التالي
                </h2>
                {isNoorAlBayanReport ? (
                  <div className="rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                    <div className="mb-4">
                      <h3 className="text-base font-black text-[#1c2d31]">
                        واجب نور البيان القادم
                      </h3>
                      <p className="mt-1 text-xs font-bold leading-6 text-[#1c2d31]/60">
                        أدخل الصفحة أو عدد الأسطر، وسيظهر عنوان الدرس تلقائيًا حسب الكتاب.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[0.75fr_0.75fr_0.75fr_0.75fr_1.4fr]">
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          من صفحة
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.noorNextPageFrom}
                          onChange={(e) =>
                            setField("noorNextPageFrom", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          إلى صفحة
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.noorNextPageTo}
                          onChange={(e) =>
                            setField("noorNextPageTo", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          الكمية
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.noorNextLinesCount}
                          onChange={(e) =>
                            setField("noorNextLinesCount", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          نوع الكمية
                        </label>
                        <select
                          value={formData.noorNextUnit}
                          onChange={(e) => setField("noorNextUnit", e.target.value)}
                          className={inputClass}
                        >
                          <option value="PAGE">صفحة</option>
                          <option value="LINE">سطر</option>
                        </select>
                      </div>
                      <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e7d7b4]">
                        <p className="text-xs font-black text-[#0f5a35]">
                          درس الواجب
                        </p>
                        <p className="mt-2 text-sm font-black leading-7 text-[#1c2d31]">
                          {nextNoorLesson
                            ? `${nextNoorLesson.section}: ${nextNoorLesson.title}`
                            : "أدخل رقم صفحة الواجب ليظهر الدرس"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-[#e7d7b4]">
                      <div className="mb-4">
                        <h3 className="text-base font-black text-[#1c2d31]">
                          واجب الدرس الجديد
                        </h3>
                        <p className="mt-1 text-xs font-bold leading-6 text-[#1c2d31]/60">
                          عند الانتقال بين سورتين اختر سورة البداية وسورة النهاية.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <SurahInput
                          id="next-lesson-start-surah-list"
                          label="سورة البداية"
                          value={formData.nextLessonStartSurah}
                          onChange={(value) =>
                            setField("nextLessonStartSurah", value)
                          }
                        />
                        <SurahInput
                          id="next-lesson-end-surah-list"
                          label="سورة النهاية"
                          value={formData.nextLessonEndSurah}
                          onChange={(value) =>
                            setField("nextLessonEndSurah", value)
                          }
                        />
                        <div>
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            من الآية
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.nextLessonFrom}
                            onChange={(e) =>
                              setField("nextLessonFrom", e.target.value)
                            }
                            placeholder="مثال: 1"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            إلى الآية
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.nextLessonTo}
                            onChange={(e) =>
                              setField("nextLessonTo", e.target.value)
                            }
                            placeholder="مثال: 10"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-[#f4fbf8] p-4 ring-1 ring-[#cfe3d9]">
                      <div className="mb-4">
                        <h3 className="text-base font-black text-[#1c2d31]">
                          واجب المراجعة <span className="text-xs font-bold text-[#1c2d31]/40">(اختياري)</span>
                        </h3>
                        <p className="mt-1 text-xs font-bold leading-6 text-[#1c2d31]/60">
                          يصلح للمراجعة داخل سورة واحدة أو من نهاية سورة إلى بداية سورة أخرى.
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <SurahInput
                          id="next-review-start-surah-list"
                          label="سورة البداية"
                          value={formData.nextReviewStartSurah}
                          onChange={(value) =>
                            setField("nextReviewStartSurah", value)
                          }
                        />
                        <SurahInput
                          id="next-review-end-surah-list"
                          label="سورة النهاية"
                          value={formData.nextReviewEndSurah}
                          onChange={(value) =>
                            setField("nextReviewEndSurah", value)
                          }
                        />
                        <div>
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            من الآية
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.nextReviewFrom}
                            onChange={(e) =>
                              setField("nextReviewFrom", e.target.value)
                            }
                            placeholder="مثال: 30"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            إلى الآية
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.nextReviewTo}
                            onChange={(e) =>
                              setField("nextReviewTo", e.target.value)
                            }
                            placeholder="مثال: 5"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-4 rounded-2xl bg-[#0a3f2a] p-4 text-sm leading-7 text-white">
                  <p className="text-xs font-black text-[#f2d18a]">
                    صيغة الواجب التي ستحفظ في التقرير
                  </p>
                  <p className="mt-2 font-bold">
                    {(isNoorAlBayanReport
                      ? buildNoorNextHomework()
                      : buildNextHomework()) || "لم يتم تحديد واجب اليوم التالي بعد"}
                  </p>
                </div>
              </section>

              <section className={sectionClass}>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  ملاحظات سريعة جاهزة
                </label>
                <select
                  value={selectedNotePreset}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedNotePreset(value);
                    setField("note", value);
                  }}
                  className={inputClass}
                >
                  <option value="">اختر ملاحظة جاهزة لإدراجها تلقائيًا</option>
                  {reportNotePresetOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </section>
            </>
          ) : null}

          <div className="sticky bottom-4 flex gap-3 rounded-[2rem] bg-white/90 p-3 shadow-lg ring-1 ring-[#d8bf83] backdrop-blur">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-[#0f5a35] px-5 py-4 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "جاري الحفظ..."
                : isEditingReport
                  ? "حفظ التعديل"
                  : formData.isAbsent
                    ? "حفظ غياب الطالب"
                    : "حفظ التقرير"}
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  circleIdFromUrl
                    ? `/syria/teacher/dashboard?circleId=${circleIdFromUrl}`
                    : "/syria/teacher/dashboard"
                )
              }
              className="rounded-2xl border border-[#d8bf83] px-5 py-4 text-sm font-black text-[#1c2d31] transition hover:bg-[#f6eee7]"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function NewReportPage() {
  return (
    <Suspense
      fallback={
        <div className="rahma-shell min-h-screen p-6 text-center text-[#1c2d31]">
          جاري تحميل صفحة التقرير...
        </div>
      }
    >
      <NewReportForm />
    </Suspense>
  );
}

