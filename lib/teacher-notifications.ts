import { prisma } from "@/lib/prisma";
import type { UserNotificationType } from "@prisma/client";

type CreateTeacherNotificationInput = {
  userId: string;
  title: string;
  body: string;
  type?: UserNotificationType;
  link?: string | null;
};

export async function createTeacherNotification({
  userId,
  title,
  body,
  type = "GENERAL",
  link,
}: CreateTeacherNotificationInput) {
  return prisma.userNotification.create({
    data: {
      userId,
      title,
      body,
      type,
      link: link || null,
    },
  });
}

export async function markTeacherNotificationsAsRead(userId: string) {
  return prisma.userNotification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
