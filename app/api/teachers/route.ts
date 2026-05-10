import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl } from "@/lib/app-url";
import { isMessageAutomationEnabled } from "@/lib/message-automation-settings";
import { renderMessageTemplate } from "@/lib/message-templates";
import { hashPassword } from "@/lib/passwords";
import { normalizePhoneDigits } from "@/lib/phone-number";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppText,
} from "@/lib/whatsapp";

function normalizeStudyMode(value: unknown) {
  return value === "REMOTE" || value === "ONSITE" ? value : undefined;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
    },
    select: {
      id: true,
      role: true,
      studyMode: true,
    },
  });
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولًا" }, { status: 401 });
    }

    const url = new URL(req.url);
    const studyMode = normalizeStudyMode(url.searchParams.get("studyMode"));
    const effectiveStudyMode = studyMode || user.studyMode;

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        studyMode: effectiveStudyMode,
        ...(user.role === "TEACHER" ? { id: user.id } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
        teacherCertification: true,
        teacherAvailableTimes: true,
        teacherAvailableTracks: true,
        teacherWorkScope: true,
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
      { error: "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¬Ù„Ø¨ Ø§Ù„Ù…Ø¹Ù„Ù…ÙŠÙ†" },
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
    const whatsapp = normalizePhoneDigits(body.whatsapp);
    const teacherCertification = String(body.teacherCertification || "").trim();
    const teacherAvailableTimes = String(body.teacherAvailableTimes || "").trim();
    const teacherAvailableTracks = String(body.teacherAvailableTracks || "").trim();
    const teacherWorkScope = String(body.teacherWorkScope || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode);

    if (!fullName) {
      return NextResponse.json({ error: "Ø§Ø³Ù… Ø§Ù„Ù…Ø¹Ù„Ù… Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø·Ù„ÙˆØ¨Ø©" }, { status: 400 });
    }

    if (!studyMode) {
      return NextResponse.json({ error: "Ù†ÙˆØ¹ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ØºÙŠØ± ØµØ§Ù„Ø­" }, { status: 400 });
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
        { error: "Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø³Ø¨Ù‚Ù‹Ø§" },
        { status: 400 }
      );
    }

    const teacher = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashPassword(password),
        whatsapp: whatsapp || null,
        teacherCertification: teacherCertification || null,
        teacherAvailableTimes: teacherAvailableTimes || null,
        teacherAvailableTracks: teacherAvailableTracks || null,
        teacherWorkScope: teacherWorkScope || null,
        role: "TEACHER",
        studyMode,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
        teacherCertification: true,
        teacherAvailableTimes: true,
        teacherAvailableTracks: true,
        teacherWorkScope: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
      },
    });

    let whatsappSent = false;
    let whatsappWarning: string | null = null;
    const normalizedWhatsapp = normalizeWhatsAppNumber(whatsapp);

    if (
      normalizedWhatsapp &&
      isWhatsAppConfigured() &&
      (await isMessageAutomationEnabled("TEACHER_WELCOME_WHATSAPP"))
    ) {
      try {
        const platformLabel = studyMode === "REMOTE" ? "Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø¹Ù† Ø¨Ø¹Ø¯" : "Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø­Ø¶ÙˆØ±ÙŠ";
        const loginUrl =
          studyMode === "REMOTE"
            ? appUrl("/remote/teacher/login")
            : appUrl("/onsite/teacher/login");

        await sendWhatsAppText({
          to: normalizedWhatsapp,
          body: await renderMessageTemplate("TEACHER_WELCOME", {
            teacherName: teacher.fullName,
            platformLabel,
            email: teacher.email,
            password,
            loginUrl,
          }),
          channel: studyMode,
        });
        whatsappSent = true;
      } catch (whatsappError) {
        console.error("TEACHER WELCOME WHATSAPP ERROR =>", whatsappError);
        whatsappWarning = "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø¹Ù„Ù…ØŒ Ù„ÙƒÙ† ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„ØªØ±Ø­ÙŠØ¨ÙŠØ© Ø­Ø§Ù„ÙŠÙ‹Ø§.";
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
      { error: "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø¹Ù„Ù…" },
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
    const whatsapp = normalizePhoneDigits(body.whatsapp);
    const teacherCertification = String(body.teacherCertification || "").trim();
    const teacherAvailableTimes = String(body.teacherAvailableTimes || "").trim();
    const teacherAvailableTracks = String(body.teacherAvailableTracks || "").trim();
    const teacherWorkScope = String(body.teacherWorkScope || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode);

    if (!teacherId) {
      return NextResponse.json({ error: "Ø§Ù„Ù…Ø¹Ù„Ù… Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ error: "Ø§Ø³Ù… Ø§Ù„Ù…Ø¹Ù„Ù… Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
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
      return NextResponse.json({ error: "Ø§Ù„Ù…Ø¹Ù„Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
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
        { error: "Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù…Ø³ØªØ®Ø¯Ù… Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¢Ø®Ø±" },
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
        teacherCertification: teacherCertification || null,
        teacherAvailableTimes: teacherAvailableTimes || null,
        teacherAvailableTracks: teacherAvailableTracks || null,
        teacherWorkScope: teacherWorkScope || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
        teacherCertification: true,
        teacherAvailableTimes: true,
        teacherAvailableTracks: true,
        teacherWorkScope: true,
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
      { error: "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù…" },
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
      return NextResponse.json({ error: "Ø§Ù„Ù…Ø¹Ù„Ù… Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
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
        circles: {
          select: {
            id: true,
            _count: {
              select: {
                students: true,
              },
            },
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
      return NextResponse.json({ error: "Ø§Ù„Ù…Ø¹Ù„Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯" }, { status: 404 });
    }

    const [activeStudentsCount, circlesWithActiveStudents] = await Promise.all([
      prisma.student.count({
        where: {
          teacherId: teacher.id,
          isActive: true,
          ...(studyMode ? { studyMode } : {}),
        },
      }),
      prisma.circle.findMany({
        where: {
          teacherId: teacher.id,
          ...(studyMode ? { studyMode } : {}),
          students: {
            some: {
              isActive: true,
            },
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    const blockers = [
      activeStudentsCount > 0 ? `${activeStudentsCount} طالب نشط` : "",
      circlesWithActiveStudents.length > 0
        ? `${circlesWithActiveStudents.length} حلقة بها طلاب نشطون`
        : "",
      teacher._count.financeAuditLogs > 0
        ? `${teacher._count.financeAuditLogs} سجل تدقيق مالي`
        : "",
      teacher._count.teacherPayouts > 0 ? `${teacher._count.teacherPayouts} سجل صرف مالي` : "",
      teacher.compensationRule ? "قاعدة مستحقات مالية" : "",
    ].filter(Boolean);

    if (blockers.length > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف هذا المعلم حاليًا لوجود ارتباطات فعلية: ${blockers.join("، ")}. الحلقات الفارغة والتقارير القديمة لا تمنع الحذف وسيتم فك ربطها تلقائيًا.`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.educationConversation.updateMany({
        where: {
          teacherId: teacher.id,
        },
        data: {
          teacherId: null,
        },
      });

      await tx.educationMessage.updateMany({
        where: {
          senderUserId: teacher.id,
        },
        data: {
          senderUserId: null,
        },
      });

      await tx.teacherRequest.updateMany({
        where: {
          reviewedBy: teacher.id,
        },
        data: {
          reviewedBy: null,
        },
      });

      await tx.supervisionTask.updateMany({
        where: {
          createdById: teacher.id,
        },
        data: {
          createdById: null,
        },
      });

      await tx.studentFollowUpAction.updateMany({
        where: {
          actorId: teacher.id,
        },
        data: {
          actorId: null,
        },
      });

      await tx.teacherVisitReport.deleteMany({
        where: {
          OR: [{ teacherId: teacher.id }, { supervisorId: teacher.id }],
        },
      });

      await tx.teacherRequest.deleteMany({
        where: {
          teacherId: teacher.id,
        },
      });

      await tx.userNotification.deleteMany({
        where: {
          userId: teacher.id,
        },
      });

      await tx.teacherAttendance.deleteMany({
        where: {
          teacherId: teacher.id,
        },
      });

      await tx.circle.updateMany({
        where: {
          teacherId: teacher.id,
        },
        data: {
          teacherId: null,
        },
      });

      await tx.zoomLink.updateMany({
        where: {
          userId: teacher.id,
        },
        data: {
          userId: null,
        },
      });

      await tx.trackResource.updateMany({
        where: {
          teacherId: teacher.id,
        },
        data: {
          teacherId: null,
        },
      });

      await tx.report.updateMany({
        where: {
          teacherId: teacher.id,
        },
        data: {
          teacherId: null,
        },
      });

      await tx.user.delete({
        where: {
          id: teacher.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE TEACHER ERROR =>", error);

    return NextResponse.json(
      { error: "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„Ù…Ø¹Ù„Ù…" },
      { status: 500 }
    );
  }
}
