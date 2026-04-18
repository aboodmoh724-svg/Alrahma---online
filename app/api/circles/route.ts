import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeStudyMode(value: unknown) {
  return value === "ONSITE" ? "ONSITE" : "REMOTE";
}

function normalizeTrack(value: unknown) {
  const track = String(value || "").trim();
  const allowedTracks = ["HIJAA", "RUBAI", "FARDI", "TILAWA"];

  return allowedTracks.includes(track) ? track : null;
}

export async function GET() {
  try {
    const circles = await prisma.circle.findMany({
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
    const studyMode = normalizeStudyMode(body.studyMode);
    const track = normalizeTrack(body.track);

    if (!name) {
      return NextResponse.json({ error: "اسم الحلقة مطلوب" }, { status: 400 });
    }

    const teacher = teacherId
      ? await prisma.user.findFirst({
          where: {
            id: teacherId,
            role: "TEACHER",
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

    const circle = await prisma.circle.update({
      where: {
        id: circleId,
      },
      data: {
        ...(name ? { name } : {}),
        ...(track !== undefined ? { track } : {}),
        ...(studyMode ? { studyMode } : {}),
        ...(teacherId !== undefined ? { teacherId: teacher?.id || null } : {}),
        ...(zoomUrl !== undefined ? { zoomUrl: zoomUrl || null } : {}),
      },
    });

    if (teacher?.id) {
      await prisma.student.updateMany({
        where: {
          circleId,
        },
        data: {
          teacherId: teacher.id,
          studyMode: circle.studyMode,
        },
      });
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
