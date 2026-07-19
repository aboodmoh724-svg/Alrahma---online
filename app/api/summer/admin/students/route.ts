import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Middleware checks
async function checkAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  if (!adminId) return false;
  const admin = await prisma.user.findFirst({
    where: { id: adminId, role: "ADMIN", isActive: true },
  });
  return !!admin;
}

// POST: Add new student
export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, parentWhatsapp, summerGroup, circleId, teacherId } = body;

    if (!fullName || !parentWhatsapp || !circleId || !teacherId) {
      return NextResponse.json(
        { success: false, message: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        fullName,
        parentWhatsapp,
        summerGroup,
        circleId,
        teacherId,
        studyMode: "ONSITE_SUMMER",
        isActive: true,
      },
      include: {
        circle: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
        summerReports: { take: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("ADD SUMMER STUDENT ERROR:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء إضافة الطالب" }, { status: 500 });
  }
}

// PUT: Edit student
export async function PUT(request: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "معرف الطالب مطلوب" }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, parentWhatsapp, summerGroup, circleId, teacherId } = body;

    if (!fullName || !parentWhatsapp || !circleId || !teacherId) {
      return NextResponse.json(
        { success: false, message: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        fullName,
        parentWhatsapp,
        summerGroup,
        circleId,
        teacherId,
      },
      include: {
        circle: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
        summerReports: { take: 30 },
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("EDIT SUMMER STUDENT ERROR:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء تعديل الطالب" }, { status: 500 });
  }
}

// DELETE: Delete student
export async function DELETE(request: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "معرف الطالب مطلوب" }, { status: 400 });
    }

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف الطالب بنجاح",
    });
  } catch (error) {
    console.error("DELETE SUMMER STUDENT ERROR:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء حذف الطالب" }, { status: 500 });
  }
}
