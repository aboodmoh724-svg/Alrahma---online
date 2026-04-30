export const TEACHER_VISIT_TRACK_OPTIONS = [
  "مسار التلاوة",
  "الحفظ الفردي",
  "المسار الرباعي",
  "مسار الهجاء",
] as const;

export const TEACHER_VISIT_PERIOD_OPTIONS = [
  "الفترة الصباحية 09:00 - 12:00",
  "الفترة المسائية الأولى 15:00 - 18:00",
  "الفترة المسائية الثانية 19:00 - 22:00",
  "الفترة المسائية الثالثة 23:00 - 02:00",
  "الفترة المسائية الرابعة 03:00 - 06:00",
] as const;

export const TEACHER_VISIT_EVALUATION_OPTIONS = [
  "ممتاز",
  "جيد جدًا",
  "جيد",
  "يحتاج متابعة",
] as const;

export const TEACHER_VISIT_MAIN_ITEMS = [
  "تسميع الدرس الجديد بالعين",
  "تسميع آخر خمس صفحات",
  "المراجعة",
  "تصحيح وتلقين الدرس الجديد",
] as const;

export const TEACHER_VISIT_GENERAL_ITEMS = [
  "انضباط الحلقة",
  "الحضور في الوقت المحدد",
  "الانصراف في الوقت المحدد",
  "وضوح الصوت والإضاءة",
  "جودة اتصال الإنترنت",
  "الاهتمام برفع مستوى الطلاب",
  "تشجيع الطلاب",
  "الالتزام بإعدادات Zoom والتعليمات",
] as const;

export type TeacherVisitMainItem = {
  label: string;
  note: string;
};

export type TeacherVisitGeneralItem = {
  label: string;
  evaluation: string;
};

export type TeacherVisitTypeValue = "FIELD" | "SECRET";

export function teacherVisitTypeLabel(value: TeacherVisitTypeValue) {
  return value === "SECRET" ? "سرية" : "ميدانية";
}

export function teacherVisitDayLabel(date: string | Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function teacherVisitDateLabel(date: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
