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
  "ممتاز ومتابع بشكل جيد.",
  "يحتاج إلى مزيد من المراجعة اليومية.",
  "مستواه جيد لكن يحتاج إلى تثبيت الحفظ.",
  "نرجو متابعة ولي الأمر للواجب بشكل يومي.",
  "يوجد تشتت أثناء الحلقة ويحتاج إلى تركيز أكبر.",
  "تحسن واضح عن الحصص السابقة.",
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

  const pagesCount = text.match(/عدد الصفحات:\s*([0-9٠-٩]+)/)?.[1] || "";
  const crossSurahMatch = text.match(
    /من سورة\s+(.+?)(?:\s+\((.*?)\))?\s+إلى سورة\s+(.+?)(?:\s+\((.*?)\))?(?:\s+-|$)/
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

  const surah = text.match(/سورة\s+(.+?)(?:\s+-|$)/)?.[1]?.trim() || "";
  const range = text.match(/من\s+(.+?)\s+إلى\s+(.+?)(?:\s+-|$)/);

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

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestedHomework, setSuggestedHomework] = useState("");
  const [selectedNotePreset, setSelectedNotePreset] = useState("");
  const [reportNotePresetOptions, setReportNotePresetOptions] = useState(notePresetOptions);

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
        studentsUrl.searchParams.set("studyMode", "ONSITE");
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
          .filter(Boolean);

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
        historyUrl.searchParams.set("studyMode", "ONSITE");

        const res = await fetch(historyUrl.toString(), {
          cache: "no-store",
        });
        const data = await res.json();
        const previousLessonHomework =
          res.ok && typeof data.previousReport?.nextLessonHomework === "string"
            ? data.previousReport.nextLessonHomework
            : "";
        const previousReviewHomework =
          res.ok && typeof data.previousReport?.nextReviewHomework === "string"
            ? data.previousReport.nextReviewHomework
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
  }, [formData.studentId]);

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
          `من سورة ${start}${fromText ? ` (${fromText})` : ""}`,
          `إلى سورة ${end}${toText ? ` (${toText})` : ""}`,
        ].join(" ")
      : start || end
        ? `سورة ${start || end}`
        : "";

    const rangeText = isCrossSurah
      ? ""
      : fromText || toText
        ? `من ${fromText || "-"} إلى ${toText || "-"}`
        : "";
    const pagesLabel = pagesText ? `عدد الصفحات: ${pagesText}` : "";

    return [surahText, rangeText, pagesLabel].filter(Boolean).join(" - ");
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
          ? `سورة ${formData.reviewSurah} من ${formData.reviewFrom || "-"} إلى ${formData.reviewTo || "-"}`
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
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

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
        (formData.isAbsent ? "تم حفظ غياب الطالب" : "تم حفظ التقرير بنجاح") +
          whatsappStatus
      );
      router.push(
        circleIdFromUrl
          ? `/onsite/teacher/dashboard?circleId=${circleIdFromUrl}`
          : "/onsite/teacher/dashboard"
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
            <h1 className="mt-2 text-3xl font-black">إضافة تقرير للطالب</h1>
            <p className="mt-2 text-sm leading-7 text-white/72">
              اختر الطالب، ثم إن كان غائبا احفظ الغياب مباشرة. وإن كان حاضرا أدخل الدرس والمراجعة وواجب الغد.
            </p>
          </div>
          <Link
            href={
              circleIdFromUrl
                ? `/onsite/teacher/dashboard?circleId=${circleIdFromUrl}`
                : "/onsite/teacher/dashboard"
            }
            className="rounded-2xl bg-white/12 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/20"
          >
            رجوع للوحة المعلم
          </Link>
        </div>

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
              disabled={loadingStudents}
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
                  جاري جلب واجب الغد السابق للطالب...
                </div>
              ) : suggestedHomework ? (
                <div className="rounded-2xl bg-[#edf6ee] p-4 text-sm leading-7 text-[#0f5a35]">
                  واجب اليوم المقترح من آخر تقرير: {suggestedHomework}
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
                    <div className="grid gap-4 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.9fr]">
                      <SurahInput
                        id="lesson-surah-list"
                        label="اسم السورة"
                        value={formData.lessonSurah}
                        onChange={(value) => setField("lessonSurah", value)}
                        required
                      />
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          من
                        </label>
                        <input
                          value={formData.pageFrom}
                          onChange={(e) => setField("pageFrom", e.target.value)}
                          placeholder="مثال: 1 أو بداية السورة"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          إلى
                        </label>
                        <input
                          value={formData.pageTo}
                          onChange={(e) => setField("pageTo", e.target.value)}
                          placeholder="مثال: 10 أو نهاية السورة"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                          عدد الصفحات
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.pagesCount}
                          onChange={(e) => setField("pagesCount", e.target.value)}
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

              {!isNoorAlBayanReport ? (
                <section className={sectionClass}>
                  <h2 className="mb-4 text-xl font-black text-[#1c2d31]">
                    آخر خمس صفحات
                  </h2>
                  <div className="max-w-xs">
                    <MemorizedSelect
                      label="هل أتقن آخر خمس صفحات؟"
                      value={formData.lastFiveMemorized}
                      onChange={(value) => setField("lastFiveMemorized", value)}
                    />
                  </div>
                </section>
              ) : null}

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">
                  المراجعة
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
                  <div className="grid gap-4 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.9fr]">
                    <SurahInput
                      id="review-surah-list"
                      label="اسم السورة"
                      value={formData.reviewSurah}
                      onChange={(value) => setField("reviewSurah", value)}
                    />
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                        من
                      </label>
                      <input
                        value={formData.reviewFrom}
                        onChange={(e) => setField("reviewFrom", e.target.value)}
                        placeholder="مثال: 30 أو نهاية السورة"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                        إلى
                      </label>
                      <input
                        value={formData.reviewTo}
                        onChange={(e) => setField("reviewTo", e.target.value)}
                        placeholder="مثال: 5 أو بداية السورة"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                        عدد الصفحات
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.reviewPagesCount}
                        onChange={(e) =>
                          setField("reviewPagesCount", e.target.value)
                        }
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
                  واجب غدا
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
                            من
                          </label>
                          <input
                            value={formData.nextLessonFrom}
                            onChange={(e) =>
                              setField("nextLessonFrom", e.target.value)
                            }
                            placeholder="مثال: آية 1 أو نهاية السورة"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            إلى
                          </label>
                          <input
                            value={formData.nextLessonTo}
                            onChange={(e) =>
                              setField("nextLessonTo", e.target.value)
                            }
                            placeholder="مثال: آية 10 أو بداية السورة"
                            className={inputClass}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            عدد الصفحات
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.nextLessonPagesCount}
                            onChange={(e) =>
                              setField("nextLessonPagesCount", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-[#f4fbf8] p-4 ring-1 ring-[#cfe3d9]">
                      <div className="mb-4">
                        <h3 className="text-base font-black text-[#1c2d31]">
                          واجب المراجعة
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
                            من
                          </label>
                          <input
                            value={formData.nextReviewFrom}
                            onChange={(e) =>
                              setField("nextReviewFrom", e.target.value)
                            }
                            placeholder="مثال: آية 30 أو نهاية السورة"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            إلى
                          </label>
                          <input
                            value={formData.nextReviewTo}
                            onChange={(e) =>
                              setField("nextReviewTo", e.target.value)
                            }
                            placeholder="مثال: آية 5 أو بداية السورة"
                            className={inputClass}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                            عدد الصفحات
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.nextReviewPagesCount}
                            onChange={(e) =>
                              setField("nextReviewPagesCount", e.target.value)
                            }
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
                      : buildNextHomework()) || "لم يتم تحديد واجب الغد بعد"}
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
                : formData.isAbsent
                  ? "حفظ غياب الطالب"
                  : "حفظ التقرير"}
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  circleIdFromUrl
                    ? `/onsite/teacher/dashboard?circleId=${circleIdFromUrl}`
                    : "/onsite/teacher/dashboard"
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

