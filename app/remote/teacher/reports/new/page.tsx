"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Student = {
  id: string;
  fullName: string;
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
    nextLessonHomework: "",
    nextReviewHomework: "",
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
        const studentsUrl = circleIdFromUrl
          ? `/api/students?circleId=${circleIdFromUrl}`
          : "/api/students";
        const res = await fetch(studentsUrl, { cache: "no-store" });
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
    if (!formData.studentId) {
      setSuggestedHomework("");
      return;
    }

    const fetchStudentHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await fetch(`/api/students/${formData.studentId}/history`, {
          cache: "no-store",
        });
        const data = await res.json();
        setSuggestedHomework(
          res.ok && typeof data.lastNextHomework === "string"
            ? data.lastNextHomework
            : ""
        );
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

  const buildNextHomework = () => {
    const parts = [
      formData.nextLessonHomework
        ? `الدرس الجديد: ${formData.nextLessonHomework}`
        : "",
      formData.nextReviewHomework
        ? `المراجعة: ${formData.nextReviewHomework}`
        : "",
    ].filter(Boolean);

    return parts.join(" | ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextHomework = buildNextHomework();
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
      nextLessonHomework: formData.nextLessonHomework,
      nextReviewHomework: formData.nextReviewHomework,
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                      الدرس الجديد
                    </label>
                    <textarea
                      value={formData.nextLessonHomework}
                      onChange={(e) => setField("nextLessonHomework", e.target.value)}
                      rows={3}
                      placeholder="مثال: سورة الكهف من آية 1 إلى 10"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                      المراجعة
                    </label>
                    <textarea
                      value={formData.nextReviewHomework}
                      onChange={(e) => setField("nextReviewHomework", e.target.value)}
                      rows={3}
                      placeholder="مثال: مراجعة سورة البقرة من 20 إلى 25"
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              <section className={sectionClass}>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  الملاحظات
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setField("note", e.target.value)}
                  rows={4}
                  placeholder="أي ملاحظات تربوية أو تنبيه مختصر"
                  className={inputClass}
                />
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
