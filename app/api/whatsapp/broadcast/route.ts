import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppText,
} from "@/lib/whatsapp";

type BroadcastTarget = "ALL" | "REMOTE" | "ONSITE";

function normalizeTarget(value: unknown): BroadcastTarget {
  return value === "REMOTE" || value === "ONSITE" ? value : "ALL";
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولًا" }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        studyMode: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بإرسال الرسائل الجماعية" }, { status: 403 });
    }

    if (
      !isWhatsAppConfigured("REMOTE") &&
      !isWhatsAppConfigured("ONSITE") &&
      !isWhatsAppConfigured()
    ) {
      return NextResponse.json({ error: "خدمة واتساب غير مفعلة حاليًا" }, { status: 400 });
    }

    const body = await request.json();
    const rawMessage = String(body.message || "").trim();
    const target = normalizeTarget(body.target);

    if (!rawMessage) {
      return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        ...(target === "ALL" ? {} : { studyMode: target }),
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        studyMode: true,
      },
    });

    const uniqueRecipients = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        studyMode: "REMOTE" | "ONSITE";
      }
    >();

    for (const student of students) {
      const phone = normalizeWhatsAppNumber(student.parentWhatsapp || "");

      if (!phone || uniqueRecipients.has(phone)) {
        continue;
      }

      uniqueRecipients.set(phone, {
        studentId: student.id,
        studentName: student.fullName,
        studyMode: student.studyMode,
      });
    }

    const recipients = [...uniqueRecipients.entries()];

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "لا يوجد أولياء أمور لديهم رقم واتساب صالح في الفئة المحددة" },
        { status: 400 }
      );
    }

    let sentCount = 0;
    const failed: Array<{ phone: string; studentName: string; error: string }> = [];

    for (const [phone, recipient] of recipients) {
      try {
        await sendWhatsAppText({
          to: phone,
          body: rawMessage,
          channel: recipient.studyMode,
        });
        sentCount += 1;
      } catch (error) {
        failed.push({
          phone,
          studentName: recipient.studentName,
          error: error instanceof Error ? error.message : "تعذر الإرسال",
        });
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      sentCount,
      failedCount: failed.length,
      recipientsCount: recipients.length,
      failed,
    });
  } catch (error) {
    console.error("WHATSAPP BROADCAST ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الرسالة الجماعية" },
      { status: 500 }
    );
  }
}
