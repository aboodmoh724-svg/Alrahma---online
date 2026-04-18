import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
