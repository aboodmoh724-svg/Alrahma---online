import { prisma } from "@/lib/prisma";
import { createTeacherNotification } from "@/lib/teacher-notifications";
import { isMessageAutomationEnabled } from "@/lib/message-automation-settings";
import type {
  StudentFollowUpActionType,
  SupervisionTaskCategory,
  SupervisionTaskSource,
  SupervisionTaskStatus,
} from "@prisma/client";

type CreateSupervisionTaskInput = {
  studentId?: string | null;
  createdById?: string | null;
  source: SupervisionTaskSource;
  category: SupervisionTaskCategory;
  title: string;
  details: string;
  triggerKey?: string | null;
};

type LogFollowUpActionInput = {
  studentId: string;
  supervisionTaskId?: string | null;
  actorId?: string | null;
  actionType: StudentFollowUpActionType;
  title: string;
  details: string;
  contactedParent?: boolean;
  contactedTeacher?: boolean;
};

export async function createSupervisionTask(input: CreateSupervisionTaskInput) {
  if (input.triggerKey) {
    const existingTask = await prisma.supervisionTask.findUnique({
      where: {
        triggerKey: input.triggerKey,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingTask && existingTask.status !== "DONE") {
      return existingTask;
    }
  }

  return prisma.supervisionTask.create({
    data: {
      studentId: input.studentId || null,
      createdById: input.createdById || null,
      source: input.source,
      category: input.category,
      title: input.title,
      details: input.details,
      triggerKey: input.triggerKey || null,
    },
  });
}

export async function logStudentFollowUpAction(input: LogFollowUpActionInput) {
  return prisma.studentFollowUpAction.create({
    data: {
      studentId: input.studentId,
      supervisionTaskId: input.supervisionTaskId || null,
      actorId: input.actorId || null,
      actionType: input.actionType,
      title: input.title,
      details: input.details,
      contactedParent: input.contactedParent || false,
      contactedTeacher: input.contactedTeacher || false,
    },
  });
}

export async function ensureAutomaticSupervisionTasks() {
  const students = await prisma.student.findMany({
    where: {
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      teacherId: true,
      reports: {
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
        select: {
          status: true,
          createdAt: true,
          lessonMemorized: true,
          lastFiveMemorized: true,
          reviewMemorized: true,
        },
      },
    },
  });

  for (const student of students) {
    if (student.reports.length < 3) continue;

    const threeLatest = student.reports;
    const allAbsent = threeLatest.every((report) => report.status === "ABSENT");
    const allNotMemorized = threeLatest.every(
      (report) =>
        report.status === "PRESENT" &&
        (report.lessonMemorized === false ||
          report.lastFiveMemorized === false ||
          report.reviewMemorized === false)
    );

    if (allAbsent) {
      await createSupervisionTask({
        studentId: student.id,
        source: "AUTOMATIC",
        category: "ABSENCE_STREAK",
        title: `غياب متكرر: ${student.fullName}`,
        details: "الطالب غاب 3 حصص متتالية، ويحتاج متابعة إشرافية وتواصلًا مع ولي الأمر.",
        triggerKey: `absence-streak:${student.id}`,
      });
    }

    if (allNotMemorized) {
      await createSupervisionTask({
        studentId: student.id,
        source: "AUTOMATIC",
        category: "MEMORIZATION_STREAK",
        title: `تعثر متكرر: ${student.fullName}`,
        details:
          "الطالب لم يحقق الحفظ المطلوب خلال 3 حصص متتالية في أحد محاور المتابعة، ويحتاج خطة متابعة إشرافية.",
        triggerKey: `memorization-streak:${student.id}`,
      });
    }
  }
}

export async function updateSupervisionTaskStatus(params: {
  taskId: string;
  actorId?: string | null;
  status: SupervisionTaskStatus;
  actionTitle: string;
  actionDetails: string;
  actionType: StudentFollowUpActionType;
  contactedParent?: boolean;
  contactedTeacher?: boolean;
}) {
  const task = await prisma.supervisionTask.findUnique({
    where: { id: params.taskId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          teacherId: true,
        },
      },
    },
  });

  if (!task) {
    return null;
  }

  const updatedTask = await prisma.supervisionTask.update({
    where: {
      id: task.id,
    },
    data: {
      status: params.status,
      closedAt: params.status === "DONE" ? new Date() : null,
    },
  });

  if (task.studentId) {
    await logStudentFollowUpAction({
      studentId: task.studentId,
      supervisionTaskId: task.id,
      actorId: params.actorId || null,
      actionType: params.actionType,
      title: params.actionTitle,
      details: params.actionDetails,
      contactedParent: params.contactedParent,
      contactedTeacher: params.contactedTeacher,
    });
  }

  if (
    task.student?.teacherId &&
    (await isMessageAutomationEnabled("SUPERVISION_ACTION_NOTIFICATION"))
  ) {
    await createTeacherNotification({
      userId: task.student.teacherId,
      title: `متابعة إشرافية للطالب ${task.student.fullName}`,
      body: `${params.actionTitle}. ${params.actionDetails}`,
      type: "GENERAL",
      link: "/remote/teacher/requests",
    });
  }

  return updatedTask;
}
