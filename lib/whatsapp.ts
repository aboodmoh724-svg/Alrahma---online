import { appUrl } from "@/lib/app-url";

export type WhatsAppChannel = "REMOTE" | "ONSITE";

type WhatsAppTextInput = {
  to: string;
  body: string;
  channel?: WhatsAppChannel;
};

type WhatsAppDocumentInput = {
  to: string;
  documentUrl: string;
  fileName: string;
  caption?: string;
  channel?: WhatsAppChannel;
};

type WhatsAppTemplateInput = {
  to: string;
  templateName: string;
  languageCode: string;
  bodyVariables: string[];
};

const DEFAULT_WEBJS_API_URL = "http://185.182.8.94/send-message";

function resolveWebJsApiUrl(channel?: WhatsAppChannel) {
  if (channel === "ONSITE") {
    return (
      process.env.WHATSAPP_WEBJS_API_URL_ONSITE ||
      process.env.WHATSAPP_WEBJS_API_URL ||
      DEFAULT_WEBJS_API_URL
    );
  }

  if (channel === "REMOTE") {
    return (
      process.env.WHATSAPP_WEBJS_API_URL_REMOTE ||
      process.env.WHATSAPP_WEBJS_API_URL ||
      DEFAULT_WEBJS_API_URL
    );
  }

  return (
    process.env.WHATSAPP_WEBJS_API_URL_REMOTE ||
    process.env.WHATSAPP_WEBJS_API_URL ||
    process.env.WHATSAPP_WEBJS_API_URL_ONSITE ||
    DEFAULT_WEBJS_API_URL
  );
}

function resolveWebJsApiToken(channel?: WhatsAppChannel) {
  if (channel === "ONSITE") {
    return (
      process.env.WHATSAPP_WEBJS_API_TOKEN_ONSITE ||
      process.env.WHATSAPP_WEBJS_API_TOKEN ||
      ""
    );
  }

  if (channel === "REMOTE") {
    return (
      process.env.WHATSAPP_WEBJS_API_TOKEN_REMOTE ||
      process.env.WHATSAPP_WEBJS_API_TOKEN ||
      ""
    );
  }

  return (
    process.env.WHATSAPP_WEBJS_API_TOKEN_REMOTE ||
    process.env.WHATSAPP_WEBJS_API_TOKEN ||
    process.env.WHATSAPP_WEBJS_API_TOKEN_ONSITE ||
    ""
  );
}

function extractWhatsAppErrorMessage(raw: string) {
  const text = String(raw || "").trim();

  if (!text) {
    return "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© ÙˆØ§ØªØ³Ø§Ø¨ Ø¹Ø¨Ø± Ø§Ù„Ø®Ø§Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ.";
  }

  if (/<!doctype html>|<html/i.test(text)) {
    return "Ø®Ø§Ø¯Ù… ÙˆØ§ØªØ³Ø§Ø¨ Ø£Ø¹Ø§Ø¯ ØµÙØ­Ø© ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹Ø©. ØªØ£ÙƒØ¯ Ù…Ù† Ø±Ø§Ø¨Ø· Ø®Ø§Ø¯Ù… ÙˆØ§ØªØ³Ø§Ø¨ ÙÙŠ Vercel Ø£Ùˆ Ù…Ù† Ø£Ù† Ø§Ù„Ø®Ø¯Ù…Ø© ØªØ¹Ù…Ù„ Ø¨Ø´ÙƒÙ„ ØµØ­ÙŠØ­.";
  }

  try {
    const parsed = JSON.parse(text) as {
      error?: string | { message?: string };
      message?: string;
    };

    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }

    if (parsed.error && typeof parsed.error === "object" && parsed.error.message?.trim()) {
      return parsed.error.message.trim();
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Fall back to the plain text below.
  }

  return text.length > 280 ? `${text.slice(0, 280)}...` : text;
}

export function isWhatsAppWebJsConfigured(channel?: WhatsAppChannel) {
  return Boolean(resolveWebJsApiUrl(channel));
}

