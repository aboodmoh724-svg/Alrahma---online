import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma, StudyMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTeacherNotification } from "@/lib/teacher-notifications";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

function normalizeString(value: unknown) {
  const s = String(value ?? "").trim();
  return s || null;
}

function hasOwn(object: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      studyMode: true,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول بحساب إداري أولا" },
        { status: 401 }
      );
    }

    const { studentId } = await context.params;
    const body = await request.json();
    const hasFullName = hasOwn(body, "fullName");
    const hasParentWhatsapp = hasOwn(body, "parentWhatsapp");
    const hasParentEmail = hasOwn(body, "parentEmail");
    const hasTeacherId = hasOwn(body, "teacherId");
    const hasCircleId = hasOwn(body, "circleId");

    const fullName = hasFullName ? normalizeString(body.fullName) : undefined;
    const parentWhatsapp = hasParentWhatsapp
      ? body.parentWhatsapp === null
        ? null
        : normalizeString(body.parentWhatsapp)
      : undefined;
    const parentEmail = hasParentEmail
      ? body.parentEmail === null
        ? null
        : normalizeString(body.parentEmail)
      : undefined;
    const teacherId = hasTeacherId
      ? body.teacherId === null
        ? null
        : normalizeString(body.teacherId)
      : undefined;
    const circleId = hasCircleId
      ? body.circleId === null
        ? null
        : normalizeString(body.circleId)
      : undefined;

    if (hasFullName && !fullName) {
      return NextResponse.json({ error: "اسم الطالب مطلوب" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        studyMode: admin.studyMode,
      },
      select: {
        id: true,
        fullName: true,
        studentCode: true,
        studyMode: true,
        teacherId: true,
        circle: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود في هذا القسم" }, { status: 404 });
    }

    if (hasCircleId && circleId) {
      const circle = await prisma.circle.findFirst({
        where: { id: circleId, studyMode: student.studyMode },
        select: { id: true, teacherId: true, studyMode: true },
      });

      if (!circle) {
        return NextResponse.json({ error: "الحلقة غير موجودة في هذا القسم" }, { status: 400 });
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
          ...(fullName ? { fullName } : {}),
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

      if (updated.teacher.id !== student.teacherId) {
        await createTeacherNotification({
          userId: updated.teacher.id,
          type: "STUDENT_MOVED",
          title: `تم ربط الطالب ${updated.fullName} بك`,
          body: `تم نقل الطالب ${updated.fullName}${updated.studentCode ? ` برقم ${updated.studentCode}` : ""}${updated.circle?.name ? ` إلى حلقة ${updated.circle.name}` : ""}.`,
          link: "/remote/teacher/requests",
        });
      }

      return NextResponse.json({ success: true, student: updated });
    }

    let inferredCircleId: string | null | undefined;

    if (hasTeacherId && teacherId) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          studyMode: student.studyMode,
          isActive: true,
        },
        select: { id: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "المعلم غير موجود أو غير مفعل في هذا القسم" },
          { status: 400 }
        );
      }

      const teacherCircles = await prisma.circle.findMany({
        where: {
          teacherId,
          studyMode: student.studyMode,
        },
        select: {
          id: true,
        },
        take: 2,
      });

      if (!hasCircleId && teacherCircles.length === 1) {
        inferredCircleId = teacherCircles[0].id;
      }
    }

    const updateData: Prisma.StudentUncheckedUpdateInput = {
      ...(fullName ? { fullName } : {}),
      ...(parentWhatsapp !== undefined ? { parentWhatsapp } : {}),
      ...(parentEmail !== undefined ? { parentEmail } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(hasCircleId ? { circleId } : {}),
      ...(inferredCircleId !== undefined ? { circleId: inferredCircleId } : {}),
      studyMode: student.studyMode as StudyMode,
    };

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: updateData,
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
        circle: { select: { id: true, name: true, studyMode: true } },
      },
    });

    if (
      (hasTeacherId || hasCircleId || inferredCircleId !== undefined) &&
      updated.teacher.id !== student.teacherId
    ) {
      await createTeacherNotification({
        userId: updated.teacher.id,
        type: "STUDENT_MOVED",
        title: `تم ربط الطالب ${updated.fullName} بك`,
        body: `تم تحديث إسناد الطالب ${updated.fullName}${updated.studentCode ? ` برقم ${updated.studentCode}` : ""}${updated.circle?.name ? ` داخل حلقة ${updated.circle.name}` : ""}.`,
        link: "/remote/teacher/requests",
      });
    }

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error("UPDATE STUDENT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الطالب" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول بحساب إداري أولا" },
        { status: 401 }
      );
    }

    const { studentId } = await context.params;
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        studyMode: admin.studyMode,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود في هذا القسم" }, { status: 404 });
    }

    await prisma.student.update({
      where: { id: student.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE STUDENT ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الطالب" },
      { status: 500 }
    );
  }
}
