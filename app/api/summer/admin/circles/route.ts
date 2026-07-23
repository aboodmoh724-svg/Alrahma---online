import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const circles = await prisma.circle.findMany({
      where: { studyMode: "ONSITE_SUMMER" },
      include: {
        teacher: { select: { id: true, fullName: true } },
        students: {
          where: { isActive: true },
          select: { id: true, fullName: true, summerGroup: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", studyMode: "ONSITE_SUMMER", isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ success: true, circles, teachers });
  } catch (error) {
    console.error("GET SUMMER CIRCLES ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الحلقات" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { name, teacherId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "اسم الحلقة مطلوب" }, { status: 400 });
    }

    const circle = await prisma.circle.create({
      data: {
        name: name.trim(),
        studyMode: "ONSITE_SUMMER",
        teacherId: teacherId || null,
      },
    });

    return NextResponse.json({ success: true, circle });
  } catch (error) {
    console.error("CREATE SUMMER CIRCLE ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة الحلقة" }, { status: 500 });
  }
}