export function isWhatsAppConfigured(channel?: WhatsAppChannel) {
  return Boolean(
    isWhatsAppWebJsConfigured(channel) ||
      (process.env.WHATSAPP_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        process.env.WHATSAPP_BUSINESS_ACCOUNT_ID)
  );
}

export function isWhatsAppTemplateConfigured() {
  return Boolean(
    isWhatsAppConfigured() &&
      process.env.WHATSAPP_ABSENCE_TEMPLATE_NAME &&
      process.env.WHATSAPP_ABSENCE_TEMPLATE_LANG
  );
}

export function attendanceTemplateConfig(status: "PRESENT" | "ABSENT") {
  const prefix =
    status === "ABSENT" ? "WHATSAPP_ABSENCE_TEMPLATE" : "WHATSAPP_PRESENT_TEMPLATE";
  const templateName = String(process.env[`${prefix}_NAME`] || "").trim();
  const languageCode = String(process.env[`${prefix}_LANG`] || "").trim();

  if (!templateName || !languageCode) {
    return null;
  }

  return { templateName, languageCode };
}

export function normalizeWhatsAppNumber(raw: string) {
  const digits = String(raw || "")
    .trim()
    .replace(/[^\d+]/g, "");

  if (!digits) {
    return null;
  }

  const normalized = digits.startsWith("+") ? digits.slice(1) : digits;
  const justDigits = normalized.replace(/\D/g, "");

  if (justDigits.length < 8) {
    return null;
  }

  return justDigits;
}

export function absenceTemplateConfig() {
  const templateName = String(process.env.WHATSAPP_ABSENCE_TEMPLATE_NAME || "").trim();
  const languageCode = String(process.env.WHATSAPP_ABSENCE_TEMPLATE_LANG || "").trim();

  if (!templateName || !languageCode) {
    return null;
  }

  return { templateName, languageCode };
}

