import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function getTeacherId() {
  const cookieStore = await cookies();
  return cookieStore.get("alrahma_user_id")?.value || null;
}

async function findTeacherStudent(studentId: string, teacherId: string) {
  return prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      OR: [
        { teacherId },
        { studentCode: "7500" },
      ],
    },
    select: {
      id: true,
      circleId: true,
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const teacherId = await getTeacherId();
    const { studentId } = await context.params;

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولا" }, { status: 401 });
    }

    const student = await findTeacherStudent(studentId, teacherId);

    if (!student) {
      return NextResponse.json({ error: "لا يمكن الوصول إلى هذا الطالب" }, { status: 403 });
    }

    const progress = await prisma.studentTeacherProgress.findUnique({
      where: {
        studentId_teacherId: {
          studentId: student.id,
          teacherId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("GET STUDENT PROGRESS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب بداية الطالب" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateProgress(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleUpdateProgress(request, context);
}

async function handleUpdateProgress(request: Request, context: RouteContext) {
  try {
    const teacherId = await getTeacherId();
    const { studentId } = await context.params;
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولا" }, { status: 401 });
    }

    const student = await findTeacherStudent(studentId, teacherId);

    if (!student) {
      return NextResponse.json({ error: "لا يمكن الوصول إلى هذا الطالب" }, { status: 403 });
    }

    let startSurah =
      typeof body.startSurah === "string" ? body.startSurah.trim() : "";
    const startPage = optionalNumber(body.startPage);
    const startAyah = optionalNumber(body.startAyah);

    if (!startSurah && startPage) {
      startSurah = "نور البيان";
    }

    if (!startSurah) {
      return NextResponse.json({ error: "اسم السورة أو رقم صفحة البداية مطلوب" }, { status: 400 });
    }

    const progress = await prisma.studentTeacherProgress.upsert({
      where: {
        studentId_teacherId: {
          studentId: student.id,
          teacherId,
        },
      },
      create: {
        studentId: student.id,
        teacherId,
        circleId: student.circleId,
        startSurah,
        startAyah,
        startPage,
        note: typeof body.note === "string" ? body.note.trim() : null,
      },
      update: {
        circleId: student.circleId,
        startSurah,
        startAyah,
        startPage,
        note: typeof body.note === "string" ? body.note.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("UPDATE STUDENT PROGRESS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ بداية الطالب" }, { status: 500 });
  }
}
