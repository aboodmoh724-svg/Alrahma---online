type SendAttendanceWebhookInput = {
  reportId: string;
  studentName: string;
  parentWhatsapp: string;
  status: "PRESENT" | "ABSENT";
  reportDate: string;
  lessonName: string;
  nextHomework: string;
  note: string;
  messageBody: string;
};

export function isMakeAttendanceWebhookConfigured() {
  return Boolean(process.env.MAKE_ATTENDANCE_WEBHOOK_URL);
}

async function parseWebhookError(response: Response) {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as { error?: string; message?: string };
    return parsed.error || parsed.message || text;
  } catch {
    return text;
  }
}

export async function sendAttendanceToMake(input: SendAttendanceWebhookInput) {
  const webhookUrl = process.env.MAKE_ATTENDANCE_WEBHOOK_URL;

  if (!webhookUrl) {
    return { skipped: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MAKE_ATTENDANCE_WEBHOOK_SECRET
          ? { "X-Alrahma-Secret": process.env.MAKE_ATTENDANCE_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        source: "alrahma-reports",
        event: "onsite_attendance",
        parentWhatsappDigits: input.parentWhatsapp,
        parentWhatsappInternational: `+${input.parentWhatsapp}`,
        ...input,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await parseWebhookError(response));
    }

    return { sent: true };
  } finally {
    clearTimeout(timeout);
  }
}
