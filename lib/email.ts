type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

const defaultFrom = "منصة الرحمة <onboarding@resend.dev>";
const defaultSenderName = "منصة الرحمة";

function parseSender(sender: string) {
  const match = sender.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, "") || defaultSenderName,
      email: match[2].trim(),
    };
  }

  return {
    name: defaultSenderName,
    email: sender.trim(),
  };
}

async function parseEmailError(response: Response) {
  const message = await response.text();

  try {
    const parsed = JSON.parse(message) as {
      message?: string;
      code?: string;
      error?: string;
    };

    return parsed.message || parsed.error || message;
  } catch {
    return message;
  }
}

export function isEmailConfigured() {
  return Boolean(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey) {
    const sender = parseSender(process.env.EMAIL_FROM || defaultFrom);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
    });

    if (!response.ok) {
      throw new Error(await parseEmailError(response));
    }

    return response.json();
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn("No email provider API key is set. Email skipped:", subject);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || defaultFrom,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseEmailError(response));
  }

  return response.json();
}

export function registrationReceivedEmail(studentName: string) {
  return {
    subject: "تم استلام طلب التسجيل في منصة الرحمة",
    text: `السلام عليكم ورحمة الله وبركاته

تم استلام طلب تسجيل الطالب: ${studentName}

ستراجع الإدارة البيانات المرسلة، وسيتم التواصل معكم في أقرب وقت بإذن الله.

مع تحيات
منصة الرحمة لتعليم القرآن الكريم`,
  };
}

export function dailyReportEmail(input: {
  studentName: string;
  reportDate: string;
  lessonName: string;
  status: "PRESENT" | "ABSENT";
  pageFrom: number | null;
  pageTo: number | null;
  pagesCount: number | null;
  nextHomework: string | null;
  note: string | null;
}) {
  const pages =
    input.pageFrom && input.pageTo
      ? `من صفحة ${input.pageFrom} إلى صفحة ${input.pageTo}`
      : "غير محدد";

  return {
    subject: `التقرير اليومي للطالب ${input.studentName}`,
    text: `السلام عليكم ورحمة الله وبركاته

تقرير الطالب: ${input.studentName}
التاريخ: ${input.reportDate}
الحالة: ${input.status === "ABSENT" ? "غائب" : "حاضر"}
الدرس: ${input.lessonName}
الصفحات: ${pages}${input.pagesCount ? ` - عدد الصفحات: ${input.pagesCount}` : ""}
واجب الغد: ${input.nextHomework || "غير محدد"}
الملاحظات: ${input.note || "لا توجد ملاحظات"}

نسأل الله أن يبارك في الطالب ويجعله من أهل القرآن.

منصة الرحمة لتعليم القرآن الكريم`,
  };
}
