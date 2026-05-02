import { NextResponse } from "next/server";
import { cleanChatPhone } from "@/lib/education-chat";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = cleanChatPhone(body.phone);

    if (!phone) {
      return NextResponse.json({ error: "رقم ولي الأمر غير صالح" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        studyMode: "REMOTE",
        isActive: true,
        parentWhatsapp: { not: null },
      },
      select: {
        parentWhatsapp: true,
      },
    });

    const exists = students.some((student) => cleanChatPhone(student.parentWhatsapp) === phone);
    if (!exists) {
      return NextResponse.json(
        { error: "لا يوجد طالب نشط مرتبط بهذا الرقم في قسم الأونلاين" },
        { status: 404 }
      );
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.parentPortalCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendWhatsAppText({
      to: phone,
      channel: "REMOTE",
      body: `رمز الدخول إلى مراسلات التعليم في منصة الرحمة: ${code}\n\nالرمز صالح لمدة 10 دقائق.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PARENT CHAT REQUEST CODE ERROR =>", error);
    return NextResponse.json({ error: "تعذر إرسال رمز الدخول" }, { status: 500 });
  }
}
