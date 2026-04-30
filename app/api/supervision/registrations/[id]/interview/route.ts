import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationInterviewWhatsAppMessage, sendWhatsAppText } from "@/lib/whatsapp";
import { Prisma } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "رقم الطلب غير صالح" }, { status: 400 });
    }

    const body = await request.json();
    const { interviewDate, interviewTime, zoomUrl } = body;

    if (!interviewDate || !interviewTime) {
      return NextResponse.json(
        { error: "تاريخ ووقت المقابلة مطلوبان" },
        { status: 400 }
      );
    }

    // Combine date and time for the database DateTime field (optional, since we might just store date)
    // For simplicity, we can store it as a string or a real DateTime.
    // Assuming interviewDate in schema is DateTime, we can parse it:
    const dateTimeString = `${interviewDate}T${interviewTime}:00`;
    const parsedDate = new Date(dateTimeString);

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "تنسيق التاريخ والوقت غير صالح" },
        { status: 400 }
      );
    }

    // Fetch the registration request to get the phone number and student name
    const requestItem = await prisma.registrationRequest.findUnique({
      where: { id },
    });

    if (!requestItem) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Update the database
    await prisma.registrationRequest.update({
      where: { id },
      data: {
        interviewDate: parsedDate,
        interviewLink: zoomUrl || null,
        // Optional: Update supervision status to UNDER_REVIEW or something if desired
        supervisionStatus: "UNDER_REVIEW", 
      },
    });

    // Send WhatsApp Message
    const messageBody = registrationInterviewWhatsAppMessage({
      studentName: requestItem.studentName,
      interviewDate: interviewDate,
      interviewTime: interviewTime,
      zoomUrl: zoomUrl,
    });

    try {
      await sendWhatsAppText({
        to: requestItem.parentWhatsapp,
        body: messageBody,
        // Depending on channel, but registration requests don't have a specific channel usually
      });
    } catch (waError) {
      console.error("WhatsApp sending error:", waError);
      // We still return success but notify that WhatsApp failed
      return NextResponse.json({
        success: true,
        message: "تم تحديد الموعد بنجاح، لكن حدث خطأ أثناء إرسال رسالة الواتساب.",
      });
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
