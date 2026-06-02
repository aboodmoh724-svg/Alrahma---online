import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeSyriaPhone } from "@/lib/phone-number";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولا" }, { status: 401 });
    }

    const { studentId } = await context.params;
    const body = await request.json();
    const parentWhatsapp = normalizeSyriaPhone(body.parentWhatsapp);

    if (!parentWhatsapp) {
      return NextResponse.json(
        { error: "أدخل رقم واتساب سوري صحيح لولي الأمر" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId,
        studyMode: "ONSITE_SYRIA",
        isActive: true,
        isTemporary: true,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "لا يمكن تعديل رقم هذا الطالب من حساب المعلم" },
        { status: 403 }
      );
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        parentWhatsapp,
        needsRegistrationCompletion: true,
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        isTemporary: true,
        needsRegistrationCompletion: true,
      },
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error("TEACHER UPDATE TEMP STUDENT PHONE ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ رقم ولي الأمر" },
      { status: 500 }
    );
  }
}
