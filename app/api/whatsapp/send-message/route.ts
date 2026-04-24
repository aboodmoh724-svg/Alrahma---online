import { NextResponse } from "next/server";
import { normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizeWhatsAppNumber(String(body.phone || ""));
    const message = String(body.message || "").trim();

    if (!phone) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صالح" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "نص الرسالة مطلوب" },
        { status: 400 }
      );
    }

    const response = await sendWhatsAppText({
      to: phone,
      body: message,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "تعذر إرسال الرسالة عبر واتساب",
      },
      { status: 500 }
    );
  }
}
