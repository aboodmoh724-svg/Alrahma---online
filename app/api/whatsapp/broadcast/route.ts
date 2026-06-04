import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  sendWhatsAppText,
  type WhatsAppChannel,
} from "@/lib/whatsapp";

type RecipientType =
  | "ALL_PARENTS"
  | "ALL_REGISTERED_PARENTS"
  | "ALL_UNREGISTERED_PARENTS"
  | "ALL_TEACHERS"
  | "SELECTED_PARENTS"
  | "SELECTED_TEACHERS";

type BroadcastRecipient = {
  phone: string;
  recipientName: string;
};

type FailedBroadcast = BroadcastRecipient & {
  error: string;
};

const BROADCAST_BATCH_SIZE = 3;

function normalizeRecipientType(value: unknown): RecipientType | null {
  if (
    value === "ALL_PARENTS" ||
    value === "ALL_REGISTERED_PARENTS" ||
    value === "ALL_UNREGISTERED_PARENTS" ||
    value === "ALL_TEACHERS" ||
    value === "SELECTED_PARENTS" ||
    value === "SELECTED_TEACHERS"
  ) {
    return value;
  }

  return null;
}

function broadcastFooter(scope: WhatsAppChannel) {
  return scope === "ONSITE"
    ? "Ø¥Ø¯Ø§Ø±Ø© ØªØ­ÙÙŠØ¸ Ø§Ù„Ø±Ø­Ù…Ø© Ù„Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…"
    : "Ø¥Ø¯Ø§Ø±Ø© Ù…Ù†ØµØ© Ø§Ù„Ø±Ø­Ù…Ø© Ù„ØªØ­ÙÙŠØ¸ Ø§Ù„Ù‚Ø±Ø¢Ù† Ø§Ù„ÙƒØ±ÙŠÙ…";
}

function withFooter(message: string, scope: WhatsAppChannel) {
  const body = message.trim();
  if (!body) {
    return "";
  }

  return body;
}

