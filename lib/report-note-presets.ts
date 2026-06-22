import { prisma } from "@/lib/prisma";

const REPORT_NOTE_PRESETS_KEY = "remote_report_note_presets";

export const DEFAULT_REPORT_NOTE_PRESETS = [
  "نشكر الطالب على أدائه المميز هذا اليوم.",
  "نحث الطالب على الحضور في الوقت المحدد وعدم التأخر.",
  "نحث الطالب على الانضباط في الحلقة والإستماع إلى توجيهات المعلم.",
  "نحث الطالب على تحضير المراجعة اليومية جيدا في المنزل.",
  "نحث الطالب على تحضير اخر 5 صفحات جيدا في المنزل.",
  "نحث الطالب على تحضير اخر 5 صفحات والمراجعة اليومية جيدا في المنزل.",
  "نحث الطالب على تحضير الدرس جيدا في المنزل.",
  "نحث الطالب على مراجعة الأخطاء المكررة جيدا."
];

function normalizeNotePresets(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_REPORT_NOTE_PRESETS;
  }

  const presets = value
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return presets.length > 0 ? presets : DEFAULT_REPORT_NOTE_PRESETS;
}

export async function getReportNotePresets() {
  const setting = await prisma.appSetting.findUnique({
    where: {
      key: REPORT_NOTE_PRESETS_KEY,
    },
    select: {
      value: true,
    },
  });

  if (!setting || typeof setting.value !== "object" || !setting.value) {
    return DEFAULT_REPORT_NOTE_PRESETS;
  }

  const rawPresets =
    "presets" in setting.value
      ? (setting.value as { presets?: unknown }).presets
      : setting.value;

  return normalizeNotePresets(rawPresets);
}

export async function saveReportNotePresets(presets: string[]) {
  const normalizedPresets = normalizeNotePresets(presets);

  return prisma.appSetting.upsert({
    where: {
      key: REPORT_NOTE_PRESETS_KEY,
    },
    create: {
      key: REPORT_NOTE_PRESETS_KEY,
      value: {
        presets: normalizedPresets,
      },
    },
    update: {
      value: {
        presets: normalizedPresets,
      },
    },
  });
}
