import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  annualReportCaption,
  annualReportPublicUrl,
} from "@/lib/annual-reports";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppDocument,
} from "@/lib/whatsapp";

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

export async function POST(_request: Request, context: RouteContext) {
  try {
    const admin = await getCurrentOnsiteAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "لا تملك صلاحية إرسال التقارير السنوية" },
        { status: 403 }
      );
    }

    if (!isWhatsAppConfigured("ONSITE")) {
      return NextResponse.json(
        { error: "خدمة واتساب غير مفعلة حاليًا لقسم أفيون" },
        { status: 400 }
      );
    }

    const { reportId } = await context.params;
    const report = await prisma.annualReport.findFirst({
      where: {
        id: reportId,
        student: {
          studyMode: "ONSITE",
          isActive: true,
        },
      },
      include: {
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
        { error: "التقرير السنوي غير موجود في قسم أفيون" },
        { status: 404 }
      );
    }

    if (report.reviewStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "يجب اعتماد التقرير قبل إرساله لولي الأمر" },
        { status: 400 }
      );
    }

    if (report.sentAt) {
      return NextResponse.json(
        { error: "تم إرسال هذا التقرير سابقًا ولا يمكن إرساله مرة أخرى" },
        { status: 400 }
      );
    }

    const documentUrl = annualReportPublicUrl(report.reportImagePath);

    if (!documentUrl) {
      return NextResponse.json(
        { error: "لا توجد صورة مرفوعة لهذا التقرير" },
        { status: 400 }
      );
    }

    const phone = normalizeWhatsAppNumber(report.student?.parentWhatsapp || "", "90");

    if (!phone) {
      return NextResponse.json(
        { error: "لا يوجد رقم واتساب صالح لولي الأمر" },
        { status: 400 }
      );
    }

    try {
      await sendWhatsAppDocument({
        to: phone,
        channel: "ONSITE",
        documentUrl,
        fileName: report.reportImageFilename || `${report.studentKey}.png`,
        caption: annualReportCaption({
          studentName: report.student?.fullName || report.studentName,
          academicYear: report.academicYear,
        }),
      });
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "تعذر إرسال التقرير";
      await prisma.annualReport.update({
        where: { id: report.id },
        data: {
          sendError: message,
        },
      });

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const updated = await prisma.annualReport.update({
      where: { id: report.id },
      data: {
        reviewStatus: "SENT",
        sentAt: new Date(),
        sender: {
          connect: {
            id: admin.id,
          },
        },
        sendError: null,
      },
      select: {
        id: true,
        reviewStatus: true,
        sentAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (error) {
    console.error("SEND ONSITE ANNUAL REPORT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال التقرير السنوي" },
      { status: 500 }
    );
  }
}
