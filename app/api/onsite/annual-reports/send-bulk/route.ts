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

const BULK_SIZE = 2;

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

    for (let index = 0; index < reports.length; index += BULK_SIZE) {
      const batch = reports.slice(index, index + BULK_SIZE);
      const results = await Promise.all(
        batch.map(async (report) => {
          const documentUrl = annualReportPublicUrl(report.reportImagePath);
          const phone = normalizeWhatsAppNumber(
            report.student?.parentWhatsapp || "",
            "90"
          );

          if (!documentUrl) {
            return {
              ok: false as const,
              report,
              error: "لا توجد صورة مرفوعة لهذا التقرير",
            };
          }

          if (!phone) {
            return {
              ok: false as const,
              report,
              error: "لا يوجد رقم واتساب صالح لولي الأمر",
            };
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

            return { ok: true as const, report };
          } catch (error) {
            return {
              ok: false as const,
              report,
              error:
                error instanceof Error
                  ? error.message
                  : "تعذر إرسال التقرير",
            };
          }
        })
      );

      for (const result of results) {
        if (result.ok) {
          sentCount += 1;
          await prisma.annualReport.update({
            where: { id: result.report.id },
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
        } else {
          failed.push({
            id: result.report.id,
            studentName: result.report.studentName,
            error: result.error,
          });
          await prisma.annualReport.update({
            where: { id: result.report.id },
            data: {
              sendError: result.error,
            },
          });
        }
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
