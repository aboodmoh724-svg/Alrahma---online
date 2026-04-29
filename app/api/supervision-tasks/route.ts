import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type {
  StudentFollowUpActionType,
  SupervisionTaskCategory,
  SupervisionTaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSupervisionTask,
  ensureAutomaticSupervisionTasks,
  updateSupervisionTaskStatus,
} from "@/lib/supervision";

const ALLOWED_STATUSES: SupervisionTaskStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "WAITING",
  "DONE",
];

const ALLOWED_CATEGORIES: SupervisionTaskCategory[] = [
  "MEMORIZATION_STREAK",
  "ABSENCE_STREAK",
  "TEACHER_REQUEST",
  "TEACHER_VISIT",
  "GENERAL_SUPERVISION",
];

const ALLOWED_ACTION_TYPES: StudentFollowUpActionType[] = [
  "SUPERVISION_NOTE",
  "PARENT_CONTACT",
  "TEACHER_CONTACT",
  "CLASS_VISIT",
  "TEACHER_VISIT",
  "GENERAL_ACTION",
];

function normalizeStatus(value: unknown): SupervisionTaskStatus | null {
  return ALLOWED_STATUSES.includes(value as SupervisionTaskStatus)
    ? (value as SupervisionTaskStatus)
    : null;
}

function normalizeCategory(value: unknown): SupervisionTaskCategory {
  return ALLOWED_CATEGORIES.includes(value as SupervisionTaskCategory)
    ? (value as SupervisionTaskCategory)
    : "GENERAL_SUPERVISION";
}

function normalizeActionType(value: unknown): StudentFollowUpActionType {
  return ALLOWED_ACTION_TYPES.includes(value as StudentFollowUpActionType)
    ? (value as StudentFollowUpActionType)
    : "GENERAL_ACTION";
}

async function getCurrentSupervisor() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
      canAccessSupervision: true,
    },
    select: {
      id: true,
    },
  });
}

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
      canAccessFinance: true,
    },
    select: {
      id: true,
    },
  });
}

export async function GET(req: Request) {
  try {
    const [supervisor, admin] = await Promise.all([
      getCurrentSupervisor(),
      getCurrentRemoteAdmin(),
    ]);

    if (!supervisor && !admin) {
      return NextResponse.json({ error: "غير مصرح لك بعرض المهام الإشرافية" }, { status: 403 });
    }

    await ensureAutomaticSupervisionTasks();

    const url = new URL(req.url);
    const status = normalizeStatus(url.searchParams.get("status"));
    const source = url.searchParams.get("source");

    const tasks = await prisma.supervisionTask.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(source === "AUTOMATIC" || source === "TEACHER" || source === "ADMIN"
          ? { source }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentCode: true,
            teacher: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        actions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("GET SUPERVISION TASKS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المهام الإشرافية" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getCurrentRemoteAdmin();

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بإضافة مهمة إشرافية" }, { status: 403 });
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    const category = normalizeCategory(body.category);

    if (!title || !details) {
      return NextResponse.json({ error: "عنوان المهمة وتفاصيلها مطلوبان" }, { status: 400 });
    }

    const task = await createSupervisionTask({
      studentId: studentId || null,
      createdById: admin.id,
      source: "ADMIN",
      category,
      title,
      details,
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("CREATE SUPERVISION TASK ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المهمة الإشرافية" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const supervisor = await getCurrentSupervisor();

    if (!supervisor) {
      return NextResponse.json({ error: "غير مصرح لك بتحديث المهمة الإشرافية" }, { status: 403 });
    }

    const body = await req.json();
    const taskId = String(body.taskId || "").trim();
    const status = normalizeStatus(body.status);
    const actionTitle = String(body.actionTitle || "").trim();
    const actionDetails = String(body.actionDetails || "").trim();
    const actionType = normalizeActionType(body.actionType);

    if (!taskId || !status || !actionTitle || !actionDetails) {
      return NextResponse.json({ error: "بيانات تحديث المهمة غير مكتملة" }, { status: 400 });
    }

    const task = await updateSupervisionTaskStatus({
      taskId,
      actorId: supervisor.id,
      status,
      actionTitle,
      actionDetails,
      actionType,
      contactedParent: body.contactedParent === true,
      contactedTeacher: body.contactedTeacher === true,
    });

    if (!task) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("UPDATE SUPERVISION TASK ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المهمة الإشرافية" },
      { status: 500 }
    );
  }
}
