import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  registrationInterviewWhatsAppMessage,
  sendWhatsAppText,
} from "@/lib/whatsapp";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json({ error: "رقم الطلب غير صالح" }, { status: 400 });
    }

    const body = await request.json();
    const interviewDate = String(body.interviewDate || "").trim();
    const interviewTime = String(body.interviewTime || "").trim();
    const zoomUrl = String(body.zoomUrl || "").trim();
    const customMessage = String(body.message || "").trim();

    if (!interviewDate || !interviewTime) {
      return NextResponse.json(
        { error: "تاريخ ووقت المقابلة مطلوبان" },
        { status: 400 }
      );
    }

    const dateTimeString = `${interviewDate}T${interviewTime}:00`;
    const parsedDate = new Date(dateTimeString);

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "تنسيق التاريخ والوقت غير صالح" },
        { status: 400 }
      );
    }

    const requestItem = await prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!requestItem) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (requestItem.status !== "ACCEPTED" || !requestItem.forwardedToSupervisionAt) {
      return NextResponse.json(
        { error: "لا يمكن تحديد مقابلة إلا للطلبات المحولة إلى الإشراف" },
        { status: 400 }
      );
    }

    const whatsappNumber = normalizeWhatsAppNumber(requestItem.parentWhatsapp);

    if (!whatsappNumber) {
      return NextResponse.json(
        { error: "رقم واتساب ولي الأمر غير صالح" },
        { status: 400 }
      );
    }

    if (!isWhatsAppConfigured("REMOTE")) {
      return NextResponse.json(
        { error: "إعدادات واتساب غير مفعلة لقسم الأونلاين" },
        { status: 400 }
      );
    }

    const messageBody =
      customMessage ||
      registrationInterviewWhatsAppMessage({
        studentName: requestItem.studentName,
        interviewDate,
        interviewTime,
        zoomUrl,
      });

    const noteLines = [
      requestItem.supervisionNote?.trim(),
      `موعد المقابلة/تحديد المستوى: ${interviewDate} ${interviewTime}`,
      zoomUrl ? `رابط المقابلة: ${zoomUrl}` : null,
    ].filter(Boolean);

    await prisma.registrationRequest.update({
      where: { id },
      data: {
        interviewDate: parsedDate,
        interviewLink: zoomUrl || null,
        supervisionStatus: "UNDER_REVIEW",
        supervisionNote: noteLines.join("\n"),
      },
    });

    try {
      await sendWhatsAppText({
        to: whatsappNumber,
        body: messageBody,
        channel: "REMOTE",
      });
    } catch (whatsappError) {
      console.error("SUPERVISION INTERVIEW WHATSAPP ERROR =>", whatsappError);

      return NextResponse.json(
        {
          error:
            whatsappError instanceof Error
              ? `تم حفظ الموعد، لكن تعذر إرسال واتساب: ${whatsappError.message}`
              : "تم حفظ الموعد، لكن تعذر إرسال واتساب",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديد الموعد وإرسال رسالة الواتساب بنجاح.",
    });
  } catch (error) {
    console.error("Error setting interview date:", error);
    return NextResponse.json(
      { error: "حدث خطأ داخلي أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
