import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTeacherNotification } from "@/lib/teacher-notifications";
import { generateTeacherVisitPdf } from "@/lib/teacher-visit-report-pdf";
import {
  TEACHER_VISIT_EVALUATION_OPTIONS,
  TEACHER_VISIT_GENERAL_ITEMS,
  TEACHER_VISIT_MAIN_ITEMS,
  TEACHER_VISIT_PERIOD_OPTIONS,
  TEACHER_VISIT_TRACK_OPTIONS,
  teacherVisitDateLabel,
  teacherVisitDayLabel,
  teacherVisitTypeLabel,
  type TeacherVisitGeneralItem,
  type TeacherVisitMainItem,
  type TeacherVisitTypeValue,
} from "@/lib/teacher-visit-reports";
import {
  normalizeWhatsAppNumber,
  sendWhatsAppText,
  teacherVisitReportWhatsAppMessage,
} from "@/lib/whatsapp";

function normalizeVisitType(value: unknown): TeacherVisitTypeValue | null {
  return value === "FIELD" || value === "SECRET" ? value : null;
}

function normalizeTrackLabel(value: unknown) {
  const normalized = String(value || "").trim();
  return TEACHER_VISIT_TRACK_OPTIONS.includes(
    normalized as (typeof TEACHER_VISIT_TRACK_OPTIONS)[number]
  )
    ? normalized
    : null;
}

function normalizePeriodLabel(value: unknown) {
  const normalized = String(value || "").trim();
  return TEACHER_VISIT_PERIOD_OPTIONS.includes(
    normalized as (typeof TEACHER_VISIT_PERIOD_OPTIONS)[number]
  )
    ? normalized
    : null;
}

function normalizeEvaluation(value: unknown) {
  const normalized = String(value || "").trim();
  return TEACHER_VISIT_EVALUATION_OPTIONS.includes(
    normalized as (typeof TEACHER_VISIT_EVALUATION_OPTIONS)[number]
  )
    ? normalized
    : null;
}

function normalizeMainItems(value: unknown): TeacherVisitMainItem[] {
  const items = Array.isArray(value) ? value : [];

  return TEACHER_VISIT_MAIN_ITEMS.map((label) => {
    const matched = items.find(
      (item) => item && typeof item === "object" && String((item as { label?: string }).label || "") === label
    ) as { note?: string } | undefined;

    return {
      label,
      note: String(matched?.note || "").trim(),
    };
  });
}

function normalizeGeneralItems(value: unknown): TeacherVisitGeneralItem[] {
  const items = Array.isArray(value) ? value : [];

  return TEACHER_VISIT_GENERAL_ITEMS.map((label) => {
    const matched = items.find(
      (item) => item && typeof item === "object" && String((item as { label?: string }).label || "") === label
    ) as { evaluation?: string } | undefined;

    return {
      label,
      evaluation: normalizeEvaluation(matched?.evaluation) || "يحتاج متابعة",
    };
  });
}

async function getCurrentSupervisor() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
      canAccessSupervision: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

export async function GET() {
  try {
    const supervisor = await getCurrentSupervisor();

    if (!supervisor) {
      return NextResponse.json({ error: "غير مصرح لك بعرض تقارير الزيارات" }, { status: 403 });
    }

    const reports = await prisma.teacherVisitReport.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 30,
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("GET TEACHER VISIT REPORTS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب تقارير الزيارات" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supervisor = await getCurrentSupervisor();

    if (!supervisor) {
      return NextResponse.json({ error: "غير مصرح لك بإضافة زيارة معلم" }, { status: 403 });
    }

    const body = await req.json();
    const teacherId = String(body.teacherId || "").trim();
    const visitDate = String(body.visitDate || "").trim();
    const visitType = normalizeVisitType(body.visitType);
    const trackLabel = normalizeTrackLabel(body.trackLabel);
    const periodLabel = normalizePeriodLabel(body.periodLabel);
    const overallEvaluation = normalizeEvaluation(body.overallEvaluation);
    const finalRecommendation = String(body.finalRecommendation || "").trim();
    const generalNotes = String(body.generalNotes || "").trim();
    const mainItems = normalizeMainItems(body.mainItems);
    const generalItems = normalizeGeneralItems(body.generalItems);

    if (!teacherId || !visitDate || !visitType || !trackLabel || !periodLabel) {
      return NextResponse.json({ error: "بيانات الزيارة الأساسية غير مكتملة" }, { status: 400 });
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        studyMode: "REMOTE",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        whatsapp: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "المعلم غير موجود" }, { status: 404 });
    }

    const visitAt = new Date(`${visitDate}T00:00:00.000Z`);
    const dayLabel = teacherVisitDayLabel(visitAt);

    const task = await prisma.supervisionTask.create({
      data: {
        createdById: supervisor.id,
        source: "ADMIN",
        category: "TEACHER_VISIT",
        title: `زيارة معلم: ${teacher.fullName}`,
        details: `${teacherVisitTypeLabel(visitType)} - ${teacherVisitDateLabel(visitAt)} - ${trackLabel}`,
        status: "DONE",
        closedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    const createdReport = await prisma.teacherVisitReport.create({
      data: {
        supervisorId: supervisor.id,
        teacherId: teacher.id,
        taskId: task.id,
        visitDate: visitAt,
        dayLabel,
        visitType,
        trackLabel,
        periodLabel,
        overallEvaluation: overallEvaluation || null,
        finalRecommendation: finalRecommendation || null,
        generalNotes: generalNotes || null,
        mainItems,
        generalItems,
      },
    });

    const pdf = await generateTeacherVisitPdf({
      visitNumber: createdReport.visitNumber,
      supervisorName: supervisor.fullName,
      teacherName: teacher.fullName,
      visitDate: visitAt,
      dayLabel,
      visitType,
      trackLabel,
      periodLabel,
      overallEvaluation,
      finalRecommendation,
      generalNotes,
      mainItems,
      generalItems,
    });

    let sentToTeacherAt: Date | null = null;
    const teacherWhatsapp = normalizeWhatsAppNumber(teacher.whatsapp || "");

    if (teacherWhatsapp) {
      await sendWhatsAppText({
        to: teacherWhatsapp,
        channel: "REMOTE",
        body: teacherVisitReportWhatsAppMessage({
          teacherName: teacher.fullName,
          supervisorName: supervisor.fullName,
          visitNumber: createdReport.visitNumber,
          visitType: teacherVisitTypeLabel(visitType),
          visitDate: teacherVisitDateLabel(visitAt),
          pdfUrl: pdf.pdfUrl,
        }),
      });

      sentToTeacherAt = new Date();
    }

    const report = await prisma.teacherVisitReport.update({
      where: {
        id: createdReport.id,
      },
      data: {
        pdfPath: pdf.pdfPath,
        pdfGeneratedAt: new Date(),
        sentToTeacherAt,
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    await createTeacherNotification({
      userId: teacher.id,
      title: `تقرير زيارة جديد رقم ${report.visitNumber}`,
      body: `تمت إضافة زيارة ${teacherVisitTypeLabel(visitType)} بتاريخ ${teacherVisitDateLabel(visitAt)}.`,
      link: pdf.pdfPath,
    });

    return NextResponse.json({
      success: true,
      report,
      pdfUrl: pdf.pdfUrl,
    });
  } catch (error) {
    console.error("CREATE TEACHER VISIT REPORT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء تقرير زيارة المعلم" },
      { status: 500 }
    );
  }
}
