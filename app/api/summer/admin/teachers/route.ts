import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";

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

    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER", studyMode: "ONSITE_SUMMER", isActive: true },
      select: { id: true, fullName: true, email: true, createdAt: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ success: true, teachers });
  } catch (error) {
    console.error("GET SUMMER TEACHERS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب حسابات المعلمين" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, email, password } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "اسم المعلم مطلوب" }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "اسم المستخدم / البريد مطلوب" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "اسم المستخدم / البريد مستخدم بالفعل" }, { status: 400 });
    }

    const rawPassword = password && password.trim() ? password.trim() : "12345";
    const passwordHash = hashPassword(rawPassword);

    const newTeacher = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        password: passwordHash,
        role: "TEACHER",
        studyMode: "ONSITE_SUMMER",
        isActive: true,
      },
      select: { id: true, fullName: true, email: true },
    });

    return NextResponse.json({ success: true, teacher: newTeacher });
  } catch (error) {
    console.error("CREATE SUMMER TEACHER ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء حساب المعلم" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { teacherId, fullName, email, password } = body;

    if (!teacherId) {
      return NextResponse.json({ error: "معرف المعلم مطلوب" }, { status: 400 });
    }

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: "TEACHER", studyMode: "ONSITE_SUMMER" },
    });

    if (!teacher) {
      return NextResponse.json({ error: "حساب المعلم غير موجود" }, { status: 404 });
    }

    const updateData: { fullName?: string; email?: string; password?: string } = {};

    if (fullName && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Check collision
      const collision = await prisma.user.findFirst({
        where: { email: cleanEmail, NOT: { id: teacherId } },
      });
      if (collision) {
        return NextResponse.json({ error: "اسم المستخدم / البريد مستخدم لـ حساب آخر" }, { status: 400 });
      }
      updateData.email = cleanEmail;
    }

    if (password && password.trim()) {
      updateData.password = hashPassword(password.trim());
    }

    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: updateData,
      select: { id: true, fullName: true, email: true },
    });

    return NextResponse.json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    console.error("UPDATE SUMMER TEACHER ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تعديل بيانات المعلم" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const url = new URL(req.url);
    const teacherId = url.searchParams.get("id");

    if (!teacherId) {
      return NextResponse.json({ error: "معرف المعلم مطلوب" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: teacherId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE SUMMER TEACHER ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الحساب" }, { status: 500 });
  }
}
