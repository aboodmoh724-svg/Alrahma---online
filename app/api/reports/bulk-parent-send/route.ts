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
  if (value === true) return `*${HAFIZ}*`;
  if (value === false) return `*${NOT_HAFIZ}*`;
  return "";
}

function reportEvaluationSummary(input: {
  lessonMemorized?: boolean | null;
  lastFiveMemorized?: boolean | null;
  reviewMemorized?: boolean | null;
}) {
  const lines = [
    ["الدرس الجديد", statusLabel(input.lessonMemorized)],
    ["المراجعة", statusLabel(input.reviewMemorized)],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `- *${label}:* ${value}`);

  return lines.length ? `*${EVALUATION_TITLE}*\n${lines.join("\n")}` : "";
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
    `نفيدكم أن ابنكم الكريم / *${input.studentName}*\n` +
    `غائب عن التحفيظ اليوم بتاريخ ${input.reportDate} بدون عذر.\n\n` +
    `نرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.\n\n` +
    `نشكر لكم حسن تعاونكم.\n\n` +
    `إدارة تحفيظ الرحمة للقرآن الكريم - سوريا`
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
  let homeworkLines = "-";
  if (input.homework && input.homework !== "-") {
    homeworkLines = input.homework
      .split(" | ")
      .map((line) => `- ${line}`)
      .join("\n");
  }

  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `تقرير الطالب اليومي\n\n` +
    `*الطالب:* ${input.studentName}\n` +
    `*الحلقة:* ${input.circleName || "-"}\n` +
    `*المعلم:* ${input.teacherName || "-"}\n` +
    `*التاريخ:* ${input.reportDate}\n\n` +
    `*الدرس:* ${input.lessonName}\n` +
    `*المراجعة:* ${input.review}\n` +
    `*الواجب:* \n${homeworkLines}\n\n` +
    `${input.evaluationSummary || "*نتيجة التقييم:* -"}\n\n` +
    `*الملاحظات:* ${input.note || "-"}\n\n` +
    `جزاكم الله خيرًا على المتابعة والحرص.\n\n` +
    `إدارة تحفيظ الرحمة للقرآن الكريم - سوريا`
  );
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    const formatQuranMarksGuidance = (quranMarks: unknown) => {
      if (!Array.isArray(quranMarks) || quranMarks.length === 0) return "";

      const lines = quranMarks.map((mark: { surah: string; ayah: number; type: string; word?: string }) => {
        const typeLabels: Record<string, string> = {
          tajweed_error: "خطأ تجويدي",
          warning: "تنبيه تلقيني",
          hesitation: "تردد",
          stutter: "تلكؤ",
        };
        const typeLabel = typeLabels[mark.type] || mark.type;
        return `- سورة ${mark.surah} (الآية ${mark.ayah}): ${typeLabel}${mark.word ? ` في كلمة (${mark.word})` : ""}`;
      });

      return (
        `⚠️ يرجى تكرار الاستماع وتكرار هذه الآيات 10 مرات في المنزل:\n` +
        lines.join("\n")
      );
    };

    if (!teacherId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { reportIds?: unknown; reports?: unknown[] };
    let reportIds: string[] = [];

    if (Array.isArray(body.reports)) {
      const createdIds: string[] = [];
      for (const r of body.reports as any[]) {
        const newReport = await prisma.report.create({
          data: {
            studentId: r.studentId,
            teacherId,
            status: r.status,
            lessonName: r.lessonName || "",
            lessonSurah: r.lessonSurah || null,
            pageFrom: r.pageFrom || null,
            pageTo: r.pageTo || null,
            pagesCount: r.pagesCount || null,
            lessonMemorized: r.lessonMemorized ?? null,
            lessonErrors: r.lessonErrors || 0,
            lessonWarnings: r.lessonWarnings || 0,
            lessonHasHesitation: r.lessonHasHesitation || false,
            lastFiveMemorized: r.lastFiveMemorized ?? null,
            lastFiveErrors: r.lastFiveErrors || 0,
            lastFiveWarnings: r.lastFiveWarnings || 0,
            lastFiveHasHesitation: r.lastFiveHasHesitation || false,
            review: r.review || "",
            reviewSurah: r.reviewSurah || null,
            reviewFrom: r.reviewFrom || null,
            reviewTo: r.reviewTo || null,
            reviewPagesCount: r.reviewPagesCount || null,
            reviewMemorized: r.reviewMemorized ?? null,
            reviewErrors: r.reviewErrors || 0,
            reviewWarnings: r.reviewWarnings || 0,
            reviewPenaltyScore: r.reviewPenaltyScore || 0,
            homework: r.homework || "-",
            nextHomework: r.nextHomework || null,
            nextLessonHomework: r.nextLessonHomework || null,
            nextReviewHomework: r.nextReviewHomework || null,
            note: r.note || "",
            quranMarks: r.quranMarks ? JSON.parse(JSON.stringify(r.quranMarks)) : null,
          },
        });
        createdIds.push(newReport.id);
      }
      reportIds = createdIds;
    } else if (Array.isArray(body.reportIds)) {
      reportIds = body.reportIds.filter((id): id is string => typeof id === "string" && id.length > 0);
    }

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
        quranMarks: true,
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
      const quranMarksGuidance = formatQuranMarksGuidance(report.quranMarks);

      let messageWithSummary =
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

      if (report.status !== "ABSENT" && quranMarksGuidance) {
        messageWithSummary = insertEvaluationBeforeSignature(messageWithSummary, quranMarksGuidance);
      }

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
