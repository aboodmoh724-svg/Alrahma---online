import type { StudyMode } from "@prisma/client";

export const studyModes = ["REMOTE", "ONSITE", "ONSITE_SYRIA", "ONSITE_SUMMER"] as const satisfies readonly StudyMode[];

export type AlrahmaStudyMode = (typeof studyModes)[number];

export function normalizeStudyMode(value: unknown): AlrahmaStudyMode | undefined {
  return studyModes.includes(value as AlrahmaStudyMode)
    ? (value as AlrahmaStudyMode)
    : undefined;
}

export function getStudyModeLabel(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "Remote";
  if (studyMode === "ONSITE_SYRIA") return "Onsite - Syria";
  if (studyMode === "ONSITE_SUMMER") return "Onsite - Summer";
  return "Onsite - Afyon";
}

export function getTeacherLoginPath(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "/remote/teacher/login";
  if (studyMode === "ONSITE_SYRIA") return "/syria/teacher/login";
  if (studyMode === "ONSITE_SUMMER") return "/onsite/summer/teacher/login";
  return "/onsite/teacher/login";
}

export function getTeacherDashboardPath(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "/remote/teacher/dashboard";
  if (studyMode === "ONSITE_SYRIA") return "/syria/teacher/dashboard";
  if (studyMode === "ONSITE_SUMMER") return "/onsite/summer/teacher";
  return "/onsite/teacher/dashboard";
}

export function getAdminDashboardPath(studyMode: StudyMode | AlrahmaStudyMode) {
  if (studyMode === "REMOTE") return "/remote/admin/dashboard";
  if (studyMode === "ONSITE_SYRIA") return "/syria/admin/dashboard";
  if (studyMode === "ONSITE_SUMMER") return "/onsite/summer/admin";
  return "/onsite/admin/dashboard";
}


