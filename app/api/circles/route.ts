import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTeacherNotification } from "@/lib/teacher-notifications";

function normalizeStudyMode(value: unknown) {
  if (value === "REMOTE" || value === "ONSITE") return value;
  return undefined;
}

function normalizeTrack(value: unknown) {
  const track = String(value || "").trim();
  const allowedTracks = ["HIJAA", "RUBAI", "FARDI", "TILAWA", "ONSITE_ALL"];

  return allowedTracks.includes(track) ? track : null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studyMode = normalizeStudyMode(url.searchParams.get("studyMode"));
    const circles = await prisma.circle.findMany({
      where: {
        ...(studyMode ? { studyMode } : {}),
      },
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
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      circles,
    });
  } catch (error) {
    console.error("GET CIRCLES ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الحلقات" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const teacherId = String(body.teacherId || "").trim();
    const zoomUrl = String(body.zoomUrl || "").trim();
    const periodLabel = String(body.periodLabel || "").trim();
    const startsAt = String(body.startsAt || "").trim();
    const endsAt = String(body.endsAt || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode) || "REMOTE";
    const track = normalizeTrack(body.track);

    if (!name) {
      return NextResponse.json({ error: "اسم الحلقة مطلوب" }, { status: 400 });
    }

    const teacher = teacherId
      ? await prisma.user.findFirst({
          where: {
            id: teacherId,
            role: "TEACHER",
            studyMode,
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (teacherId && !teacher) {
      return NextResponse.json(
        { error: "المعلم غير موجود أو غير مفعل" },
        { status: 400 }
      );
    }

    const circle = await prisma.circle.create({
      data: {
        name,
        track,
        studyMode,
        zoomUrl: zoomUrl || null,
        periodLabel: periodLabel || null,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        teacherId: teacher?.id || null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      circle,
    });
  } catch (error) {
    console.error("CREATE CIRCLE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة الحلقة" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const circleId = String(body.circleId || "").trim();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const teacherId =
      typeof body.teacherId === "string" ? body.teacherId.trim() : undefined;
    const zoomUrl =
      typeof body.zoomUrl === "string" ? body.zoomUrl.trim() : undefined;
    const periodLabel =
      typeof body.periodLabel === "string" ? body.periodLabel.trim() : undefined;
    const startsAt =
      typeof body.startsAt === "string" ? body.startsAt.trim() : undefined;
    const endsAt =
      typeof body.endsAt === "string" ? body.endsAt.trim() : undefined;
    const track =
      body.track === null || typeof body.track === "string"
        ? normalizeTrack(body.track)
        : undefined;
    const studyMode =
      body.studyMode === "REMOTE" || body.studyMode === "ONSITE"
        ? body.studyMode
        : undefined;

    if (!circleId) {
      return NextResponse.json({ error: "الحلقة مطلوبة" }, { status: 400 });
    }

    const teacher = teacherId
      ? await prisma.user.findFirst({
          where: {
            id: teacherId,
            role: "TEACHER",
            ...(studyMode ? { studyMode } : {}),
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (teacherId && !teacher) {
      return NextResponse.json(
        { error: "المعلم غير موجود أو غير مفعل" },
        { status: 400 }
      );
    }

    const existingCircle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        ...(studyMode ? { studyMode } : {}),
      },
      select: {
        id: true,
        name: true,
        studyMode: true,
        teacherId: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!existingCircle) {
      return NextResponse.json({ error: "الحلقة غير موجودة في هذا القسم" }, { status: 404 });
    }

    const circle = await prisma.circle.update({
      where: {
        id: existingCircle.id,
      },
      data: {
        ...(name ? { name } : {}),
        ...(track !== undefined ? { track } : {}),
        ...(teacherId !== undefined ? { teacherId: teacher?.id || null } : {}),
        ...(zoomUrl !== undefined ? { zoomUrl: zoomUrl || null } : {}),
        ...(periodLabel !== undefined ? { periodLabel: periodLabel || null } : {}),
        ...(startsAt !== undefined ? { startsAt: startsAt || null } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt || null } : {}),
      },
    });

    if (teacher?.id) {
      await prisma.student.updateMany({
        where: {
          circleId: existingCircle.id,
        },
        data: {
          teacherId: teacher.id,
          studyMode: circle.studyMode,
        },
      });

      if (teacher.id !== existingCircle.teacherId && existingCircle._count.students > 0) {
        await createTeacherNotification({
          userId: teacher.id,
          type: "STUDENT_MOVED",
          title: `تم إسناد حلقة ${existingCircle.name} لك`,
          body: `تم ربطك بحلقة ${existingCircle.name} وبها ${existingCircle._count.students} طالب/طلاب. يمكنك مراجعة تفاصيلهم من لوحة المعلم.`,
          link: "/remote/teacher/dashboard",
        });
      }
    }

    return NextResponse.json({
      success: true,
      circle,
    });
  } catch (error) {
    console.error("UPDATE CIRCLE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الحلقة" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const circleId = String(body.circleId || "").trim();
    const studyMode = normalizeStudyMode(body.studyMode);

    if (!circleId) {
      return NextResponse.json({ error: "الحلقة مطلوبة" }, { status: 400 });
    }

    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        ...(studyMode ? { studyMode } : {}),
      },
      select: {
        id: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!circle) {
      return NextResponse.json({ error: "الحلقة غير موجودة" }, { status: 404 });
    }

    if (circle._count.students > 0) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف هذه الحلقة لأنها تحتوي على طلاب. انقل الطلاب إلى حلقة أخرى أولا.",
        },
        { status: 400 }
      );
    }

    await prisma.circle.delete({
      where: {
        id: circle.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE CIRCLE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الحلقة" },
      { status: 500 }
    );
  }
}
