import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function generateStudentCode() {
  const studentsCount = await prisma.student.count();

  for (let offset = 1; offset < 1000; offset += 1) {
    const code = `ST-${1000 + studentsCount + offset}`;
    const existingStudent = await prisma.student.findUnique({
      where: {
        studentCode: code,
      },
      select: {
        id: true,
      },
    });

    if (!existingStudent) {
      return code;
    }
  }

  return `ST-${Date.now()}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const circleId = url.searchParams.get("circleId") || "";
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
              isActive: true,
            }
          : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
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

    if (!teacherId) {
      return NextResponse.json({ error: "المعلم مطلوب" }, { status: 400 });
    }

    const studentCode = await generateStudentCode();

    const student = await prisma.student.create({
      data: {
        studentCode,
        fullName,
        teacherId,
        circleId: circle?.id || null,
        studyMode: circle?.studyMode || studyMode,
        isActive: true,
      },
      include: {
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
