import type { Prisma } from "@prisma/client";
import { appUrl } from "@/lib/app-url";
import { publicStorageUrl } from "@/lib/local-storage";

export type AnnualReportImportRecord = {
  student_key?: unknown;
  student_name?: unknown;
  teacher_name?: unknown;
  halaqa_type?: unknown;
  academic_year?: unknown;
  first_evaluation?: unknown;
  second_evaluation?: unknown;
  final_rating?: unknown;
  memorized_during_year?: unknown;
  learned_during_year?: unknown;
  student_strengths?: unknown;
  behavior_notes?: unknown;
  student_needs?: unknown;
  parent_message?: unknown;
  report_image_filename?: unknown;
  source_row_number?: unknown;
  data_status?: unknown;
  notes?: unknown;
};

export function annualReportText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function annualReportString(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeAnnualReportName(value: string | null | undefined) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

export function annualReportFilename(value: unknown, fallbackKey: string) {
  const raw = annualReportString(value) || `${fallbackKey}.png`;
  return raw
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[^A-Za-z0-9._-]/g, "-");
}

export function annualReportPublicUrl(path: string | null | undefined) {
  const publicPath = publicStorageUrl(path);
  return publicPath ? appUrl(publicPath) : null;
}

export function annualReportCaption(input: {
  studentName: string;
  academicYear: string;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نضع بين أيديكم التقرير السنوي للطالب/ـة *${input.studentName}* للعام ${input.academicYear}.\n\n` +
    `نسأل الله أن يبارك فيه وينفع به ويجعله من أهل القرآن وخاصته.\n\n` +
    `قسم الإشراف التعليمي - تحفيظ الرحمة للقرآن الكريم`
  );
}

export function annualReportCreateData(input: {
  record: AnnualReportImportRecord;
  index: number;
  imagePath?: string | null;
  student?: {
    id: string;
    fullName: string;
    teacherId: string;
    circleId: string | null;
    teacher: { id: string; fullName: string };
    circle: { id: string; name: string } | null;
  } | null;
}): Prisma.AnnualReportCreateInput {
  const studentKey =
    annualReportString(input.record.student_key) ||
    `annual-2025-2026-${String(input.index + 1).padStart(4, "0")}`;
  const academicYear = annualReportString(input.record.academic_year) || "2025-2026";
  const imageFilename = annualReportFilename(input.record.report_image_filename, studentKey);
  const studentName =
    annualReportText(input.record.student_name) ||
    input.student?.fullName ||
    `طالب ${input.index + 1}`;

  return {
    studentKey,
    academicYear,
    studentName,
    teacherName:
      annualReportText(input.record.teacher_name) || input.student?.teacher.fullName || null,
    halaqaType: annualReportText(input.record.halaqa_type),
    firstEvaluation: annualReportText(input.record.first_evaluation),
    secondEvaluation: annualReportText(input.record.second_evaluation),
    finalRating: annualReportText(input.record.final_rating),
    memorizedDuringYear: annualReportText(input.record.memorized_during_year),
    learnedDuringYear: annualReportText(input.record.learned_during_year),
    studentStrengths: annualReportText(input.record.student_strengths),
    behaviorNotes: annualReportText(input.record.behavior_notes),
    studentNeeds: annualReportText(input.record.student_needs),
    parentMessage: annualReportText(input.record.parent_message),
    reportImagePath: input.imagePath || null,
    reportImageFilename: imageFilename,
    sourceRowNumber:
      Number.isFinite(Number(input.record.source_row_number))
        ? Number(input.record.source_row_number)
        : null,
    dataStatus: annualReportString(input.record.data_status) || "needs_review",
    reviewNotes: annualReportText(input.record.notes),
    ...(input.student
      ? {
          student: { connect: { id: input.student.id } },
          teacher: { connect: { id: input.student.teacherId } },
          ...(input.student.circleId
            ? { circle: { connect: { id: input.student.circleId } } }
            : {}),
        }
      : {}),
  };
}

export function annualReportUpdateData(
  data: Prisma.AnnualReportCreateInput
): Prisma.AnnualReportUpdateInput {
  return {
    studentName: data.studentName,
    teacherName: data.teacherName,
    halaqaType: data.halaqaType,
    firstEvaluation: data.firstEvaluation,
    secondEvaluation: data.secondEvaluation,
    finalRating: data.finalRating,
    memorizedDuringYear: data.memorizedDuringYear,
    learnedDuringYear: data.learnedDuringYear,
    studentStrengths: data.studentStrengths,
    behaviorNotes: data.behaviorNotes,
    studentNeeds: data.studentNeeds,
    parentMessage: data.parentMessage,
    reportImagePath: data.reportImagePath,
    reportImageFilename: data.reportImageFilename,
    sourceRowNumber: data.sourceRowNumber,
    dataStatus: data.dataStatus,
    reviewNotes: data.reviewNotes,
    reviewStatus: "REVIEW",
    reviewedAt: null,
    reviewer: { disconnect: true },
    sentAt: null,
    sender: { disconnect: true },
    sendError: null,
    student: data.student,
    teacher: data.teacher,
    circle: data.circle,
  };
}