export function dailyAttendanceWhatsAppMessage(input: {
  studentName: string;
  reportDate: string;
  status: "PRESENT" | "ABSENT";
  lessonName: string;
  nextHomework?: string | null;
  note?: string | null;
}) {
  const statusLabel = input.status === "ABSENT" ? "ØºØ§Ø¦Ø¨" : "Ø­Ø§Ø¶Ø±";
  const homework = input.nextHomework?.trim() ? input.nextHomework.trim() : "ØºÙŠØ± Ù…Ø­Ø¯Ø¯";
  const note = input.note?.trim() ? input.note.trim() : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù„Ø§Ø­Ø¸Ø§Øª";

  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø·Ø§Ù„Ø¨: ${input.studentName}\n` +
    `Ø§Ù„ØªØ§Ø±ÙŠØ®: ${input.reportDate}\n` +
    `Ø§Ù„Ø­Ø§Ù„Ø©: ${statusLabel}\n` +
    `Ø§Ù„Ø¯Ø±Ø³: ${input.lessonName}\n` +
    `ÙˆØ§Ø¬Ø¨ Ø§Ù„ØºØ¯: ${homework}\n` +
    `Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª: ${note}\n\n` +
    `Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

export function registrationReceivedWhatsAppMessage(input: { studentName: string }) {
  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `Ù†Ø´ÙƒØ±ÙƒÙ… Ø¹Ù„Ù‰ Ø§Ù„ØªØ³Ø¬ÙŠÙ„ ÙÙŠ Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ….\n\n` +
    `Ø§Ø³Ù… Ø§Ù„Ø·Ø§Ù„Ø¨: ${input.studentName}\n` +
    `ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨ Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­ØŒ ÙˆØ³ÙŠØªÙ… Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ÙƒÙ… Ù‚Ø±ÙŠØ¨Ù‹Ø§ Ø¨Ø¹Ø¯ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨ Ø¨Ø¥Ø°Ù† Ø§Ù„Ù„Ù‡.\n\n` +
    `Ù†Ø³Ø£Ù„ Ø§Ù„Ù„Ù‡ Ø§Ù„ØªÙˆÙÙŠÙ‚ Ù„Ø§Ø¨Ù†ÙƒÙ…ØŒ ÙˆØ£Ù† ÙŠØ¨Ø§Ø±Ùƒ ÙÙŠ Ø±Ø­Ù„ØªÙ‡ Ù…Ø¹ ÙƒØªØ§Ø¨ Ø§Ù„Ù„Ù‡.\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

export function onsiteAbsenceWhatsAppMessage(input: {
  studentName: string;
  reportDate: string;
}) {
  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `Ù†ÙÙŠØ¯ÙƒÙ… Ø£Ù† Ø§Ø¨Ù†ÙƒÙ… Ø§Ù„ÙƒØ±ÙŠÙ… / ${input.studentName}\n` +
    `ØºØ§Ø¦Ø¨ Ø¹Ù† Ø§Ù„ØªØ­ÙÙŠØ¸ Ø§Ù„ÙŠÙˆÙ… Ø¨ØªØ§Ø±ÙŠØ® ${input.reportDate} Ø¨Ø¯ÙˆÙ† Ø¹Ø°Ø±.\n\n` +
    `Ù†Ø±Ø¬Ùˆ Ù…Ù†ÙƒÙ… Ø§Ù„Ø§Ù‡ØªÙ…Ø§Ù… Ø¨Ø­Ø¶ÙˆØ± Ø§Ø¨Ù†ÙƒÙ… Ø¥Ù„Ù‰ Ø§Ù„ØªØ­ÙÙŠØ¸ Ù„Ø£Ù† Ù‡Ø°Ø§ ÙŠØ¤Ø«Ø± Ø¹Ù„Ù‰ Ù…Ø³ØªÙˆØ§Ù‡ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠ.\n\n` +
    `Ù†Ø´ÙƒØ± Ù„ÙƒÙ… Ø­Ø³Ù† ØªØ¹Ø§ÙˆÙ†ÙƒÙ….\n\n` +
    `Ù‡Ø°Ù‡ Ø±Ø³Ø§Ù„Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ© ØªØ±Ø³Ù„ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„ØºØ§Ø¦Ø¨ÙŠÙ†.\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

export function remoteDailyReportWhatsAppMessage(input: {
  studentName: string;
  teacherName: string;
  reportDate: string;
  lessonName: string;
  review?: string | null;
  homework?: string | null;
  note?: string | null;
}) {
  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø·Ø§Ù„Ø¨: ${input.studentName}\n\n` +
    `Ø§Ù„Ù…Ø¹Ù„Ù…: ${input.teacherName || "-"}\n` +
    `Ø§Ù„ØªØ§Ø±ÙŠØ®: ${input.reportDate || "-"}\n` +
    `Ø§Ù„Ø¯Ø±Ø³: ${input.lessonName || "-"}\n` +
    `Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©: ${input.review?.trim() || "-"}\n` +
    `Ø§Ù„ÙˆØ§Ø¬Ø¨: ${input.homework?.trim() || "-"}\n` +
    `Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª: ${input.note?.trim() || "-"}\n\n` +
    `Ø¬Ø²Ø§ÙƒÙ… Ø§Ù„Ù„Ù‡ Ø®ÙŠØ±Ù‹Ø§ØŒ ÙˆØ¨Ø§Ø±Ùƒ Ø§Ù„Ù„Ù‡ ÙÙŠ Ù…ØªØ§Ø¨Ø¹ØªÙƒÙ….\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

function memorizationStatusLabel(value: boolean | null | undefined) {
  if (value === true) {
    return "*حافظ*";
  }

  if (value === false) {
    return "*غير حافظ*";
  }

  return "غير مسجل";
}

export function remoteReportMemorizationSummary(input: {
  lessonMemorized?: boolean | null;
  lastFiveMemorized?: boolean | null;
  reviewMemorized?: boolean | null;
}) {
  return (
    `*نتيجة التقييم:*\n` +
    `- *الدرس الجديد:* ${memorizationStatusLabel(input.lessonMemorized)}\n` +
    `- *آخر خمس صفحات:* ${memorizationStatusLabel(input.lastFiveMemorized)}\n` +
    `- *المراجعة:* ${memorizationStatusLabel(input.reviewMemorized)}`
  );
}

export function registrationAcceptedWhatsAppMessage(input: {
  studentName: string;
  circleName?: string | null;
  teacherName?: string | null;
  zoomUrl?: string | null;
  scheduleDetails?: string | null;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نحيطكم علمًا بأنه تم قبول الطالب *${input.studentName}* في منصة الرحمة.\n\n` +
    `*الحلقة:* ${input.circleName?.trim() || "-"}\n` +
    `*المعلم:* ${input.teacherName?.trim() || "-"}\n` +
    `*تفاصيل الموعد:* ${input.scheduleDetails?.trim() || "-"}\n` +
    `*رابط الحلقة:* ${input.zoomUrl?.trim() || "-"}\n\n` +
    `نسأل الله له التوفيق والبركة في رحلته مع كتاب الله.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function fullPaymentReceivedWhatsAppMessage(input: {
  studentName: string;
  amount: string;
  currency: string;
  circleName?: string | null;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `تم استلام الرسوم كاملة للطالب *${input.studentName}* بنجاح.\n\n` +
    `*المبلغ المسدد:* ${input.amount} ${input.currency}\n` +
    `*الحلقة:* ${input.circleName?.trim() || "-"}\n\n` +
    `جزاكم الله خيرًا وبارك الله فيكم.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function repeatedAbsenceWhatsAppMessage(input: {
  studentName: string;
  teacherName?: string | null;
  circleName?: string | null;
  absenceCount: number;
}) {
  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `Ù†ÙˆØ¯ Ø¥Ø´Ø¹Ø§Ø±ÙƒÙ… Ø¨Ø£Ù† ØºÙŠØ§Ø¨ Ø§Ù„Ø·Ø§Ù„Ø¨ ${input.studentName} Ù‚Ø¯ ØªÙƒØ±Ø± Ø£ÙƒØ«Ø± Ù…Ù† Ù…Ø±Ø©.\n` +
    `Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ù„ØºÙŠØ§Ø¨ Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: ${input.absenceCount}\n` +
    `Ø§Ù„Ù…Ø¹Ù„Ù…: ${input.teacherName?.trim() || "-"}\n` +
    `Ø§Ù„Ø­Ù„Ù‚Ø©: ${input.circleName?.trim() || "-"}\n\n` +
    `Ù†Ø±Ø¬Ùˆ Ù…Ù†ÙƒÙ… Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø§Ø¨Ù† Ø§Ù„ÙƒØ±ÙŠÙ… ÙˆØ§Ù„Ø­Ø±Øµ Ø¹Ù„Ù‰ Ø§Ù†ØªØ¸Ø§Ù…Ù‡ Ø­ØªÙ‰ Ù„Ø§ ÙŠØªØ£Ø«Ø± Ù…Ø³ØªÙˆØ§Ù‡ ÙÙŠ Ø§Ù„Ø­ÙØ¸ ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø©.\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

export function repeatedStruggleWhatsAppMessage(input: {
  studentName: string;
  teacherName?: string | null;
  circleName?: string | null;
  struggleCount: number;
}) {
  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `Ù†ÙˆØ¯ Ø¥Ø´Ø¹Ø§Ø±ÙƒÙ… Ø¨Ø£Ù† Ø§Ù„Ø·Ø§Ù„Ø¨ ${input.studentName} Ø¨Ø­Ø§Ø¬Ø© Ø¥Ù„Ù‰ Ù…ØªØ§Ø¨Ø¹Ø© Ø¥Ø¶Ø§ÙÙŠØ©ØŒ Ø­ÙŠØ« ØªÙƒØ±Ø± Ø§Ù„ØªØ¹Ø«Ø± Ù„Ø¯ÙŠÙ‡ Ø£ÙƒØ«Ø± Ù…Ù† Ù…Ø±Ø©.\n` +
    `Ø¹Ø¯Ø¯ Ù…Ø±Ø§Øª Ø§Ù„ØªØ¹Ø«Ø± Ø§Ù„Ù…Ø³Ø¬Ù„Ø©: ${input.struggleCount}\n` +
    `Ø§Ù„Ù…Ø¹Ù„Ù…: ${input.teacherName?.trim() || "-"}\n` +
    `Ø§Ù„Ø­Ù„Ù‚Ø©: ${input.circleName?.trim() || "-"}\n\n` +
    `Ù†Ø±Ø¬Ùˆ Ù…Ù†ÙƒÙ… Ø¯Ø¹Ù… Ø§Ù„Ø§Ø¨Ù† Ø§Ù„ÙƒØ±ÙŠÙ… ÙÙŠ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ© ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø³ØªÙ…Ø±Ø© Ø­ØªÙ‰ ÙŠØªØ­Ø³Ù† Ù…Ø³ØªÙˆØ§Ù‡ Ø¨Ø¥Ø°Ù† Ø§Ù„Ù„Ù‡.\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

export function customParentWhatsAppMessage(input: {
  message: string;
}) {
  const body = input.message.trim();
  if (!body) {
    return "";
  }

  return `${body}\n\nØ¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`;
}

export function teacherWelcomeWhatsAppMessage(input: {
  teacherName: string;
  email: string;
  password: string;
  studyMode: "REMOTE" | "ONSITE";
}) {
  const platformLabel = input.studyMode === "REMOTE" ? "Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø¹Ù† Ø¨Ø¹Ø¯" : "Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø­Ø¶ÙˆØ±ÙŠ";
  const loginPath =
    input.studyMode === "REMOTE"
      ? appUrl("/remote/teacher/login")
      : appUrl("/onsite/teacher/login");

  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `Ù…Ø±Ø­Ø¨Ù‹Ø§ Ø¨Ø§Ù„Ø£Ø³ØªØ§Ø° ${input.teacherName}\n` +
    `ÙŠØ³Ø±Ù†Ø§ Ø§Ù†Ø¶Ù…Ø§Ù…ÙƒÙ… Ø¥Ù„Ù‰ Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ….\n\n` +
    `Ù†ÙˆØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨: ${platformLabel}\n` +
    `Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…: ${input.email}\n` +
    `ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±: ${input.password}\n\n` +
    `Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„:\n${loginPath}\n\n` +
    `Ù†Ø³Ø£Ù„ Ø§Ù„Ù„Ù‡ Ù„ÙƒÙ… Ø§Ù„ØªÙˆÙÙŠÙ‚ ÙˆØ§Ù„Ø³Ø¯Ø§Ø¯ØŒ ÙˆØ£Ù† ÙŠØ¬Ø¹Ù„ Ø¹Ù…Ù„ÙƒÙ… ÙÙŠ Ù…ÙŠØ²Ø§Ù† Ø­Ø³Ù†Ø§ØªÙƒÙ….\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

export function teacherVisitReportWhatsAppMessage(input: {
  teacherName: string;
  supervisorName: string;
  visitNumber: number;
  visitType: string;
  visitDate: string;
}) {
  return (
    `Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ… ÙˆØ±Ø­Ù…Ø© Ø§Ù„Ù„Ù‡ ÙˆØ¨Ø±ÙƒØ§ØªÙ‡\n\n` +
    `Ø§Ù„Ø£Ø³ØªØ§Ø° ${input.teacherName}\n` +
    `ØªÙ… Ø±ÙØ¹ ØªÙ‚Ø±ÙŠØ± Ø²ÙŠØ§Ø±Ø© Ø¬Ø¯ÙŠØ¯ Ù„ÙƒÙ… Ù…Ù† Ø§Ù„Ù…Ø´Ø±Ù ${input.supervisorName}.\n\n` +
    `Ø±Ù‚Ù… Ø§Ù„Ø²ÙŠØ§Ø±Ø©: ${input.visitNumber}\n` +
    `Ù†ÙˆØ¹ Ø§Ù„Ø²ÙŠØ§Ø±Ø©: ${input.visitType}\n` +
    `Ø§Ù„ØªØ§Ø±ÙŠØ®: ${input.visitDate}\n\n` +
    `Ù…Ø¹ ØªÙ…Ù†ÙŠØ§ØªÙ†Ø§ Ù„ÙƒÙ… Ø¨Ø§Ù„ØªÙˆÙÙŠÙ‚ ÙˆØ§Ù„Ø³Ø¯Ø§Ø¯.\n\n` +
    `Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…`
  );
}

async function sendWhatsAppWebJsText({ to, body, channel }: WhatsAppTextInput) {
  const apiUrl = resolveWebJsApiUrl(channel);
  const apiToken = resolveWebJsApiToken(channel);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    body: JSON.stringify({
      phone: to,
      message: body,
      channel,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(extractWhatsAppErrorMessage(message));
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html") || /<!doctype html>|<html/i.test(text)) {
    throw new Error(extractWhatsAppErrorMessage(text));
  }

  try {
    return text ? JSON.parse(text) : { success: true };
  } catch {
    throw new Error(extractWhatsAppErrorMessage(text));
  }
}

async function sendWhatsAppWebJsDocument({
  to,
  documentUrl,
  fileName,
  caption,
  channel,
}: WhatsAppDocumentInput) {
  const apiUrl = resolveWebJsApiUrl(channel);
  const apiToken = resolveWebJsApiToken(channel);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    body: JSON.stringify({
      phone: to,
      documentUrl,
      fileName,
      caption,
      channel,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(extractWhatsAppErrorMessage(message));
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html") || /<!doctype html>|<html/i.test(text)) {
    throw new Error(extractWhatsAppErrorMessage(text));
  }

  try {
    return text ? JSON.parse(text) : { success: true };
  } catch {
    throw new Error(extractWhatsAppErrorMessage(text));
  }
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode,
  bodyVariables,
}: WhatsAppTemplateInput) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp env vars missing. Template skipped:", templateName);
    return { skipped: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: [
            {
              type: "body",
              parameters: bodyVariables.map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    let parsedMessage = message;

    try {
      const parsed = JSON.parse(message) as { error?: { message?: string } };
      parsedMessage = parsed.error?.message || message;
    } catch {
      parsedMessage = message;
    }

    throw new Error(parsedMessage);
  }

  return response.json();
}

export async function sendWhatsAppText({ to, body, channel }: WhatsAppTextInput) {
  if (isWhatsAppWebJsConfigured(channel)) {
    return sendWhatsAppWebJsText({ to, body, channel });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp env vars missing. Message skipped:", body);
    return { skipped: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body,
        },
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    let parsedMessage = message;

    try {
      const parsed = JSON.parse(message) as { error?: { message?: string } };
      parsedMessage = parsed.error?.message || message;
    } catch {
      parsedMessage = message;
    }

    throw new Error(parsedMessage);
  }

  return response.json();
}

export async function sendWhatsAppDocument({
  to,
  documentUrl,
  fileName,
  caption,
  channel,
}: WhatsAppDocumentInput) {
  if (isWhatsAppWebJsConfigured(channel)) {
    return sendWhatsAppWebJsDocument({
      to,
      documentUrl,
      fileName,
      caption,
      channel,
    });
  }

  return sendWhatsAppText({
    to,
    body: `${caption?.trim() || "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ØªÙ‚Ø±ÙŠØ± Ø¬Ø¯ÙŠØ¯ Ù„ÙƒÙ…."}\n\n${documentUrl}`,
    channel,
  });
}
