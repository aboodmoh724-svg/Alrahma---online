import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true, fullName: true },
  });
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

// GET: Fetch all pending edit requests and notifications for summer program
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const requests = await prisma.teacherRequest.findMany({
      where: {
        target: "ADMIN",
        subject: { startsWith: "طلب تعديل تقرير" },
      },
      include: {
        teacher: { select: { fullName: true } },
        student: { select: { fullName: true, circle: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("GET ADMIN EDIT REQUESTS ERROR =>", error);
    return NextResponse.json({ error: "فشل جلب طلبات التعديل" }, { status: 500 });
  }
}

// POST: Approve/Reject request OR Admin direct edit report
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Action 1: Handle Teacher Edit Request Approval / Rejection
    if (action === "REVIEW_REQUEST") {
      const { requestId, status, adminNote } = body;

      const request = await prisma.teacherRequest.update({
        where: { id: requestId },
        data: {
          status: status === "APPROVED" ? "RESOLVED" : "REJECTED",
          adminNote: adminNote || (status === "APPROVED" ? "تم قبول طلب التعديل" : "تم رفض طلب التعديل"),
          reviewedBy: admin.id,
          resolvedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: status === "APPROVED" ? "تم قبول طلب التعديل بنجاح ✅" : "تم رفض طلب التعديل",
        request,
      });
    }

    // Action 2: Admin Direct Edit Student Report
    if (action === "ADMIN_UPDATE_REPORT") {
      const {
        reportId,
        studentId,
        dateKey,
        status,
        quranNew,
        quranRevision,
        quranTaqeen,
        noorLearned,
        noorHomework,
        noorHomeworkGrade,
        noorParticipation,
        behaviorGrade,
        behaviorNotes,
      } = body;

      if (!studentId || !dateKey) {
        return NextResponse.json({ error: "بيانات التقرير غير مكتملة" }, { status: 400 });
      }

      const reportData = {
        studentId,
        dateKey,
        status: status === "ABSENT" ? ReportStatus.ABSENT : ReportStatus.PRESENT,
        quranNew: typeof quranNew === "string" ? quranNew.trim() : null,
        quranRevision: typeof quranRevision === "string" ? quranRevision.trim() : null,
        quranTaqeen: typeof quranTaqeen === "string" ? quranTaqeen.trim() : null,
        noorLearned: typeof noorLearned === "string" ? noorLearned.trim() : null,
        noorHomework: typeof noorHomework === "boolean" ? noorHomework : noorHomework === "true",
        noorHomeworkGrade: optionalNumber(noorHomeworkGrade),
        noorParticipation: optionalNumber(noorParticipation),
        behaviorGrade: optionalNumber(behaviorGrade) ?? 5,
        behaviorNotes: typeof behaviorNotes === "string" ? behaviorNotes.trim() : null,
      };

      const updatedReport = await prisma.summerReport.upsert({
        where: {
          studentId_dateKey: {
            studentId,
            dateKey,
          },
        },
        create: {
          ...reportData,
          teacherId: admin.id,
        },
        update: reportData,
      });

      return NextResponse.json({
        success: true,
        message: "تم تعديل التقرير بواسطة الإدارة بنجاح ✅",
        report: updatedReport,
      });
    }

    if (action === "ADMIN_DELETE_REPORT") {
      const { studentId, dateKey } = body;
      if (!studentId || !dateKey) {
        return NextResponse.json({ error: "بيانات التقرير غير مكتملة" }, { status: 400 });
      }

      await prisma.summerReport.delete({
        where: {
          studentId_dateKey: {
            studentId,
            dateKey,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "تم حذف التقرير اليومي بنجاح ✅",
      });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("ADMIN POST EDIT REQUEST ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
