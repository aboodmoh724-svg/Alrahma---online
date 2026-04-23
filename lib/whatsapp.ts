type WhatsAppTextInput = {
  to: string;
  body: string;
};

type WhatsAppTemplateInput = {
  to: string;
  templateName: string;
  languageCode: string;
  bodyVariables: string[];
};

export function isWhatsAppWebJsConfigured() {
  return Boolean(process.env.WHATSAPP_WEBJS_API_URL);
}

export function isWhatsAppConfigured() {
  return Boolean(
    isWhatsAppWebJsConfigured() ||
    process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
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
    `تم استلام طلب تسجيل الطالب: ${input.studentName}\n` +
    `وسيتم مراجعة الطلب والرد عليكم في أقرب وقت بإذن الله.\n\n` +
    `منصة الرحمة لتعليم القرآن الكريم`
  );
}

export function onsiteAbsenceWhatsAppMessage(input: { studentName: string; reportDate: string }) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نفيدكم أن ابنكم الكريم / ${input.studentName}\n` +
    `غائب عن التحفيظ اليوم بتاريخ ${input.reportDate} بدون عذر.\n\n` +
    `نرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.\n\n` +
    `نشكركم لحسن تعاونكم.\n\n` +
    `هذه رسالة تلقائية ترسل للطلاب الغائبين.\n\n` +
    `إدارة تحفيظ الرحمن للقرآن الكريم`
  );
}

async function sendWhatsAppWebJsText({ to, body }: WhatsAppTextInput) {
  const apiUrl = process.env.WHATSAPP_WEBJS_API_URL;

  if (!apiUrl) {
    return { skipped: true };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.WHATSAPP_WEBJS_API_TOKEN
        ? { Authorization: `Bearer ${process.env.WHATSAPP_WEBJS_API_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      to,
      number: to,
      phone: to,
      message: body,
      body,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "تعذر إرسال رسالة واتساب عبر whatsapp-web.js");
  }

  const text = await response.text();

  try {
    return text ? JSON.parse(text) : { success: true };
  } catch {
    return { success: true, response: text };
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

export async function sendWhatsAppText({ to, body }: WhatsAppTextInput) {
  if (isWhatsAppWebJsConfigured()) {
    return sendWhatsAppWebJsText({ to, body });
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

