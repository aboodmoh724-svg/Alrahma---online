export type WhatsAppChannel = "REMOTE" | "ONSITE";

type WhatsAppTextInput = {
  to: string;
  body: string;
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
    return "تعذر إرسال رسالة واتساب عبر الخادم الحالي.";
  }

  if (/<!doctype html>|<html/i.test(text)) {
    return "خادم واتساب أعاد صفحة غير متوقعة. تأكد من رابط خادم واتساب في Vercel أو من أن الخدمة تعمل بشكل صحيح.";
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
  const statusLabel = input.status === "ABSENT" ? "غائب" : "حاضر";
  const homework = input.nextHomework?.trim() ? input.nextHomework.trim() : "غير محدد";
  const note = input.note?.trim() ? input.note.trim() : "لا توجد ملاحظات";

  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `تقرير الطالب: ${input.studentName}\n` +
    `التاريخ: ${input.reportDate}\n` +
    `الحالة: ${statusLabel}\n` +
    `الدرس: ${input.lessonName}\n` +
    `واجب الغد: ${homework}\n` +
    `الملاحظات: ${note}\n\n` +
    `منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function registrationReceivedWhatsAppMessage(input: { studentName: string }) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نشكركم على التسجيل في منصة الرحمة لتعليم القرآن الكريم.\n\n` +
    `اسم الطالب: ${input.studentName}\n` +
    `تم استلام طلب التسجيل بنجاح، وسيتم التواصل معكم قريبًا بعد مراجعة الطلب بإذن الله.\n\n` +
    `نسأل الله التوفيق لابنكم، وأن يبارك في رحلته مع كتاب الله.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function onsiteAbsenceWhatsAppMessage(input: {
  studentName: string;
  reportDate: string;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نفيدكم أن ابنكم الكريم / ${input.studentName}\n` +
    `غائب عن التحفيظ اليوم بتاريخ ${input.reportDate} بدون عذر.\n\n` +
    `نرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.\n\n` +
    `نشكر لكم حسن تعاونكم.\n\n` +
    `هذه رسالة تلقائية ترسل للطلاب الغائبين.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
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
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `تقرير الطالب: ${input.studentName}\n\n` +
    `المعلم: ${input.teacherName || "-"}\n` +
    `التاريخ: ${input.reportDate || "-"}\n` +
    `الدرس: ${input.lessonName || "-"}\n` +
    `المراجعة: ${input.review?.trim() || "-"}\n` +
    `الواجب: ${input.homework?.trim() || "-"}\n` +
    `الملاحظات: ${input.note?.trim() || "-"}\n\n` +
    `جزاكم الله خيرًا، وبارك الله في متابعتكم.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
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
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نود إشعاركم بأن غياب الطالب ${input.studentName} قد تكرر أكثر من مرة.\n` +
    `عدد مرات الغياب المسجلة: ${input.absenceCount}\n` +
    `المعلم: ${input.teacherName?.trim() || "-"}\n` +
    `الحلقة: ${input.circleName?.trim() || "-"}\n\n` +
    `نرجو منكم متابعة الابن الكريم والحرص على انتظامه حتى لا يتأثر مستواه في الحفظ والمتابعة.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function repeatedStruggleWhatsAppMessage(input: {
  studentName: string;
  teacherName?: string | null;
  circleName?: string | null;
  struggleCount: number;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نود إشعاركم بأن الطالب ${input.studentName} بحاجة إلى متابعة إضافية، حيث تكرر التعثر لديه أكثر من مرة.\n` +
    `عدد مرات التعثر المسجلة: ${input.struggleCount}\n` +
    `المعلم: ${input.teacherName?.trim() || "-"}\n` +
    `الحلقة: ${input.circleName?.trim() || "-"}\n\n` +
    `نرجو منكم دعم الابن الكريم في المراجعة اليومية والمتابعة المستمرة حتى يتحسن مستواه بإذن الله.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function customParentWhatsAppMessage(input: {
  message: string;
}) {
  const body = input.message.trim();
  if (!body) {
    return "";
  }

  return `${body}\n\nإدارة منصة الرحمة لتعليم القرآن الكريم`;
}

export function teacherWelcomeWhatsAppMessage(input: {
  teacherName: string;
  email: string;
  password: string;
  studyMode: "REMOTE" | "ONSITE";
}) {
  const platformLabel = input.studyMode === "REMOTE" ? "التعليم عن بعد" : "التعليم الحضوري";
  const loginPath =
    input.studyMode === "REMOTE"
      ? "https://alrahma-reports.vercel.app/remote/teacher/login"
      : "https://alrahma-reports.vercel.app/onsite/teacher/login";

  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `مرحبًا بالأستاذ ${input.teacherName}\n` +
    `يسرنا انضمامكم إلى منصة الرحمة لتعليم القرآن الكريم.\n\n` +
    `نوع الحساب: ${platformLabel}\n` +
    `اسم المستخدم: ${input.email}\n` +
    `كلمة المرور: ${input.password}\n\n` +
    `رابط الدخول:\n${loginPath}\n\n` +
    `نسأل الله لكم التوفيق والسداد، وأن يجعل عملكم في ميزان حسناتكم.\n\n` +
    `إدارة منصة الرحمة لتعليم القرآن الكريم`
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
