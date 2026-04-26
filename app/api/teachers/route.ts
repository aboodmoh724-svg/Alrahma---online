import { NextResponse } from "next/server";
import { renderMessageTemplate } from "@/lib/message-templates";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppText,
} from "@/lib/whatsapp";

function normalizeStudyMode(value: unknown) {
  return value === "REMOTE" || value === "ONSITE" ? value : undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studyMode = normalizeStudyMode(url.searchParams.get("studyMode"));

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        ...(studyMode ? { studyMode } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      teachers,
    });
  } catch (error) {
    console.error("GET TEACHERS ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المعلمين" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const whatsapp = String(body.whatsapp || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode);

    if (!fullName) {
      return NextResponse.json({ error: "اسم المعلم مطلوب" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
    }

    if (!studyMode) {
      return NextResponse.json({ error: "نوع الدراسة غير صالح" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد مستخدم مسبقًا" },
        { status: 400 }
      );
    }

    const teacher = await prisma.user.create({
      data: {
        fullName,
        email,
        password,
        whatsapp: whatsapp || null,
        role: "TEACHER",
        studyMode,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
      },
    });

    let whatsappSent = false;
    let whatsappWarning: string | null = null;
    const normalizedWhatsapp = normalizeWhatsAppNumber(whatsapp);

    if (normalizedWhatsapp && isWhatsAppConfigured()) {
      try {
        const platformLabel = studyMode === "REMOTE" ? "التعليم عن بعد" : "التعليم الحضوري";
        const loginUrl =
          studyMode === "REMOTE"
            ? "https://alrahma-reports.vercel.app/remote/teacher/login"
            : "https://alrahma-reports.vercel.app/onsite/teacher/login";

        await sendWhatsAppText({
          to: normalizedWhatsapp,
          body: await renderMessageTemplate("TEACHER_WELCOME", {
            teacherName: teacher.fullName,
            platformLabel,
            email: teacher.email,
            password,
            loginUrl,
          }),
        });
        whatsappSent = true;
      } catch (whatsappError) {
        console.error("TEACHER WELCOME WHATSAPP ERROR =>", whatsappError);
        whatsappWarning = "تم إنشاء المعلم، لكن تعذر إرسال رسالة واتساب الترحيبية حاليًا.";
      }
    }

    return NextResponse.json({
      success: true,
      teacher,
      whatsappSent,
      whatsappWarning,
    });
  } catch (error) {
    console.error("CREATE TEACHER ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المعلم" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const teacherId = String(body.teacherId || "").trim();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const whatsapp = String(body.whatsapp || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode);

    if (!teacherId) {
      return NextResponse.json({ error: "المعلم مطلوب" }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: "اسم المعلم مطلوب" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        ...(studyMode ? { studyMode } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "المعلم غير موجود" }, { status: 404 });
    }

    const emailOwner = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (emailOwner && emailOwner.id !== teacher.id) {
      return NextResponse.json(
        { error: "هذا البريد مستخدم لمستخدم آخر" },
        { status: 400 }
      );
    }

    const updatedTeacher = await prisma.user.update({
      where: {
        id: teacher.id,
      },
      data: {
        fullName,
        email,
        whatsapp: whatsapp || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error("UPDATE TEACHER ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث بيانات المعلم" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const teacherId = String(body.teacherId || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode);

    if (!teacherId) {
      return NextResponse.json({ error: "المعلم مطلوب" }, { status: 400 });
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        ...(studyMode ? { studyMode } : {}),
      },
      select: {
        id: true,
        _count: {
          select: {
            students: true,
            circles: true,
            reports: true,
            zoomLinks: true,
            trackResources: true,
            teacherPayouts: true,
            teacherAttendances: true,
            financeAuditLogs: true,
          },
        },
        compensationRule: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "المعلم غير موجود" }, { status: 404 });
    }

    if (
      teacher._count.students > 0 ||
      teacher._count.circles > 0 ||
      teacher._count.reports > 0 ||
      teacher._count.zoomLinks > 0 ||
      teacher._count.trackResources > 0 ||
      teacher._count.teacherPayouts > 0 ||
      teacher._count.teacherAttendances > 0 ||
      teacher._count.financeAuditLogs > 0 ||
      teacher.compensationRule
    ) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف هذا المعلم نهائيا لأنه ما زال مرتبطا بطلاب أو حلقات أو تقارير أو بيانات مالية/إدارية. انقل أو احذف الارتباطات أولا ثم أعد المحاولة.",
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id: teacher.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE TEACHER ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المعلم" },
      { status: 500 }
    );
  }
}
