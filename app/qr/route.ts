export const dynamic = "force-dynamic";

const SERVICE_PORTS: Record<string, string> = {
  ONSITE_SUMMER: "http://127.0.0.1:3334/send-message",
  REMOTE: "http://127.0.0.1:3001/send-message",
  ONSITE_SYRIA: "http://127.0.0.1:3335/send-message",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel") || "ONSITE_SUMMER";

    const targetUrl = SERVICE_PORTS[channel] || SERVICE_PORTS.ONSITE_SUMMER;
    const qrUrl = targetUrl.replace(/\/send-message$/, "/qr.png");

    const qrRes = await fetch(qrUrl, { cache: "no-store" });
    if (!qrRes.ok) {
      return new Response("رمز QR غير متوفر حالياً أو البوت متصل بالفعل", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
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
    console.error("GET /qr error:", error);
    return new Response("حدث خطأ أثناء جلب رمز QR", { status: 500 });
  }
}
