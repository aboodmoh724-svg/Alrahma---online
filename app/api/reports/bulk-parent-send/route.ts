import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { renderMessageTemplate } from "@/lib/message-templates";
import { prisma } from "@/lib/prisma";
import {
  normalizeWhatsAppNumber,
  sendWhatsAppText,
  type WhatsAppChannel,
} from "@/lib/whatsapp";

const REPORT_FIELD_PREFIX =
  /^(الدرس\s*الجديد|الدرس|المراجعة|الواجب|واجب\s*الغد)\s*[:：-]\s*/i;
const REPORT_FIELD_REPEAT_PREFIX = /^(الدرس\s*الجديد|المراجعة)\s*[:：-]\s*/i;
const HAFIZ = "حافظ";
const NOT_HAFIZ = "غير حافظ";
const EVALUATION_TITLE = "نتيجة التقييم:";
const SIGNATURE_PREFIX = "إدارة منصة الرحمة";

function cleanReportField(value: string | null | undefined) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text === "-") return "-";

  return (
    text.replace(REPORT_FIELD_PREFIX, "").replace(REPORT_FIELD_REPEAT_PREFIX, "").trim() ||
    "-"
  );
}

function statusLabel(value: boolean | null | undefined) {
  if (value === true) return HAFIZ;
  if (value === false) return NOT_HAFIZ;
  return "";
}

function reportEvaluationSummary(input: {
  lessonMemorized?: boolean | null;
  lastFiveMemorized?: boolean | null;
  reviewMemorized?: boolean | null;
}) {
  const lines = [
    ["الدرس الجديد", statusLabel(input.lessonMemorized)],
    ["آخر خمس صفحات", statusLabel(input.lastFiveMemorized)],
    ["المراجعة", statusLabel(input.reviewMemorized)],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `- ${label}: ${value}`);

  return lines.length ? `${EVALUATION_TITLE}\n${lines.join("\n")}` : "";
}

function insertEvaluationBeforeSignature(message: string, evaluationSummary: string) {
  if (!evaluationSummary.trim()) return message.trim();
  if (message.includes(evaluationSummary)) return message.trim();

  const signatureIndex = message.indexOf(SIGNATURE_PREFIX);
  if (signatureIndex >= 0) {
    const before = message.slice(0, signatureIndex).trimEnd();
    const after = message.slice(signatureIndex).trimStart();
    return `${before}\n\n${evaluationSummary}\n\n${after}`.trim();
  }

  return `${message.trim()}\n\n${evaluationSummary}`.trim();
}

function absenceReportMessage(input: {
  studentName: string;
  reportDate: string;
  circleName?: string | null;
  teacherName?: string | null;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `ابنكم الكريم *${input.studentName}* لم يحضر إلى حلقة التحفيظ بتاريخ ${input.reportDate}.\n\n` +
    `*الحلقة:* ${input.circleName || "-"}\n` +
    `*المعلم:* ${input.teacherName || "-"}\n\n` +
    `نرجو المتابعة والحرص على انتظامه في الحضور؛ لأن الغياب يؤثر على مستوى الحفظ والمراجعة.\n\n` +
    `إدارة تحفيظ الرحمة - قسم سوريا`
  );
}

