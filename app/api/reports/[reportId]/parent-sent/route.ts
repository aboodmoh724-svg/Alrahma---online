import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { renderMessageTemplate } from "@/lib/message-templates";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

const REPORT_FIELD_PREFIX = /^(\u0627\u0644\u062f\u0631\u0633\s*\u0627\u0644\u062c\u062f\u064a\u062f|\u0627\u0644\u062f\u0631\u0633|\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629|\u0627\u0644\u0648\u0627\u062c\u0628|\u0648\u0627\u062c\u0628\s*\u0627\u0644\u063a\u062f)\s*[:\uff1a\-]\s*/i;
const REPORT_FIELD_REPEAT_PREFIX = /^(\u0627\u0644\u062f\u0631\u0633\s*\u0627\u0644\u062c\u062f\u064a\u062f|\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629)\s*[:\uff1a\-]\s*/i;
const HAFIZ = "\u062d\u0627\u0641\u0638";
const NOT_HAFIZ = "\u063a\u064a\u0631 \u062d\u0627\u0641\u0638";
const EVALUATION_TITLE = "\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u062a\u0642\u064a\u064a\u0645:";
const SIGNATURE_PREFIX = "\u0625\u062f\u0627\u0631\u0629 \u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u062d\u0645\u0629";

function cleanReportField(value: string | null | undefined) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text === "-") return "-";

  return text.replace(REPORT_FIELD_PREFIX, "").replace(REPORT_FIELD_REPEAT_PREFIX, "").trim() || "-";
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
    ["\u0627\u0644\u062f\u0631\u0633 \u0627\u0644\u062c\u062f\u064a\u062f", statusLabel(input.lessonMemorized)],
    ["\u0622\u062e\u0631 \u062e\u0645\u0633 \u0635\u0641\u062d\u0627\u062a", statusLabel(input.lastFiveMemorized)],
    ["\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629", statusLabel(input.reviewMemorized)],
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

function absenceReportMessage(input: { studentName: string; reportDate: string }) {
  return (
    `\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645 \u0648\u0631\u062d\u0645\u0629 \u0627\u0644\u0644\u0647 \u0648\u0628\u0631\u0643\u0627\u062a\u0647\n\n` +
    `\u0646\u0648\u062f \u0625\u0628\u0644\u0627\u063a\u0643\u0645 \u0623\u0646 \u0627\u0628\u0646\u0643\u0645 *${input.studentName}* \u062a\u063a\u064a\u0628 \u0627\u0644\u064a\u0648\u0645 \u0639\u0646 \u062d\u0636\u0648\u0631 \u0627\u0644\u062d\u0644\u0642\u0629 \u0628\u062a\u0627\u0631\u064a\u062e ${input.reportDate}.\n\n` +
    `\u0646\u0631\u062c\u0648 \u0645\u0646\u0643\u0645 \u0627\u0644\u0627\u0647\u062a\u0645\u0627\u0645 \u0628\u0627\u0644\u062d\u0636\u0648\u0631\u061b \u0644\u0623\u0646 \u0627\u0644\u063a\u064a\u0627\u0628 \u064a\u0624\u062b\u0631 \u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0639\u0644\u0645 \u0648\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629.\n\n` +
    `\u0625\u062f\u0627\u0631\u0629 \u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u062d\u0645\u0629 \u0644\u062a\u062d\u0641\u064a\u0638 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645`
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;
    const { reportId } = await context.params;
    const body = await request.json();
    const sentToParent = Boolean(body.sentToParent);

    if (!teacherId) {
      return NextResponse.json(
        { error: "\u0627\u0644\u0631\u062c\u0627\u0621 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u064b\u0627" },
        { status: 401 }
      );
    }

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        teacherId,
        student: {
          studyMode: "REMOTE",
        },
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
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f \u0623\u0648 \u0644\u0627 \u064a\u062a\u0628\u0639 \u0647\u0630\u0627 \u0627\u0644\u0645\u0639\u0644\u0645" },
        { status: 404 }
      );
    }

    if (report.sentToParent || !sentToParent) {
      return NextResponse.json({
        success: true,
        report,
      });
    }

    const phone = report.student.parentWhatsapp
      ? normalizeWhatsAppNumber(report.student.parentWhatsapp)
      : null;

    if (!phone) {
      return NextResponse.json(
        { error: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0631\u0642\u0645 \u0648\u0627\u062a\u0633\u0627\u0628 \u0645\u0633\u062c\u0644 \u0644\u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631" },
        { status: 400 }
      );
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
          })
        : insertEvaluationBeforeSignature(
            await renderMessageTemplate("REMOTE_REPORT", {
              studentName: report.student.fullName,
              teacherName: report.teacher?.fullName || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
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
        channel: "REMOTE",
      });
    } catch (whatsAppError) {
      const messageText =
        whatsAppError instanceof Error
          ? whatsAppError.message
          : "\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628";

      await prisma.report.update({
        where: {
          id: report.id,
        },
        data: {
          parentSentError: messageText,
        },
      });

      return NextResponse.json({ error: messageText }, { status: 502 });
    }

    const updatedReport = await prisma.report.update({
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

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error("UPDATE PARENT REPORT STATUS ERROR =>", error);

    return NextResponse.json(
      { error: "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0642\u0631\u064a\u0631" },
      { status: 500 }
    );
  }
}
