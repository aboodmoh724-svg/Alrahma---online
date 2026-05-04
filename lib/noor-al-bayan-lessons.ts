export type NoorAlBayanLesson = {
  pageFrom: number;
  pageTo: number;
  title: string;
  section: string;
};

export const noorAlBayanLessons: NoorAlBayanLesson[] = [
  { pageFrom: 5, pageTo: 7, section: "التمهيد", title: "حروف الهجاء واختبار الحروف" },
  { pageFrom: 8, pageTo: 8, section: "التمهيد", title: "الحروف المتشابهة" },
  { pageFrom: 9, pageTo: 11, section: "الحركات", title: "التدريب بالفتح" },
  { pageFrom: 12, pageTo: 12, section: "الحركات", title: "الحركات الثلاثة" },
  { pageFrom: 13, pageTo: 13, section: "الحروف", title: "لام ألف وهمزة القطع" },
  { pageFrom: 14, pageTo: 15, section: "الحركات", title: "كلمات بالفتح" },
  { pageFrom: 16, pageTo: 17, section: "الحركات", title: "التدريب بالضم" },
  { pageFrom: 18, pageTo: 19, section: "الحركات", title: "كلمات بالضم" },
  { pageFrom: 20, pageTo: 21, section: "الحركات", title: "التدريب بالكسر" },
  { pageFrom: 22, pageTo: 23, section: "الحركات", title: "كلمات بالكسر" },
  { pageFrom: 24, pageTo: 28, section: "المدود", title: "التدريب بالألف" },
  { pageFrom: 29, pageTo: 33, section: "المدود", title: "التدريب بالواو" },
  { pageFrom: 34, pageTo: 36, section: "المدود", title: "كلمات بأحد حروف المد" },
  { pageFrom: 37, pageTo: 39, section: "المدود", title: "مد الألف والواو والياء" },
  { pageFrom: 40, pageTo: 44, section: "التنوين", title: "التنوين بالفتح" },
  { pageFrom: 45, pageTo: 48, section: "التنوين", title: "التنوين بالضم والكسر" },
  { pageFrom: 49, pageTo: 52, section: "السكون", title: "التدريب بالسكون" },
  { pageFrom: 53, pageTo: 57, section: "الشدة", title: "الشدة والتشديد" },
  { pageFrom: 58, pageTo: 59, section: "تطبيقات قرآنية", title: "تدريبات من القرآن الكريم" },
  { pageFrom: 60, pageTo: 66, section: "الشدة والتنوين", title: "التدريب على الشدة والتنوين" },
  { pageFrom: 67, pageTo: 69, section: "الشدة", title: "كلمات مشددة" },
  { pageFrom: 70, pageTo: 71, section: "تطبيقات قرآنية", title: "تدريبات قرآنية" },
  { pageFrom: 72, pageTo: 76, section: "أحكام القراءة", title: "تدريبات اللام وأحكامها" },
  { pageFrom: 77, pageTo: 78, section: "أحكام القراءة", title: "تدريبات عامة على القراءة" },
  { pageFrom: 79, pageTo: 81, section: "تدريبات قرآنية", title: "كلمات قرآنية للتدريب" },
  { pageFrom: 82, pageTo: 85, section: "تدريبات قرآنية", title: "تدريبات قرآنية متقدمة" },
  { pageFrom: 86, pageTo: 86, section: "خاتمة الكتاب", title: "مراجعة عامة" },
];

export const noorAlBayanReviewOptions = [
  "مراجعة آخر درس",
  "مراجعة آخر 3 صفحات",
  "مراجعة آخر 5 صفحات",
  "مراجعة آخر 7 صفحات",
  "مراجعة آخر 10 صفحات",
  "مراجعة مخصصة",
];

export function findNoorAlBayanLesson(pageValue: string | number) {
  const page = Number(pageValue);

  if (!Number.isFinite(page) || page <= 0) {
    return null;
  }

  return (
    noorAlBayanLessons.find(
      (lesson) => page >= lesson.pageFrom && page <= lesson.pageTo
    ) || null
  );
}

export function formatNoorAlBayanRange({
  pageFrom,
  pageTo,
  linesCount,
  amountUnit,
}: {
  pageFrom: string;
  pageTo: string;
  linesCount?: string;
  amountUnit?: string;
}) {
  const from = pageFrom.trim();
  const to = pageTo.trim();
  const lines = String(linesCount || "").trim();
  const lesson = findNoorAlBayanLesson(from || to);
  const pageText =
    from || to ? `من صفحة ${from || "-"} إلى صفحة ${to || from || "-"}` : "";
  const unitLabel = amountUnit === "PAGE" ? "صفحة" : "سطر";
  const amountText = lines ? `الكمية: ${lines} ${unitLabel}` : "";

  return [lesson ? `${lesson.section}: ${lesson.title}` : "", pageText, amountText]
    .filter(Boolean)
    .join(" - ");
}