async function sendBroadcastInBatches(input: {
  recipients: BroadcastRecipient[];
  message: string;
  scope: WhatsAppChannel;
  recipientType: RecipientType;
}) {
  let sentCount = 0;
  const failed: FailedBroadcast[] = [];

  for (let index = 0; index < input.recipients.length; index += BROADCAST_BATCH_SIZE) {
    const batch = input.recipients.slice(index, index + BROADCAST_BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendWhatsAppText({
            to: recipient.phone,
            chatId: `${recipient.phone}@c.us`,
            body: input.message,
            channel: input.scope,
            source: "HUMAN_BROADCAST",
            context: {
              recipientType: input.recipientType,
            },
          });

          return { ok: true as const, recipient };
        } catch (error) {
          return {
            ok: false as const,
            recipient,
            error: error instanceof Error ? error.message : "تعذر الإرسال",
          };
        }
      })
    );

    for (const result of results) {
      if (result.ok) {
        sentCount += 1;
      } else {
        failed.push({
          phone: result.recipient.phone,
          recipientName: result.recipient.recipientName,
          error: result.error,
        });
      }
    }
  }

  return { sentCount, failed };
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Ø§Ù„Ø±Ø¬Ø§Ø¡ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ù‹Ø§" }, { status: 401 });
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
      return NextResponse.json({ error: "ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ Ø¨Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠØ©" }, { status: 403 });
    }

    const scope = admin.studyMode as WhatsAppChannel;

    if (!isWhatsAppConfigured(scope)) {
      return NextResponse.json({ error: "Ø®Ø¯Ù…Ø© ÙˆØ§ØªØ³Ø§Ø¨ ØºÙŠØ± Ù…ÙØ¹Ù„Ø© Ø­Ø§Ù„ÙŠÙ‹Ø§ Ù„Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø³Ù…" }, { status: 400 });
    }

    const body = await request.json();
    const rawMessage = String(body.message || "").trim();
    const recipientType = normalizeRecipientType(body.recipientType);
    const selectedParentIds: string[] = Array.isArray(body.selectedParentIds)
      ? body.selectedParentIds.map((value: unknown) => String(value || "").trim()).filter(Boolean)
      : [];
    const selectedTeacherIds: string[] = Array.isArray(body.selectedTeacherIds)
      ? body.selectedTeacherIds.map((value: unknown) => String(value || "").trim()).filter(Boolean)
      : [];

    if (!rawMessage) {
      return NextResponse.json({ error: "Ù†Øµ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù…Ø·Ù„ÙˆØ¨" }, { status: 400 });
    }

    if (!recipientType) {
      return NextResponse.json({ error: "Ù†ÙˆØ¹ Ø§Ù„Ø§Ø³ØªÙ‡Ø¯Ø§Ù ØºÙŠØ± ØµØ§Ù„Ø­" }, { status: 400 });
    }

    const recipients = new Map<string, { recipientName: string }>();
    const defaultCountryCode = scope === "ONSITE_SYRIA" ? "963" : "90";
    const selectedStudentIds = selectedParentIds
      .filter((id) => !id.startsWith("request:"))
      .map((id) => id.replace(/^student:/, ""));
    const selectedRequestIds = selectedParentIds
      .filter((id) => id.startsWith("request:"))
      .map((id) => id.replace(/^request:/, ""));

    if (
      recipientType === "ALL_PARENTS" ||
      recipientType === "ALL_REGISTERED_PARENTS" ||
      recipientType === "SELECTED_PARENTS"
    ) {
      const students = await prisma.student.findMany({
        where: {
          isActive: true,
          studyMode: scope,
          ...(recipientType === "SELECTED_PARENTS" ? { id: { in: selectedStudentIds } } : {}),
        },
        select: {
          fullName: true,
          parentWhatsapp: true,
        },
      });

      for (const student of students) {
        const phone = normalizeWhatsAppNumber(student.parentWhatsapp || "", defaultCountryCode);
        if (!phone || recipients.has(phone)) {
          continue;
        }

        recipients.set(phone, {
          recipientName: student.fullName,
        });
      }
    }

    if (
      scope === "ONSITE_SYRIA" &&
      (recipientType === "ALL_PARENTS" ||
        recipientType === "ALL_UNREGISTERED_PARENTS" ||
        recipientType === "SELECTED_PARENTS")
    ) {
      const requests = await prisma.registrationRequest.findMany({
        where: {
          studyMode: scope,
          createdStudentId: null,
          ...(recipientType === "SELECTED_PARENTS" ? { id: { in: selectedRequestIds } } : {}),
        },
        select: {
          studentName: true,
          parentWhatsapp: true,
        },
      });

      for (const item of requests) {
        const phone = normalizeWhatsAppNumber(item.parentWhatsapp || "", defaultCountryCode);
        if (!phone || recipients.has(phone)) {
          continue;
        }

        recipients.set(phone, {
          recipientName: item.studentName,
        });
      }
    }

    if (recipientType === "ALL_TEACHERS" || recipientType === "SELECTED_TEACHERS") {
      const teachers = await prisma.user.findMany({
        where: {
          role: "TEACHER",
          isActive: true,
          studyMode: scope,
          ...(recipientType === "SELECTED_TEACHERS" ? { id: { in: selectedTeacherIds } } : {}),
        },
        select: {
          fullName: true,
          whatsapp: true,
        },
      });

      for (const teacher of teachers) {
        const phone = normalizeWhatsAppNumber(teacher.whatsapp || "", defaultCountryCode);
        if (!phone || recipients.has(phone)) {
          continue;
        }

        recipients.set(phone, {
          recipientName: teacher.fullName,
        });
      }
    }

    if (recipients.size === 0) {
      return NextResponse.json({ error: "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø±Ù‚Ø§Ù… ÙˆØ§ØªØ³Ø§Ø¨ ØµØ§Ù„Ø­Ø© ÙÙŠ Ø§Ù„ÙØ¦Ø© Ø§Ù„Ù…Ø­Ø¯Ø¯Ø©" }, { status: 400 });
    }

    const finalMessage = withFooter(rawMessage, scope);
    const recipientList = [...recipients.entries()].map(([phone, recipient]) => ({
      phone,
      recipientName: recipient.recipientName,
    }));
    const { sentCount, failed } = await sendBroadcastInBatches({
      recipients: recipientList,
      message: finalMessage,
      scope,
      recipientType,
    });

    return NextResponse.json({
      success: failed.length === 0,
      sentCount,
      failedCount: failed.length,
      recipientsCount: recipients.size,
      failed,
    });
  } catch (error) {
    console.error("WHATSAPP BROADCAST ERROR =>", error);

    return NextResponse.json(
      { error: "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠØ©" },
      { status: 500 }
    );
  }
}
