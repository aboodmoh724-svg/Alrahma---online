type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

const defaultFrom = "منصة الرحمة <onboarding@resend.dev>";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set. Email skipped:", subject);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    const message = await response.text();
    throw new Error(`Email send failed: ${message}`);
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
