import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markTeacherNotificationsAsRead } from "@/lib/teacher-notifications";

async function getCurrentRemoteTeacher() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
    },
  });
}

export async function GET() {
  try {
    const teacher = await getCurrentRemoteTeacher();

    if (!teacher) {
      return NextResponse.json({ error: "غير مصرح لك بعرض الإشعارات" }, { status: 403 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where: {
          userId: teacher.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
      }),
      prisma.userNotification.count({
        where: {
          userId: teacher.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET TEACHER NOTIFICATIONS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإشعارات" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const teacher = await getCurrentRemoteTeacher();

    if (!teacher) {
      return NextResponse.json({ error: "غير مصرح لك بتحديث الإشعارات" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const notificationId = String(body.notificationId || "").trim();

    if (notificationId) {
      await prisma.userNotification.updateMany({
        where: {
          id: notificationId,
          userId: teacher.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else {
      await markTeacherNotificationsAsRead(teacher.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("UPDATE TEACHER NOTIFICATIONS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الإشعارات" },
      { status: 500 }
    );
  }
}
