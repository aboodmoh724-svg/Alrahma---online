export const TEACHER_VISIT_TRACK_OPTIONS = [
  "مسار التلاوة",
  "الحفظ الفردي",
  "المسار الرباعي",
  "مسار الهجاء",
] as const;

export const TEACHER_VISIT_PERIOD_OPTIONS = [
  "الفترة الأولى",
  "الفترة الثانية",
  "الفترة الثالثة",
] as const;

export const TEACHER_VISIT_EVALUATION_OPTIONS = [
  "ممتاز",
  "جيد جدًا",
  "جيد",
  "يحتاج متابعة",
] as const;

export const TEACHER_VISIT_MAIN_ITEMS = [
  "تسمية الدرس الجديد",
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
