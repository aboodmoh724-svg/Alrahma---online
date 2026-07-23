import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { studentId, dateKey, reason } = await req.json();

    if (!studentId || !dateKey) {
      return NextResponse.json({ error: "بيانات الطالب والتاريخ مطلوبة" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, isActive: true, studyMode: "ONSITE_SUMMER" },
      select: { id: true, fullName: true },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, isActive: true },
      select: { id: true, fullName: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "المعلم غير موجود" }, { status: 404 });
    }

    // Upsert TeacherRequest
    const existing = await prisma.teacherRequest.findFirst({
      where: {
        teacherId,
        studentId,
        subject: `طلب تعديل تقرير بتاريخ ${dateKey}`,
        status: { in: ["NEW", "IN_REVIEW"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "تم إرسال طلب التعديل سابقاً وهو قيد مراجعة الإدارة ✅",
        request: existing,
      });
    }

    const request = await prisma.teacherRequest.create({
      data: {
        teacherId,
        studentId,
        type: "GENERAL",
        priority: "HIGH",
        target: "ADMIN",
        status: "NEW",
        subject: `طلب تعديل تقرير بتاريخ ${dateKey}`,
        details: `طلب المعلم (${teacher.fullName}) إذن تعديل تقرير الطالب (${student.fullName}) بتاريخ ${dateKey}. السبب: ${reason || "تعديل تفاصيل التقرير اليومي"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم إرسال طلب التعديل للإدارة بنجاح ✅",
      request,
    });
  } catch (error) {
    console.error("TEACHER REQUEST EDIT ERROR =>", error);
    return NextResponse.json({ error: "فشل إرسال طلب التعديل" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    if (!teacherId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const dateKey = searchParams.get("dateKey");

    if (!studentId || !dateKey) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await prisma.teacherRequest.findMany({
      where: {
        teacherId,
        studentId,
        subject: `طلب تعديل تقرير بتاريخ ${dateKey}`,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("GET TEACHER EDIT REQUESTS ERROR =>", error);
    return NextResponse.json({ requests: [] });
  }
}
