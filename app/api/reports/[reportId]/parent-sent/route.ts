import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizeWhatsAppNumber,
  remoteDailyReportWhatsAppMessage,
  sendWhatsAppText,
} from "@/lib/whatsapp";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;
    const { reportId } = await context.params;
    const body = await request.json();
    const sentToParent = Boolean(body.sentToParent);

    if (!teacherId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولًا" },
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
        lessonName: true,
        review: true,
        nextHomework: true,
        note: true,
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
        { error: "التقرير غير موجود أو لا يتبع هذا المعلم" },
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
        { error: "لا يوجد رقم واتساب مسجل لولي الأمر" },
        { status: 400 }
      );
    }

    const message = remoteDailyReportWhatsAppMessage({
      studentName: report.student.fullName,
      lessonName: report.lessonName,
      review: report.review,
      homework: report.nextHomework,
      note: report.note,
    });

    try {
      await sendWhatsAppText({
        to: phone,
        body: message,
      });
    } catch (whatsAppError) {
      const messageText =
        whatsAppError instanceof Error
          ? whatsAppError.message
          : "تعذر إرسال التقرير عبر واتساب";

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
      { error: "حدث خطأ أثناء تحديث حالة إرسال التقرير" },
      { status: 500 }
    );
  }
}
