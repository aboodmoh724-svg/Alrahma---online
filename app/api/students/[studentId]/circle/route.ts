import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { studentId } = await context.params;
    const body = await request.json();
    const circleId = String(body.circleId || "").trim();

    if (!circleId) {
      return NextResponse.json({ error: "الحلقة مطلوبة" }, { status: 400 });
    }

    const circle = await prisma.circle.findUnique({
      where: {
        id: circleId,
      },
      select: {
        id: true,
        teacherId: true,
        studyMode: true,
      },
    });

    if (!circle) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });
    }

    if (!circle.teacherId) {
      return NextResponse.json(
        { error: "يجب تعيين معلم للحلقة قبل نقل الطالب إليها" },
        { status: 400 }
      );
    }

    const student = await prisma.student.update({
      where: {
        id: studentId,
      },
      data: {
        circleId: circle.id,
        teacherId: circle.teacherId,
        studyMode: circle.studyMode,
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
    console.error("TRANSFER STUDENT CIRCLE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء نقل الطالب إلى الحلقة" },
      { status: 500 }
    );
  }
}
