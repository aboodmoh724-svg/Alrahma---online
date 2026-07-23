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

const SERVICE_PORTS: Record<string, string> = {
  ONSITE_SUMMER: process.env.WHATSAPP_WEBJS_API_URL_ONSITE || "http://127.0.0.1:3334/send-message",
  ONSITE: process.env.WHATSAPP_WEBJS_API_URL_ONSITE || "http://127.0.0.1:3334/send-message",
  REMOTE: process.env.WHATSAPP_WEBJS_API_URL_REMOTE || "http://127.0.0.1:3001/send-message",
  ONSITE_SYRIA: process.env.WHATSAPP_WEBJS_API_URL_ONSITE_SYRIA || "http://127.0.0.1:3335/send-message",
};

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return new Response("غير مصرح", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "ONSITE_SUMMER";

    const targetUrl = SERVICE_PORTS[channel] || SERVICE_PORTS.ONSITE_SUMMER;
    const qrUrl = targetUrl.replace(/\/send-message$/, "/qr.png");

    const qrRes = await fetch(qrUrl, { cache: "no-store" });
    if (!qrRes.ok) {
      return new Response("QR Code غير متوفر حالياً أو البوت متصل بالفعل", { status: 404 });
    }

    const buffer = await qrRes.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GET QR CODE ERROR =>", error);
    return new Response("حدث خطأ أثناء جلب رمز QR", { status: 500 });
  }
}
