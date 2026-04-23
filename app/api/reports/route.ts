import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isMakeAttendanceWebhookConfigured,
  sendAttendanceToMake,
} from "@/lib/make-attendance";
import { prisma } from "@/lib/prisma";
import {
  attendanceTemplateConfig,
  dailyAttendanceWhatsAppMessage,
  isWhatsAppConfigured,
  isWhatsAppWebJsConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppTemplate,
  sendWhatsAppText,
} from "@/lib/whatsapp";

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function attendanceMessage(input: {
  studentName: string;
  reportDate: string;
  status: "PRESENT" | "ABSENT";
  lessonName: string;
  nextHomework: string;
  note: string;
}) {
  if (input.status === "ABSENT") {
    return `السلام عليكم ورحمة الله وبركاته\n\nنفيدكم أن ابنكم الكريم / ${input.studentName}\nغائب عن التحفيظ اليوم بدون عذر.\n\nنرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.\n\nنشكر لكم حرصكم وتفهمكم.\n\nهذه الرسالة ترسل بشكل تلقائي للطلاب الغائبين.\n\nإدارة تحفيظ الرحمة للقرآن الكريم - أفيون`;
  }

  return dailyAttendanceWhatsAppMessage({
    studentName: input.studentName,
    reportDate: input.reportDate,
    status: input.status,
    lessonName: input.lessonName,
    nextHomework: input.nextHomework,
    note: input.note,
  });
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;
    const body = await req.json();

    const {
      studentId,
      attendanceOnly,
      lessonName,
      lessonSurah,
      lessonMemorized,
      lastFiveMemorized,
      review,
      reviewSurah,
      reviewFrom,
      reviewTo,
      reviewPagesCount,
      reviewMemorized,
      pageFrom,
      pageTo,
      pagesCount,
      homework,
      nextHomework,
      nextLessonHomework,
      nextReviewHomework,
      note,
      status,
    } = body;

    const isAbsent = status === "ABSENT";
    const isAttendanceOnly = Boolean(attendanceOnly);

    if (!teacherId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولًا" },
        { status: 401 }
      );
    }

    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json({ error: "الطالب مطلوب" }, { status: 400 });
    }

    if (
      !isAbsent &&
      (!lessonName || typeof lessonName !== "string" || !lessonName.trim())
    ) {
      return NextResponse.json({ error: "الدرس مطلوب" }, { status: 400 });
    }

    if (
      !isAbsent &&
      !isAttendanceOnly &&
      (!lessonSurah ||
        typeof lessonSurah !== "string" ||
        !lessonSurah.trim())
    ) {
      return NextResponse.json({ error: "اسم السورة في الدرس الجديد مطلوب" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId.trim(),
        teacherId,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        studyMode: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "لا يمكنك إضافة تقرير لهذا الطالب" },
        { status: 403 }
      );
    }

    const report = await prisma.report.create({
      data: {
        studentId: student.id,
        teacherId,
        lessonName: isAbsent ? "غياب" : lessonName.trim(),
        lessonSurah:
          isAttendanceOnly
            ? null
            : typeof lessonSurah === "string"
              ? lessonSurah.trim()
              : null,
        lessonMemorized:
          typeof lessonMemorized === "boolean" ? lessonMemorized : null,
        lastFiveMemorized:
          typeof lastFiveMemorized === "boolean" ? lastFiveMemorized : null,
        review: typeof review === "string" ? review.trim() : "",
        reviewSurah:
          typeof reviewSurah === "string" ? reviewSurah.trim() : null,
        reviewFrom: optionalNumber(reviewFrom),
        reviewTo: optionalNumber(reviewTo),
        reviewPagesCount: optionalNumber(reviewPagesCount),
        reviewMemorized:
          typeof reviewMemorized === "boolean" ? reviewMemorized : null,
        pageFrom: optionalNumber(pageFrom),
        pageTo: optionalNumber(pageTo),
        pagesCount: optionalNumber(pagesCount),
        homework:
          typeof homework === "string" && homework.trim() ? homework.trim() : "-",
        nextHomework:
          typeof nextHomework === "string" ? nextHomework.trim() : "",
        nextLessonHomework:
          typeof nextLessonHomework === "string" ? nextLessonHomework.trim() : "",
        nextReviewHomework:
          typeof nextReviewHomework === "string" ? nextReviewHomework.trim() : "",
        note: typeof note === "string" ? note.trim() : "",
        status: isAbsent ? "ABSENT" : "PRESENT",
      },
    });

    let whatsappResult:
      | { attempted: false }
      | { attempted: true; sent: true }
      | { attempted: true; sent: false; error: string } = { attempted: false };

    if (student.studyMode === "REMOTE" && !isAttendanceOnly) {
      const normalized = student.parentWhatsapp
        ? normalizeWhatsAppNumber(student.parentWhatsapp)
        : null;

      if (normalized && (isWhatsAppConfigured() || isMakeAttendanceWebhookConfigured())) {
        whatsappResult = { attempted: true, sent: false, error: "" };

        try {
          const reportDate = report.createdAt.toLocaleDateString("ar-EG");
          const nextHomeworkValue = report.nextHomework || "غير محدد";
          const noteValue = report.note || "لا توجد ملاحظات";
          const messageBody = attendanceMessage({
            studentName: student.fullName,
            reportDate,
            status: report.status,
            lessonName: report.lessonName,
            nextHomework: nextHomeworkValue,
            note: noteValue,
          });

          if (isWhatsAppConfigured()) {
            const template = attendanceTemplateConfig(report.status);

            if (template && !isWhatsAppWebJsConfigured()) {
              await sendWhatsAppTemplate({
                to: normalized,
                templateName: template.templateName,
                languageCode: template.languageCode,
                bodyVariables: [
                  student.fullName,
                  reportDate,
                  report.lessonName,
                  nextHomeworkValue,
                  noteValue,
                ],
              });
            } else {
              await sendWhatsAppText({ to: normalized, body: messageBody });
            }
          } else {
            await sendAttendanceToMake({
              reportId: report.id,
              studentName: student.fullName,
              parentWhatsapp: normalized,
              status: report.status,
              reportDate,
              lessonName: report.lessonName,
              nextHomework: nextHomeworkValue,
              note: noteValue,
              messageBody,
            });
          }

          await prisma.report.update({
            where: { id: report.id },
            data: {
              sentToParent: true,
              parentSentAt: new Date(),
              parentSentChannel: "WHATSAPP",
              parentSentError: null,
            },
          });
          whatsappResult = { attempted: true, sent: true };
        } catch (whatsAppError) {
          const message =
            whatsAppError instanceof Error
              ? whatsAppError.message
              : "تعذر إرسال رسالة واتساب لولي الأمر";

          await prisma.report.update({
            where: { id: report.id },
            data: {
              sentToParent: false,
              parentSentAt: null,
              parentSentChannel: null,
              parentSentError: message,
            },
          });

          whatsappResult = { attempted: true, sent: false, error: message };
        }
      }
    }

    return NextResponse.json({
      success: true,
      report,
      whatsapp: whatsappResult,
    });
  } catch (error) {
    console.error("CREATE REPORT ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ التقرير" },
      { status: 500 }
    );
  }
}
