import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

function normalizeString(value: unknown) {
  const s = String(value ?? "").trim();
  return s || null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولًا" },
        { status: 401 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "ADMIN",
        studyMode: "ONSITE",
        isActive: true,
      },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "لا تملك صلاحية تعديل الطالب" },
        { status: 403 }
      );
    }

    const { studentId } = await context.params;
    const body = await request.json();

    const parentWhatsapp =
      body.parentWhatsapp === null ? null : normalizeString(body.parentWhatsapp);
    const parentEmail =
      body.parentEmail === null ? null : normalizeString(body.parentEmail);
    const teacherId =
      body.teacherId === null ? null : normalizeString(body.teacherId);
    const circleId = body.circleId === null ? null : normalizeString(body.circleId);

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        studyMode: "ONSITE",
      },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    if (circleId) {
      const circle = await prisma.circle.findFirst({
        where: { id: circleId, studyMode: "ONSITE" },
        select: { id: true, teacherId: true, studyMode: true },
      });
      if (!circle) {
        return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 400 });
      }
      if (!circle.teacherId) {
        return NextResponse.json(
          { error: "يجب تعيين معلم للحلقة قبل ربط الطالب بها" },
          { status: 400 }
        );
      }

      const updated = await prisma.student.update({
        where: { id: student.id },
        data: {
          ...(parentWhatsapp !== undefined ? { parentWhatsapp } : {}),
          ...(parentEmail !== undefined ? { parentEmail } : {}),
          circleId: circle.id,
          teacherId: circle.teacherId,
          studyMode: circle.studyMode,
        },
        include: {
          teacher: { select: { id: true, fullName: true, email: true } },
          circle: { select: { id: true, name: true, studyMode: true } },
        },
      });

      return NextResponse.json({ success: true, student: updated });
    }

    if (teacherId) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          studyMode: "ONSITE",
          isActive: true,
        },
        select: { id: true },
      });
      if (!teacher) {
        return NextResponse.json(
          { error: "المعلم غير موجود أو غير مفعل" },
          { status: 400 }
        );
      }
    }

    const updateData: Prisma.StudentUncheckedUpdateInput = {
      ...(parentWhatsapp !== undefined ? { parentWhatsapp } : {}),
      ...(parentEmail !== undefined ? { parentEmail } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(circleId !== undefined ? { circleId } : {}),
      studyMode: "ONSITE",
    };

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: updateData,
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        circle: { select: { id: true, name: true, studyMode: true } },
      },
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الطالب" },
      { status: 500 }
    );
  }
}
