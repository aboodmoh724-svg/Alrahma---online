"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Student = {
  id: string;
  fullName: string;
};

type HistoryReport = {
  id: string;
  lessonName: string;
  lessonMemorized: boolean | null;
  lastFiveMemorized: boolean | null;
  review: string | null;
  reviewMemorized: boolean | null;
  homework: string;
  nextHomework: string | null;
  note: string | null;
  status: "PRESENT" | "ABSENT";
  createdAt: string;
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
  "w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10";

const sectionClass =
  "rounded-[2rem] border border-[#d9c8ad]/70 bg-white/86 p-5 shadow-sm";

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
      <input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اختر أو اكتب اسم السورة"
        className={inputClass}
        required={required}
      />
      <datalist id={id}>
        {surahNames.map((surah) => (
          <option key={surah} value={surah} />
        ))}
      </datalist>
    </div>
  );
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
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
  const [previousReport, setPreviousReport] = useState<HistoryReport | null>(null);
  const [recentReports, setRecentReports] = useState<HistoryReport[]>([]);
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
        const studentsUrl = new URL(
          circleIdFromUrl ? `/api/students?circleId=${circleIdFromUrl}` : "/api/students",
          window.location.origin
        );
        studentsUrl.searchParams.set("studyMode", "REMOTE");

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
      setPreviousReport(null);
      setRecentReports([]);
      return;
    }

    const fetchStudentHistory = async () => {
      try {
        setLoadingHistory(true);
        const historyUrl = new URL(
          `/api/students/${formData.studentId}/history`,
          window.location.origin
        );
        historyUrl.searchParams.set("studyMode", "REMOTE");

        const res = await fetch(historyUrl.toString(), {
          cache: "no-store",
        });
        const data = await res.json();
        setPreviousReport(res.ok && data.previousReport ? data.previousReport : null);
        setRecentReports(
          res.ok && Array.isArray(data.reports)
            ? data.reports.slice(0, 3)
            : []
        );
        setSuggestedHomework(
          res.ok && typeof data.lastNextHomework === "string"
            ? data.lastNextHomework
            : ""
        );
      } catch (error) {
        console.error("FETCH STUDENT HISTORY ERROR =>", error);
        setPreviousReport(null);
        setRecentReports([]);
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

  const selectedStudentName = useMemo(
    () =>
      students.find((student) => student.id === formData.studentId)?.fullName ||
      "الطالب",
    [formData.studentId, students]
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

  const memorizedLabel = (value: boolean | null) => {
    if (value === true) return "حافظ";
    if (value === false) return "غير حافظ";
    return "غير مسجل";
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
    const nextLessonHomework = buildHomeworkRange({
      startSurah: formData.nextLessonStartSurah,
      endSurah: formData.nextLessonEndSurah,
      from: formData.nextLessonFrom,
      to: formData.nextLessonTo,
      pagesCount: formData.nextLessonPagesCount,
    });
    const nextReviewHomework = buildHomeworkRange({
      startSurah: formData.nextReviewStartSurah,
      endSurah: formData.nextReviewEndSurah,
      from: formData.nextReviewFrom,
      to: formData.nextReviewTo,
      pagesCount: formData.nextReviewPagesCount,
    });
    const parts = [
      nextLessonHomework
        ? `الدرس الجديد: ${nextLessonHomework}`
        : "",
      nextReviewHomework
        ? `المراجعة: ${nextReviewHomework}`
        : "",
    ].filter(Boolean);

    return parts.join(" | ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextHomework = buildNextHomework();
    const nextLessonHomework = buildHomeworkRange({
      startSurah: formData.nextLessonStartSurah,
      endSurah: formData.nextLessonEndSurah,
      from: formData.nextLessonFrom,
      to: formData.nextLessonTo,
      pagesCount: formData.nextLessonPagesCount,
    });
    const nextReviewHomework = buildHomeworkRange({
      startSurah: formData.nextReviewStartSurah,
      endSurah: formData.nextReviewEndSurah,
      from: formData.nextReviewFrom,
      to: formData.nextReviewTo,
      pagesCount: formData.nextReviewPagesCount,
    });
    const lessonName = formData.isAbsent
      ? "غياب"
      : `الدرس الجديد: سورة ${formData.lessonSurah}`;

    const payload = {
      studentId: formData.studentId,
      status: formData.isAbsent ? "ABSENT" : "PRESENT",
      lessonName,
      lessonSurah: formData.lessonSurah,
      pageFrom: formData.pageFrom,
      pageTo: formData.pageTo,
      pagesCount: formData.pagesCount,
      lessonMemorized: toBooleanOrNull(formData.lessonMemorized),
      lastFiveMemorized: toBooleanOrNull(formData.lastFiveMemorized),
      review:
        formData.reviewSurah || formData.reviewFrom || formData.reviewTo
          ? `سورة ${formData.reviewSurah} من ${formData.reviewFrom || "-"} إلى ${formData.reviewTo || "-"}`
          : "",
      reviewSurah: formData.reviewSurah,
      reviewFrom: formData.reviewFrom,
      reviewTo: formData.reviewTo,
      reviewPagesCount: formData.reviewPagesCount,
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

      alert(formData.isAbsent ? "تم حفظ غياب الطالب" : "تم حفظ التقرير بنجاح");
      router.push(
        circleIdFromUrl
          ? `/remote/teacher/dashboard?circleId=${circleIdFromUrl}`
          : "/remote/teacher/dashboard"
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
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-[#173d42] p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-[#f1d39d]">تقرير اليوم</p>
            <h1 className="mt-2 text-3xl font-black">إضافة تقرير للطالب</h1>
            <p className="mt-2 text-sm leading-7 text-white/72">
              اختر الطالب، ثم إن كان غائبا احفظ الغياب مباشرة. وإن كان حاضرا أدخل الدرس والمراجعة وواجب الغد.
            </p>
          </div>
          <Link
            href={
              circleIdFromUrl
                ? `/remote/teacher/dashboard?circleId=${circleIdFromUrl}`
                : "/remote/teacher/dashboard"
            }
            className="rounded-2xl bg-white/12 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/20"
          >
            رجوع للوحة المعلم
          </Link>
        </div>

        {formData.studentId ? (
          <section className="mb-5 rounded-[2rem] border border-[#d9c8ad]/70 bg-[#fffaf2] p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black text-[#9b7039]">آخر متابعة داخل الأونلاين</p>
                <h2 className="mt-1 text-xl font-black text-[#1c2d31]">ملخص سريع قبل كتابة التقرير</h2>
              </div>
              {loadingHistory ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#8a6335] ring-1 ring-[#d9c8ad]">
                  جاري جلب السجل...
                </span>
              ) : null}
            </div>

            {previousReport ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6]">
                  <p className="text-xs font-black text-[#9b7039]">آخر يوم</p>
                  <p className="mt-2 text-sm font-black text-[#1c2d31]">
                    {new Date(previousReport.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                  <p className="mt-1 text-xs text-[#1c2d31]/60">
                    {previousReport.status === "PRESENT" ? "حاضر" : "غائب"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6]">
                  <p className="text-xs font-black text-[#9b7039]">حفظ الدرس</p>
                  <p className="mt-2 text-sm font-black text-[#1c2d31]">
                    {memorizedLabel(previousReport.lessonMemorized)}
                  </p>
                  <p className="mt-1 text-xs text-[#1c2d31]/60">
                    آخر خمس صفحات: {memorizedLabel(previousReport.lastFiveMemorized)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6]">
                  <p className="text-xs font-black text-[#9b7039]">حفظ المراجعة</p>
                  <p className="mt-2 text-sm font-black text-[#1c2d31]">
                    {memorizedLabel(previousReport.reviewMemorized)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6]">
                  <p className="text-xs font-black text-[#9b7039]">الدرس الأخير</p>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]">
                    {previousReport.lessonName}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6] md:col-span-2">
                  <p className="text-xs font-black text-[#9b7039]">الواجب السابق</p>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]">
                    {previousReport.nextHomework?.trim() || previousReport.homework || "لا يوجد واجب مسجل"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6] md:col-span-2">
                  <p className="text-xs font-black text-[#9b7039]">المراجعة السابقة</p>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]">
                    {previousReport.review?.trim() || "لا توجد مراجعة مسجلة"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6] md:col-span-2 xl:col-span-4">
                  <p className="text-xs font-black text-[#9b7039]">ملاحظات آخر تقرير</p>
                  <p className="mt-2 text-sm leading-7 text-[#1c2d31]">
                    {previousReport.note?.trim() || "لا توجد ملاحظات"}
                  </p>
                </div>

                {recentReports.length > 0 ? (
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc6] md:col-span-2 xl:col-span-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black text-[#9b7039]">آخر 3 تقارير</p>
                        <p className="mt-1 text-sm text-[#1c2d31]/60">
                          نظرة سريعة على سير الطالب في الأيام الأخيرة.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-3">
                      {recentReports.map((report, index) => (
                        <article key={report.id} className="rounded-2xl bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black text-[#9b7039]">
                                {index === 0 ? "الأحدث" : `قبل ${index} ${index === 1 ? "حصة" : "حصص"}`}
                              </p>
                              <p className="mt-1 text-sm font-black text-[#1c2d31]">
                                {new Date(report.createdAt).toLocaleDateString("ar-EG")}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1c2d31] ring-1 ring-[#d9c8ad]">
                              {report.status === "PRESENT" ? "حاضر" : "غائب"}
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-black text-[#1c2d31]">{report.lessonName}</p>

                          <div className="mt-3 space-y-2 text-sm text-[#1c2d31]/75">
                            <p>
                              <span className="font-black text-[#1c2d31]">حفظ الدرس: </span>
                              {memorizedLabel(report.lessonMemorized)}
                            </p>
                            <p>
                              <span className="font-black text-[#1c2d31]">الواجب: </span>
                              {report.nextHomework?.trim() || report.homework || "لا يوجد"}
                            </p>
                            <p>
                              <span className="font-black text-[#1c2d31]">المراجعة: </span>
                              {report.review?.trim() || "لا توجد"}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : loadingHistory ? null : (
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-[#1c2d31]/65 ring-1 ring-[#eadcc6]">
                لا يوجد تقرير سابق لهذا الطالب داخل قسم الأونلاين حتى الآن.
              </div>
            )}
          </section>
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
              disabled={loadingStudents}
            >
              <option value="">
                {loadingStudents ? "جاري تحميل الطلاب..." : "اختر الطالب"}
              </option>
              {formData.studentId && !selectedStudentExists ? (
                <option value={formData.studentId}>الطالب المحدد من الرابط</option>
              ) : null}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>

            <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#f7f0e6] p-4 text-sm font-black text-[#1c2d31]">
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
                <div className="rounded-2xl bg-[#e8f3ef] p-4 text-sm font-bold text-[#1f6358]">
                  جاري جلب واجب الغد السابق للطالب...
                </div>
              ) : suggestedHomework ? (
                <div className="rounded-2xl bg-[#e8f3ef] p-4 text-sm leading-7 text-[#1f6358]">
                  واجب اليوم المقترح من آخر تقرير: {suggestedHomework}
                </div>
              ) : null}

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">الدرس الجديد</h2>
                <div className="grid gap-4 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.9fr]">
                  <SurahInput
                    id="lesson-surah-list"
                    label="اسم السورة"
                    value={formData.lessonSurah}
                    onChange={(value) => setField("lessonSurah", value)}
                    required
                  />
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">من</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.pageFrom}
                      onChange={(e) => setField("pageFrom", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">إلى</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.pageTo}
                      onChange={(e) => setField("pageTo", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">عدد الصفحات</label>
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
              </section>

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">آخر خمس صفحات</h2>
                <div className="max-w-xs">
                  <MemorizedSelect
                    label="هل أتقن آخر خمس صفحات؟"
                    value={formData.lastFiveMemorized}
                    onChange={(value) => setField("lastFiveMemorized", value)}
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">المراجعة</h2>
                <div className="grid gap-4 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.9fr]">
                  <SurahInput
                    id="review-surah-list"
                    label="اسم السورة"
                    value={formData.reviewSurah}
                    onChange={(value) => setField("reviewSurah", value)}
                  />
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">من</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.reviewFrom}
                      onChange={(e) => setField("reviewFrom", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">إلى</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.reviewTo}
                      onChange={(e) => setField("reviewTo", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">عدد الصفحات</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.reviewPagesCount}
                      onChange={(e) => setField("reviewPagesCount", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-4 max-w-xs">
                  <MemorizedSelect
                    label="حالة المراجعة"
                    value={formData.reviewMemorized}
                    onChange={(value) => setField("reviewMemorized", value)}
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-black text-[#1c2d31]">واجب غدا</h2>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]">
                    <div className="mb-4">
                      <h3 className="text-base font-black text-[#1c2d31]">واجب الدرس الجديد</h3>
                      <p className="mt-1 text-xs font-bold leading-6 text-[#1c2d31]/60">
                        عند الانتقال بين سورتين اختر سورة البداية وسورة النهاية.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <SurahInput
                        id="next-lesson-start-surah-list"
                        label="سورة البداية"
                        value={formData.nextLessonStartSurah}
                        onChange={(value) => setField("nextLessonStartSurah", value)}
                      />
                      <SurahInput
                        id="next-lesson-end-surah-list"
                        label="سورة النهاية"
                        value={formData.nextLessonEndSurah}
                        onChange={(value) => setField("nextLessonEndSurah", value)}
                      />
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">من</label>
                        <input
                          value={formData.nextLessonFrom}
                          onChange={(e) => setField("nextLessonFrom", e.target.value)}
                          placeholder="مثال: آية 1 أو نهاية السورة"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">إلى</label>
                        <input
                          value={formData.nextLessonTo}
                          onChange={(e) => setField("nextLessonTo", e.target.value)}
                          placeholder="مثال: آية 10 أو بداية السورة"
                          className={inputClass}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">عدد الصفحات</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.nextLessonPagesCount}
                          onChange={(e) => setField("nextLessonPagesCount", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-[#f4fbf8] p-4 ring-1 ring-[#cfe3d9]">
                    <div className="mb-4">
                      <h3 className="text-base font-black text-[#1c2d31]">واجب المراجعة</h3>
                      <p className="mt-1 text-xs font-bold leading-6 text-[#1c2d31]/60">
                        يصلح للمراجعة داخل سورة واحدة أو من نهاية سورة إلى بداية سورة أخرى.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <SurahInput
                        id="next-review-start-surah-list"
                        label="سورة البداية"
                        value={formData.nextReviewStartSurah}
                        onChange={(value) => setField("nextReviewStartSurah", value)}
                      />
                      <SurahInput
                        id="next-review-end-surah-list"
                        label="سورة النهاية"
                        value={formData.nextReviewEndSurah}
                        onChange={(value) => setField("nextReviewEndSurah", value)}
                      />
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">من</label>
                        <input
                          value={formData.nextReviewFrom}
                          onChange={(e) => setField("nextReviewFrom", e.target.value)}
                          placeholder="مثال: آية 30 أو نهاية السورة"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">إلى</label>
                        <input
                          value={formData.nextReviewTo}
                          onChange={(e) => setField("nextReviewTo", e.target.value)}
                          placeholder="مثال: آية 5 أو بداية السورة"
                          className={inputClass}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-black text-[#1c2d31]">عدد الصفحات</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.nextReviewPagesCount}
                          onChange={(e) => setField("nextReviewPagesCount", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-[#173d42] p-4 text-sm leading-7 text-white">
                  <p className="text-xs font-black text-[#f1d39d]">صيغة الواجب التي ستحفظ في التقرير</p>
                  <p className="mt-2 font-bold">
                    {buildNextHomework() || "لم يتم تحديد واجب الغد بعد"}
                  </p>
                </div>
              </section>

              <section className={sectionClass}>
                <div>
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
                </div>
              </section>
            </>
          ) : null}

          <div className="sticky bottom-4 flex gap-3 rounded-[2rem] bg-white/90 p-3 shadow-lg ring-1 ring-[#d9c8ad] backdrop-blur">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-[#1f6358] px-5 py-4 text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
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
                    ? `/remote/teacher/dashboard?circleId=${circleIdFromUrl}`
                    : "/remote/teacher/dashboard"
                )
              }
              className="rounded-2xl border border-[#d9c8ad] px-5 py-4 text-sm font-black text-[#1c2d31] transition hover:bg-[#f7f0e6]"
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
