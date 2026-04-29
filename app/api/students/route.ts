import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateStudentCode } from "@/lib/student-code";
import { createTeacherNotification } from "@/lib/teacher-notifications";
import { isMessageAutomationEnabled } from "@/lib/message-automation-settings";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const circleId = url.searchParams.get("circleId") || "";
    const rawStudyMode = url.searchParams.get("studyMode") || "";
    const studyMode =
      rawStudyMode === "REMOTE" || rawStudyMode === "ONSITE" ? rawStudyMode : "";
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })
      : null;

    const students = await prisma.student.findMany({
      where:
        user?.role === "TEACHER"
          ? {
              teacherId: user.id,
              ...(circleId ? { circleId } : {}),
              ...(studyMode ? { studyMode } : {}),
              isActive: true,
            }
          : {
              ...(circleId ? { circleId } : {}),
              ...(studyMode ? { studyMode } : {}),
            },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
        parentWhatsapp: true,
        parentEmail: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            studyMode: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("GET STUDENTS ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الطلاب" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const circleId = String(body.circleId || "").trim();
    const teacherIdFromBody = String(body.teacherId || "").trim();
    const parentWhatsapp = String(body.parentWhatsapp || "").trim() || null;
    const studyMode = body.studyMode === "ONSITE" ? "ONSITE" : "REMOTE";

    if (!fullName) {
      return NextResponse.json({ error: "اسم الطالب مطلوب" }, { status: 400 });
    }

    const circle = circleId
      ? await prisma.circle.findUnique({
          where: {
            id: circleId,
          },
          select: {
            id: true,
            teacherId: true,
            studyMode: true,
          },
        })
      : null;

    if (circleId && !circle) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 400 });
    }

    if (circleId && !circle?.teacherId) {
      return NextResponse.json(
        { error: "يجب تعيين معلم للحلقة قبل إضافة الطالب إليها" },
        { status: 400 }
      );
    }

    const teacherId = circle?.teacherId || teacherIdFromBody;
    let resolvedCircleId = circle?.id || null;
    let resolvedStudyMode = circle?.studyMode || studyMode;

    if (!teacherId) {
      return NextResponse.json({ error: "المعلم مطلوب" }, { status: 400 });
    }

    if (!resolvedCircleId && teacherIdFromBody) {
      const teacherCircles = await prisma.circle.findMany({
        where: {
          teacherId: teacherIdFromBody,
          studyMode,
        },
        select: {
          id: true,
          studyMode: true,
        },
        take: 2,
      });

      if (teacherCircles.length === 1) {
        resolvedCircleId = teacherCircles[0].id;
        resolvedStudyMode = teacherCircles[0].studyMode;
      }
    }

    const studentCode = await generateStudentCode(resolvedStudyMode);

    const student = await prisma.student.create({
      data: {
        studentCode,
        fullName,
        parentWhatsapp,
        teacherId,
        circleId: resolvedCircleId,
        studyMode: resolvedStudyMode,
        isActive: true,
      },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
        parentWhatsapp: true,
        parentEmail: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        circle: {
          select: {
            id: true,
            name: true,
            studyMode: true,
          },
        },
      },
    });

    if (await isMessageAutomationEnabled("STUDENT_ASSIGNED_NOTIFICATION")) {
      await createTeacherNotification({
        userId: teacherId,
        type: "STUDENT_ASSIGNED",
        title: `تمت إضافة الطالب ${student.fullName}`,
        body: `تمت إضافة الطالب ${student.fullName}${student.studentCode ? ` برقم ${student.studentCode}` : ""}${student.circle?.name ? ` إلى حلقة ${student.circle.name}` : ""}.`,
        link: "/remote/teacher/requests",
      });
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("CREATE STUDENT ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة الطالب" },
      { status: 500 }
    );
  }
}
