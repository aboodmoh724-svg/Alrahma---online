import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  customParentWhatsAppMessage,
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  repeatedAbsenceWhatsAppMessage,
  repeatedStruggleWhatsAppMessage,
  sendWhatsAppText,
} from "@/lib/whatsapp";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

type NotifyType = "ABSENCE_REPEAT" | "STRUGGLE_REPEAT" | "CUSTOM";

function normalizeNotifyType(value: unknown): NotifyType | null {
  if (
    value === "ABSENCE_REPEAT" ||
    value === "STRUGGLE_REPEAT" ||
    value === "CUSTOM"
  ) {
    return value;
  }

  return null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولًا" }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "غير مصرح لك بإرسال رسائل خاصة إلى أولياء الأمور" },
        { status: 403 }
      );
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json({ error: "خدمة واتساب غير مفعلة حاليًا" }, { status: 400 });
    }

    const { studentId } = await context.params;
    const body = await request.json();
    const notifyType = normalizeNotifyType(body.type);
    const customMessage = String(body.message || "").trim();

    if (!notifyType) {
      return NextResponse.json({ error: "نوع الرسالة غير صالح" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        studyMode: true,
        parentWhatsapp: true,
        circle: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
          },
        },
        reports: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            createdAt: true,
            status: true,
            lessonMemorized: true,
            lastFiveMemorized: true,
            reviewMemorized: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    const phone = normalizeWhatsAppNumber(student.parentWhatsapp || "");

    if (!phone) {
      return NextResponse.json(
        { error: "لا يوجد رقم واتساب صالح مسجل لولي الأمر" },
        { status: 400 }
      );
    }

    const absenceCount = student.reports.filter((report) => report.status === "ABSENT").length;
    const struggleCount = student.reports.filter((report) => {
      return (
        report.lessonMemorized === false ||
        report.lastFiveMemorized === false ||
        report.reviewMemorized === false
      );
    }).length;

    let message = "";

    if (notifyType === "ABSENCE_REPEAT") {
      message = repeatedAbsenceWhatsAppMessage({
        studentName: student.fullName,
        teacherName: student.teacher.fullName,
        circleName: student.circle?.name,
        absenceCount,
      });
    }

    if (notifyType === "STRUGGLE_REPEAT") {
      message = repeatedStruggleWhatsAppMessage({
        studentName: student.fullName,
        teacherName: student.teacher.fullName,
        circleName: student.circle?.name,
        struggleCount,
      });
    }

    if (notifyType === "CUSTOM") {
      if (!customMessage) {
        return NextResponse.json({ error: "نص الرسالة الخاصة مطلوب" }, { status: 400 });
      }

      message = customParentWhatsAppMessage({
        message: customMessage,
      });
    }

    await sendWhatsAppText({
      to: phone,
      body: message,
      channel: student.studyMode,
    });

    return NextResponse.json({
      success: true,
      absenceCount,
      struggleCount,
    });
  } catch (error) {
    console.error("ADMIN NOTIFY PARENT ERROR =>", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "حدث خطأ أثناء إرسال الرسالة إلى ولي الأمر",
      },
      { status: 500 }
    );
  }
}
