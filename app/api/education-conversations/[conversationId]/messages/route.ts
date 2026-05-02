import path from "path";
import { NextResponse } from "next/server";
import {
  cleanChatPhone,
  getCurrentRemoteAdmin,
  getCurrentTeacher,
  getParentChatPhone,
} from "@/lib/education-chat";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl, uploadToSupabaseStorage } from "@/lib/supabase-storage";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

function safeFileName(fileName: string, defaultName = "chat-file") {
  const extension = path.extname(fileName) || ".bin";
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${baseName || defaultName}-${Date.now()}${extension}`;
}

async function getAllowedConversation(conversationId: string) {
  const parentPhone = await getParentChatPhone();
  const teacher = await getCurrentTeacher();
  const admin = await getCurrentRemoteAdmin();

  const conversation = await prisma.educationConversation.findUnique({
    where: { id: conversationId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          parentWhatsapp: true,
        },
      },
      teacher: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!conversation) return null;

  if (parentPhone && conversation.parentPhone === parentPhone) {
    return { conversation, senderRole: "PARENT", senderPhone: parentPhone, senderUserId: null };
  }

  if (teacher && conversation.teacherId === teacher.id) {
    return { conversation, senderRole: "TEACHER", senderPhone: null, senderUserId: teacher.id };
  }

  if (admin) {
    return { conversation, senderRole: "ADMIN", senderPhone: null, senderUserId: admin.id };
  }

  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    const allowed = await getAllowedConversation(conversationId);

    if (!allowed) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const messages = await prisma.educationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        senderUser: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
    });

    const serializedMessages = await Promise.all(
      messages.map(async (message) => ({
        id: message.id,
        senderRole: message.senderRole,
        senderName:
          message.senderRole === "PARENT"
            ? "ولي الأمر"
            : message.senderUser?.fullName || (message.senderRole === "ADMIN" ? "الإدارة" : "المعلم"),
        body: message.body,
        attachmentUrl: await createSignedStorageUrl(message.attachmentUrl),
        attachmentName: message.attachmentName,
        attachmentType: message.attachmentType,
        createdAt: message.createdAt,
      }))
    );

    return NextResponse.json({
      conversation: {
        id: allowed.conversation.id,
        type: allowed.conversation.type,
        student: allowed.conversation.student,
        teacher: allowed.conversation.teacher,
      },
      messages: serializedMessages,
    });
  } catch (error) {
    console.error("GET EDUCATION MESSAGES ERROR =>", error);
    return NextResponse.json({ error: "تعذر تحميل الرسائل" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { conversationId } = await context.params;
    const allowed = await getAllowedConversation(conversationId);

    if (!allowed) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const formData = await request.formData();
    const body = String(formData.get("body") || "").trim();
    const attachment = formData.get("attachment");
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;

    if (attachment instanceof File && attachment.size > 0) {
      if (attachment.size > MAX_ATTACHMENT_SIZE) {
        return NextResponse.json({ error: "حجم الملف يتجاوز 10MB" }, { status: 400 });
      }

      attachmentName = attachment.name || "attachment";
      attachmentType = attachment.type || "application/octet-stream";
      attachmentUrl = await uploadToSupabaseStorage(
        attachment,
        `education-chat/${conversationId}`,
        safeFileName(attachmentName)
      );
    }

    if (!body && !attachmentUrl) {
      return NextResponse.json({ error: "اكتب رسالة أو أرفق ملفا" }, { status: 400 });
    }

    const message = await prisma.educationMessage.create({
      data: {
        conversationId,
        senderRole: allowed.senderRole,
        senderUserId: allowed.senderUserId,
        senderPhone: allowed.senderPhone,
        body: body || null,
        attachmentUrl,
        attachmentName,
        attachmentType,
      },
    });

    await prisma.educationConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
      },
    });

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error("CREATE EDUCATION MESSAGE ERROR =>", error);
    return NextResponse.json({ error: "تعذر إرسال الرسالة" }, { status: 500 });
  }
}
