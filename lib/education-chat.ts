import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

export const PARENT_CHAT_COOKIE = "alrahma_parent_chat_phone";

export function cleanChatPhone(value: unknown) {
  return normalizeWhatsAppNumber(String(value || "")) || "";
}

export async function getParentChatPhone() {
  const cookieStore = await cookies();
  return cleanChatPhone(cookieStore.get(PARENT_CHAT_COOKIE)?.value);
}

export async function getCurrentTeacher() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

export async function getCurrentRemoteAdmin() {
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
      fullName: true,
      canAccessFinance: true,
      canAccessSupervision: true,
    },
  });
}

export function conversationInclude() {
  return {
    student: {
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        circle: { select: { name: true } },
      },
    },
    teacher: {
      select: {
        id: true,
        fullName: true,
      },
    },
    messages: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      select: {
        id: true,
        body: true,
        attachmentName: true,
        senderRole: true,
        createdAt: true,
      },
    },
  };
}

export function serializeConversation(conversation: any) {
  const lastMessage = conversation.messages?.[0] || null;

  return {
    id: conversation.id,
    type: conversation.type,
    status: conversation.status,
    parentPhone: conversation.parentPhone,
    student: conversation.student,
    teacher: conversation.teacher,
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    lastMessage,
  };
}
