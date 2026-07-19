import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  if (!adminId) return false;
  const admin = await prisma.user.findFirst({
    where: { id: adminId, role: "ADMIN", studyMode: "ONSITE_SUMMER", isActive: true },
  });
  return !!admin;
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name, teacherId } = body;

    if (!name || !teacherId) {
      return NextResponse.json(
        { success: false, message: "اسم الحلقة والمعلم مطلوبان" },
        { status: 400 }
      );
    }

    const circle = await prisma.circle.create({
      data: {
        name,
        teacherId,
        studyMode: "ONSITE_SUMMER",
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      circle,
    });
  } catch (error) {
    console.error("ADD SUMMER CIRCLE ERROR:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء إضافة الحلقة" }, { status: 500 });
  }
}
