import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, normalizeWhatsAppNumber } from "@/lib/whatsapp";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

// Service ports map
const SERVICE_PORTS: Record<string, { port: number; name: string; url: string }> = {
  ONSITE_SUMMER: {
    port: 3334,
    name: "قناة الدورة الصيفية وأفيون (Port 3334)",
    url: process.env.WHATSAPP_WEBJS_API_URL_ONSITE || "http://127.0.0.1:3334/send-message",
  },
  REMOTE: {
    port: 3001,
    name: "قناة الأونلاين (Port 3001)",
    url: process.env.WHATSAPP_WEBJS_API_URL_REMOTE || "http://127.0.0.1:3001/send-message",
  },
  ONSITE_SYRIA: {
    port: 3335,
    name: "قناة سوريا (Port 3335)",
    url: process.env.WHATSAPP_WEBJS_API_URL_ONSITE_SYRIA || "http://127.0.0.1:3335/send-message",
  },
};

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const channelsStatus: Record<string, any> = {};

    for (const [channelKey, config] of Object.entries(SERVICE_PORTS)) {
      const baseUrl = config.url.replace(/\/send-message$/, "");
      try {
        const res = await fetch(`${baseUrl}/`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          channelsStatus[channelKey] = {
            channel: channelKey,
            name: config.name,
            ready: Boolean(data.ready),
            service: data.service,
            qrAvailable: !data.ready,
            qrUrl: `/api/summer/admin/whatsapp-status/qr?channel=${channelKey}`,
          };
        } else {
          channelsStatus[channelKey] = {
            channel: channelKey,
            name: config.name,
            ready: false,
            error: `استجابة غير صحيحة من البوت (Status ${res.status})`,
          };
        }
      } catch (err) {
        channelsStatus[channelKey] = {
          channel: channelKey,
          name: config.name,
          ready: false,
          error: "تعذر الاتصال بخدمة البوت المحلية",
        };
      }
    }

    return NextResponse.json({
      success: true,
      channels: channelsStatus,
    });
  } catch (error) {
    console.error("GET WHATSAPP STATUS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء فحص حالة الواتساب" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { testPhone, testMessage, channel } = body;

    const phone = normalizeWhatsAppNumber(testPhone || "", "90");
    if (!phone) {
      return NextResponse.json({ error: "رقم الهاتف غير صحيح" }, { status: 400 });
    }

    const targetChannel = channel || "ONSITE_SUMMER";
    const text = testMessage || "تجربة إرسال رسالة من منصة الدورة الصيفية - تحفيظ الرحمة 🌟";

    const result = await sendWhatsAppText({
      to: phone,
      body: text,
      channel: targetChannel,
      source: "ADMIN_TEST",
    });

    return NextResponse.json({
      success: true,
      result,
      message: `تم إرسال تجربة بنجاح إلى الرقم ${phone}`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "فشل إرسال رسالة التجربة";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
