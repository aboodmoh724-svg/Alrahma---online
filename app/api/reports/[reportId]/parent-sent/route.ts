import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dailyReportEmail, isEmailConfigured, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

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
      },
      select: {
        id: true,
        sentToParent: true,
        lessonName: true,
        pageFrom: true,
        pageTo: true,
        pagesCount: true,
        nextHomework: true,
        note: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            fullName: true,
            parentEmail: true,
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

    if (!report.student.parentEmail) {
      return NextResponse.json(
        { error: "لا يوجد بريد إلكتروني مسجل لولي الأمر" },
        { status: 400 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "خدمة الإيميل غير مفعلة بعد. أضف RESEND_API_KEY في إعدادات Vercel." },
        { status: 503 }
      );
    }

    const emailContent = dailyReportEmail({
      studentName: report.student.fullName,
      reportDate: report.createdAt.toLocaleDateString("ar-EG"),
      lessonName: report.lessonName,
      status: report.status,
      pageFrom: report.pageFrom,
      pageTo: report.pageTo,
      pagesCount: report.pagesCount,
      nextHomework: report.nextHomework,
      note: report.note,
    });

    try {
      await sendEmail({
        to: report.student.parentEmail,
        subject: emailContent.subject,
        text: emailContent.text,
      });
    } catch (emailError) {
      const message =
        emailError instanceof Error
          ? emailError.message
          : "تعذر إرسال التقرير عبر الإيميل";

      return NextResponse.json(
        { error: message },
        { status: 502 }
      );
    }

    const updatedReport = await prisma.report.update({
      where: {
        id: report.id,
      },
      data: {
        sentToParent,
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
