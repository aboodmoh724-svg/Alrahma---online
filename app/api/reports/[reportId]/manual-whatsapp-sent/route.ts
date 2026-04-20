import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("alrahma_user_id")?.value;

    if (!adminId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولا" },
        { status: 401 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: "ADMIN",
        studyMode: "ONSITE",
        isActive: true,
      },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "لا تملك صلاحية تحديث إرسال الواتساب" },
        { status: 403 }
      );
    }

    const { reportId } = await context.params;
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        student: {
          studyMode: "ONSITE",
          isActive: true,
        },
      },
      select: { id: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "التقرير غير موجود في قسم الحضوري" },
        { status: 404 }
      );
    }

    const updatedReport = await prisma.report.update({
      where: { id: report.id },
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
    console.error("MARK MANUAL WHATSAPP SENT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل إرسال الواتساب" },
      { status: 500 }
    );
  }
}
