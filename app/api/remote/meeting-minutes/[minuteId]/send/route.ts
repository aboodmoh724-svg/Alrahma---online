import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateMeetingMinutePdf } from "@/lib/meeting-minute-pdf";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppDocument,
  sendWhatsAppText,
} from "@/lib/whatsapp";

type SendBody = {
  mode?: "text" | "pdf";
  recipientIds?: string[];
};

async function getCurrentRemoteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ minuteId: string }> }
) {
  const admin = await getCurrentRemoteAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "غير مصرح." }, { status: 401 });
  }

  if (!isWhatsAppConfigured("REMOTE")) {
    return NextResponse.json({ ok: false, error: "الواتساب غير متصل حاليًا." }, { status: 503 });
  }

  const { minuteId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as SendBody;
  const mode = body.mode === "pdf" ? "pdf" : "text";
  const recipientIds = Array.isArray(body.recipientIds)
    ? body.recipientIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];

  if (!recipientIds.length) {
    return NextResponse.json({ ok: false, error: "اختر مستلمًا واحدًا على الأقل." }, { status: 400 });
  }

  const [minute, recipients] = await Promise.all([
    prisma.meetingMinute.findFirst({
      where: {
        id: minuteId,
        studyMode: "REMOTE",
      },
    }),
    prisma.meetingMinuteRecipient.findMany({
      where: {
        id: { in: recipientIds },
        studyMode: "REMOTE",
        isActive: true,
      },
    }),
  ]);

  if (!minute) {
    return NextResponse.json({ ok: false, error: "لم يتم العثور على المحضر." }, { status: 404 });
  }

  if (!recipients.length) {
    return NextResponse.json({ ok: false, error: "لا توجد أرقام صالحة للإرسال." }, { status: 400 });
  }

  let sent = 0;
  const failed: string[] = [];

  let pdfUrl = "";
  if (mode === "pdf") {
    const pdf = await generateMeetingMinutePdf(minute);
    pdfUrl = pdf.pdfUrl;
    await prisma.meetingMinute.update({
      where: { id: minute.id },
      data: {
        htmlPath: pdf.htmlPath,
        pdfPath: pdf.pdfPath,
        pdfGeneratedAt: new Date(),
      },
    });
  }

  for (const recipient of recipients) {
    const phone = normalizeWhatsAppNumber(recipient.phone, "90");
    const label = recipient.name || recipient.phone;

    if (!phone) {
      failed.push(label);
      continue;
    }

    const chatId = `${phone}@c.us`;

    try {
      if (mode === "pdf") {
        const caption = `محضر اجتماع: ${minute.title}`;
        try {
          await sendWhatsAppDocument({
            to: phone,
            chatId,
            documentUrl: pdfUrl,
            fileName: `meeting-minute-${minute.id}.pdf`,
            caption,
            channel: "REMOTE",
          });
        } catch {
          await sendWhatsAppText({
            to: phone,
            chatId,
            body: `${caption}\n\nرابط المحضر:\n${pdfUrl}`,
            channel: "REMOTE",
            source: "MEETING_MINUTE_PDF_FALLBACK",
            context: { minuteId: minute.id, recipientName: recipient.name, sentBy: admin.id },
          });
        }
      } else {
        await sendWhatsAppText({
          to: phone,
          chatId,
          body: minute.whatsappText || `محضر اجتماع: ${minute.title}`,
          channel: "REMOTE",
          source: "MEETING_MINUTE",
          context: { minuteId: minute.id, recipientName: recipient.name, sentBy: admin.id },
        });
      }

      sent += 1;
    } catch {
      failed.push(label);
    }
  }

  return NextResponse.json({
    ok: sent > 0,
    sent,
    failed,
    message:
      failed.length > 0
        ? `تم إرسال ${sent} وتعذر إرسال ${failed.length}.`
        : `تم إرسال المحضر إلى ${sent} مستلم.`,
  });
}
