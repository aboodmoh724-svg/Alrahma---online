import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

async function getCurrentOnsiteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "ONSITE",
      isActive: true,
    },
    select: { id: true },
  });
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const admin = await getCurrentOnsiteAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "لا تملك صلاحية اعتماد التقارير السنوية" },
        { status: 403 }
      );
    }

    const { reportId } = await context.params;
    const report = await prisma.annualReport.findFirst({
      where: {
        id: reportId,
        student: {
          studyMode: "ONSITE",
        },
      },
      select: {
        id: true,
        sentAt: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "التقرير السنوي غير موجود في قسم أفيون" },
        { status: 404 }
      );
    }

    if (report.sentAt) {
      return NextResponse.json(
        { error: "لا يمكن تعديل تقرير تم إرساله لولي الأمر" },
        { status: 400 }
      );
    }

    const updated = await prisma.annualReport.update({
      where: { id: report.id },
      data: {
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
        reviewer: {
          connect: {
            id: admin.id,
          },
        },
        sendError: null,
      },
      select: {
        id: true,
        reviewStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (error) {
    console.error("APPROVE ONSITE ANNUAL REPORT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء اعتماد التقرير السنوي" },
      { status: 500 }
    );
  }
}
