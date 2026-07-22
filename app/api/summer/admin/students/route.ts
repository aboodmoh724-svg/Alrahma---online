import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStudentCode } from "@/lib/student-code";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  const admin = await prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true, studyMode: true },
  });

  return admin;
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
      include: {
        circle: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
        summerReports: {
          orderBy: { dateKey: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error("GET SUMMER STUDENTS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلاب" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, parentWhatsapp, summerGroup, circleId, teacherId } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "اسم الطالب مطلوب" }, { status: 400 });
    }

    if (!teacherId || typeof teacherId !== "string") {
      return NextResponse.json({ error: "المعلم مطلوب" }, { status: 400 });
    }

    const studentCode = await generateStudentCode("ONSITE_SUMMER");

    const student = await prisma.student.create({
      data: {
        fullName: fullName.trim(),
        studentCode,
        parentWhatsapp: typeof parentWhatsapp === "string" ? parentWhatsapp.trim() : null,
        summerGroup: summerGroup === "NOOR_AL_BAYAN" ? "NOOR_AL_BAYAN" : "QURAN",
        studyMode: "ONSITE_SUMMER",
        teacherId,
        circleId: circleId || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("CREATE SUMMER STUDENT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة الطالب" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, fullName, parentWhatsapp, summerGroup, circleId, teacherId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        fullName: typeof fullName === "string" ? fullName.trim() : undefined,
        parentWhatsapp: typeof parentWhatsapp === "string" ? parentWhatsapp.trim() : undefined,
        summerGroup: summerGroup === "NOOR_AL_BAYAN" ? "NOOR_AL_BAYAN" : "QURAN",
        circleId: circleId || null,
        teacherId: teacherId || undefined,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("UPDATE SUMMER STUDENT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تعديل بيانات الطالب" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE SUMMER STUDENT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الطالب" }, { status: 500 });
  }
}