function syriaDailyReportMessage(input: {
  studentName: string;
  teacherName?: string | null;
  circleName?: string | null;
  reportDate: string;
  lessonName: string;
  review: string;
  homework: string;
  note: string;
  evaluationSummary: string;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `تقرير الطالب اليومي - قسم سوريا\n\n` +
    `*الطالب:* ${input.studentName}\n` +
    `*الحلقة:* ${input.circleName || "-"}\n` +
    `*المعلم:* ${input.teacherName || "-"}\n` +
    `*التاريخ:* ${input.reportDate}\n\n` +
    `*ما حفظه الطالب:* ${input.lessonName}\n` +
    `*المراجعة:* ${input.review}\n` +
    `*واجب الغد:* ${input.homework}\n\n` +
    `${input.evaluationSummary || "نتيجة التقييم: -"}\n\n` +
    `*الملاحظات:* ${input.note || "-"}\n\n` +
    `جزاكم الله خيرًا على المتابعة والحرص.\n\n` +
    `إدارة تحفيظ الرحمة - قسم سوريا`
  );
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    if (!teacherId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { reportIds?: unknown };
    const reportIds = Array.isArray(body.reportIds)
      ? body.reportIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];

    if (reportIds.length === 0) {
      return NextResponse.json(
        { error: "لا توجد تقارير جاهزة للإرسال" },
        { status: 400 }
      );
    }

    const reports = await prisma.report.findMany({
      where: {
        id: {
          in: reportIds,
        },
        teacherId,
      },
      select: {
        id: true,
        sentToParent: true,
        createdAt: true,
        lessonName: true,
        status: true,
        review: true,
        nextHomework: true,
        note: true,
        lessonMemorized: true,
        lastFiveMemorized: true,
        reviewMemorized: true,
        teacher: {
          select: {
            fullName: true,
          },
        },
        student: {
          select: {
            fullName: true,
            parentWhatsapp: true,
            studyMode: true,
            circle: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const missingPhone: string[] = [];
    const alreadySent: string[] = [];
    const failed: { studentName: string; error: string }[] = [];
    let sentCount = 0;

    for (const report of reports) {
      if (report.sentToParent) {
        alreadySent.push(report.student.fullName);
        continue;
      }

      const reportChannel = report.student.studyMode as WhatsAppChannel;
      const defaultCountryCode = reportChannel === "ONSITE_SYRIA" ? "963" : "90";
      const phone = report.student.parentWhatsapp
        ? normalizeWhatsAppNumber(report.student.parentWhatsapp, defaultCountryCode)
        : null;

      if (!phone) {
        missingPhone.push(report.student.fullName);
        continue;
      }

      const reportDate = report.createdAt.toLocaleDateString("en-CA");
      const evaluationSummary = reportEvaluationSummary({
        lessonMemorized: report.lessonMemorized,
        lastFiveMemorized: report.lastFiveMemorized,
        reviewMemorized: report.reviewMemorized,
      });
      const messageWithSummary =
        report.status === "ABSENT"
          ? absenceReportMessage({
              studentName: report.student.fullName,
              reportDate,
              circleName: report.student.circle?.name,
              teacherName: report.teacher?.fullName,
            })
          : reportChannel === "ONSITE_SYRIA"
            ? syriaDailyReportMessage({
                studentName: report.student.fullName,
                teacherName: report.teacher?.fullName || "غير محدد",
                circleName: report.student.circle?.name,
                reportDate,
                lessonName: cleanReportField(report.lessonName),
                review: cleanReportField(report.review),
                homework: cleanReportField(report.nextHomework),
                note: cleanReportField(report.note),
                evaluationSummary,
              })
          : insertEvaluationBeforeSignature(
              await renderMessageTemplate("REMOTE_REPORT", {
                studentName: report.student.fullName,
                teacherName: report.teacher?.fullName || "غير محدد",
                reportDate,
                lessonName: cleanReportField(report.lessonName),
                review: cleanReportField(report.review),
                homework: cleanReportField(report.nextHomework),
                note: cleanReportField(report.note),
                evaluationSummary,
              }),
              evaluationSummary
            );

      try {
        await sendWhatsAppText({
          to: phone,
          body: messageWithSummary,
          channel: reportChannel,
          source: "TEACHER_BULK_DAILY_REPORT",
        });

        await prisma.report.update({
          where: {
            id: report.id,
          },
          data: {
            sentToParent: true,
            parentSentAt: new Date(),
            parentSentChannel: "WHATSAPP",
            parentSentError: null,
          },
        });

        sentCount += 1;
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "تعذر إرسال التقرير عبر واتساب";

        await prisma.report.update({
          where: {
            id: report.id,
          },
          data: {
            parentSentError: messageText,
          },
        });

        failed.push({
          studentName: report.student.fullName,
          error: messageText,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      skippedCount: alreadySent.length + missingPhone.length,
      failedCount: failed.length + missingPhone.length,
      missingPhone,
      alreadySent,
      failed,
    });
  } catch (error) {
    console.error("BULK PARENT REPORT SEND ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال التقارير للأهل" },
      { status: 500 }
    );
  }
}
