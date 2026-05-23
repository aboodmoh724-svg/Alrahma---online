import type { StudyMode } from "@prisma/client";

export const studyModes = ["REMOTE", "ONSITE", "ONSITE_SYRIA"] as const satisfies readonly StudyMode[];

export type AlrahmaStudyMode = (typeof studyModes)[number];

export function normalizeStudyMode(value: unknown): AlrahmaStudyMode | undefined {
  return studyModes.includes(value as AlrahmaStudyMode)
    ? (value as AlrahmaStudyMode)
    : undefined;
}

export function getStudyModeLabel(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "Remote";
  if (studyMode === "ONSITE_SYRIA") return "Onsite - Syria";
  return "Onsite - Afyon";
}

export function getTeacherLoginPath(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "/remote/teacher/login";
  if (studyMode === "ONSITE_SYRIA") return "/syria/teacher/login";
  return "/onsite/teacher/login";
}

export function getTeacherDashboardPath(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "/remote/teacher/dashboard";
  if (studyMode === "ONSITE_SYRIA") return "/syria/teacher/dashboard";
  return "/onsite/teacher/dashboard";
}

export function getAdminDashboardPath(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "/remote/admin/dashboard";
  if (studyMode === "ONSITE_SYRIA") return "/syria/admin/dashboard";
  return "/onsite/admin/dashboard";
}
