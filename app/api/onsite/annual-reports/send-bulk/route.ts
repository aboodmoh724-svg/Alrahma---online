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
import {
  smartDelay,
  humanDelay,
  canSendMore,
  incrementDailySendCount,
  getDailySendCount,
  getDailyLimit,
  addMessageVariation,
} from "@/lib/smart-sender";

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

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const circleId = String(body.circleId || "").trim();
    const reportIds = Array.isArray(body.reportIds)
      ? body.reportIds.map((id: unknown) => String(id || "").trim()).filter(Boolean)
      : [];

    const reports = await prisma.annualReport.findMany({
      where: {
        reviewStatus: "APPROVED",
        sentAt: null,
        student: {
          studyMode: "ONSITE",
          isActive: true,
        },
        ...(circleId ? { circleId } : {}),
        ...(reportIds.length ? { id: { in: reportIds } } : {}),
      },
      orderBy: [{ teacherName: "asc" }, { studentName: "asc" }],
      include: {
        student: {
          select: {
            fullName: true,
            parentWhatsapp: true,
          },
        },
      },
    });

    let sentCount = 0;
    const failed: Array<{ id: string; studentName: string; error: string }> = [];

    for (let index = 0; index < reports.length; index++) {
      const report = reports[index];

      if (!canSendMore("ONSITE")) {
        const errorMsg = "تم تجاوز الحد اليومي لإرسال الرسائل (ONSITE)";
        failed.push({
          id: report.id,
          studentName: report.studentName,
          error: errorMsg,
        });
        await prisma.annualReport.update({
          where: { id: report.id },
          data: { sendError: errorMsg },
        });
        continue;
      }

      await smartDelay(index);

      const documentUrl = annualReportPublicUrl(report.reportImagePath);
      const phone = normalizeWhatsAppNumber(
        report.student?.parentWhatsapp || "",
        "90"
      );

      if (!documentUrl) {
        const errorMsg = "لا توجد صورة مرفوعة لهذا التقرير";
        failed.push({
          id: report.id,
          studentName: report.studentName,
          error: errorMsg,
        });
        await prisma.annualReport.update({
          where: { id: report.id },
          data: { sendError: errorMsg },
        });
        continue;
      }

      if (!phone) {
        const errorMsg = "لا يوجد رقم واتساب صالح لولي الأمر";
        failed.push({
          id: report.id,
          studentName: report.studentName,
          error: errorMsg,
        });
        await prisma.annualReport.update({
          where: { id: report.id },
          data: { sendError: errorMsg },
        });
        continue;
      }

      try {
        await sendWhatsAppDocument({
          to: phone,
          channel: "ONSITE",
          documentUrl,
          fileName: report.reportImageFilename || `${report.studentKey}.png`,
          caption: addMessageVariation(
            annualReportCaption({
              studentName: report.student?.fullName || report.studentName,
              academicYear: report.academicYear,
            })
          ),
        });

        incrementDailySendCount("ONSITE");
        sentCount += 1;

        await prisma.annualReport.update({
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
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "تعذر إرسال التقرير";
        failed.push({
          id: report.id,
          studentName: report.studentName,
          error: errorMsg,
        });
        await prisma.annualReport.update({
          where: { id: report.id },
          data: {
            sendError: errorMsg,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      consideredCount: reports.length,
      sentCount,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    console.error("SEND BULK ONSITE ANNUAL REPORTS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الإرسال الجماعي للتقارير السنوية" },
      { status: 500 }
    );
  }
}
