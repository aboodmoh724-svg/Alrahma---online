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

    // Also fetch recent WhatsApp broadcast logs for Summer
    const recentLogs = await prisma.whatsAppOutgoingMessage.findMany({
      where: { channel: "ONSITE_SUMMER" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        toNumber: true,
        body: true,
        source: true,
        category: true,
        createdAt: true,
        studentId: true,
      },
    });

    return NextResponse.json({
      success: true,
      channels: channelsStatus,
      recentLogs,
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
    const {
      targetType = "CUSTOM_PHONE",
      testPhone,
      testMessage,
      circleId,
      studentIds,
    } = body;

    const messageText = String(testMessage || "").trim();
    if (!messageText) {
      return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
    }

    type TargetItem = { name: string; phone: string; type: string };
    const recipients: TargetItem[] = [];

    if (targetType === "CUSTOM_PHONE") {
      const phone = normalizeWhatsAppNumber(testPhone || "", "90");
      if (!phone) {
        return NextResponse.json({ error: "رقم الهاتف غير صحيح" }, { status: 400 });
      }
      recipients.push({ name: "رقم محدد", phone, type: "CUSTOM" });
    } else if (targetType === "ALL_PARENTS") {
      const summerStudents = await prisma.student.findMany({
        where: { studyMode: "ONSITE_SUMMER", isActive: true },
        select: { fullName: true, parentWhatsapp: true },
      });
      for (const st of summerStudents) {
        const norm = normalizeWhatsAppNumber(st.parentWhatsapp || "", "90");
        if (norm) recipients.push({ name: st.fullName, phone: norm, type: "PARENT" });
      }
    } else if (targetType === "ALL_TEACHERS") {
      const summerTeachers = await prisma.user.findMany({
        where: { studyMode: "ONSITE_SUMMER", role: "TEACHER", isActive: true },
        select: { fullName: true, whatsapp: true },
      });
      for (const t of summerTeachers) {
        const norm = normalizeWhatsAppNumber(t.whatsapp || "", "90");
        if (norm) recipients.push({ name: t.fullName, phone: norm, type: "TEACHER" });
      }
    } else if (targetType === "CIRCLE_PARENTS") {
      if (!circleId) {
        return NextResponse.json({ error: "يرجى تحديد الحلقة" }, { status: 400 });
      }
      const circleStudents = await prisma.student.findMany({
        where: { studyMode: "ONSITE_SUMMER", circleId, isActive: true },
        select: { fullName: true, parentWhatsapp: true },
      });
      for (const st of circleStudents) {
        const norm = normalizeWhatsAppNumber(st.parentWhatsapp || "", "90");
        if (norm) recipients.push({ name: st.fullName, phone: norm, type: "CIRCLE_PARENT" });
      }
    } else if (targetType === "SELECTED_STUDENTS") {
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return NextResponse.json({ error: "يرجى اختيار طالب واحد على الأقل" }, { status: 400 });
      }
      const selStudents = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { fullName: true, parentWhatsapp: true },
      });
      for (const st of selStudents) {
        const norm = normalizeWhatsAppNumber(st.parentWhatsapp || "", "90");
        if (norm) recipients.push({ name: st.fullName, phone: norm, type: "SELECTED_PARENT" });
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "لم يتم العثور على أرقام هواتف صالحة للفئة المختارة" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failCount = 0;
    const sendLogs: { name: string; phone: string; status: "SUCCESS" | "FAILED"; error?: string }[] = [];

    for (const item of recipients) {
      try {
        await sendWhatsAppText({
          to: item.phone,
          body: messageText,
          channel: "ONSITE_SUMMER",
          source: `ADMIN_BROADCAST_${targetType}`,
        });
        successCount++;
        sendLogs.push({ name: item.name, phone: item.phone, status: "SUCCESS" });
      } catch (err) {
        failCount++;
        const errStr = err instanceof Error ? err.message : "فشل الإرسال";
        sendLogs.push({ name: item.name, phone: item.phone, status: "FAILED", error: errStr });
      }

      // Small delay between broadcasts to prevent rate limit
      if (recipients.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      totalTargets: recipients.length,
      successCount,
      failCount,
      message: `تم إرسال الرسالة بنجاح إلى ${successCount} من أصل ${recipients.length}`,
      logs: sendLogs,
    });
  } catch (error) {
    console.error("POST WHATSAPP BROADCAST ERROR =>", error);
    const errorMsg = error instanceof Error ? error.message : "حدث خطأ أثناء بث الرسائل";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
