import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type {
  TeacherRequestPriority,
  TeacherRequestStatus,
  TeacherRequestType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTeacherNotification } from "@/lib/teacher-notifications";
import { isMessageAutomationEnabled } from "@/lib/message-automation-settings";
import { createSupervisionTask, logStudentFollowUpAction } from "@/lib/supervision";

const ALLOWED_REQUEST_TYPES: TeacherRequestType[] = [
  "TEST_REQUEST",
  "STRUGGLING_STUDENT",
  "SPECIAL_CASE",
  "GENERAL",
];

const ALLOWED_REQUEST_PRIORITIES: TeacherRequestPriority[] = [
  "NORMAL",
  "HIGH",
  "URGENT",
];

const ALLOWED_REQUEST_STATUSES: TeacherRequestStatus[] = [
  "NEW",
  "IN_REVIEW",
  "RESOLVED",
  "REJECTED",
];

function normalizeRequestType(value: unknown): TeacherRequestType {
  return ALLOWED_REQUEST_TYPES.includes(value as TeacherRequestType)
    ? (value as TeacherRequestType)
    : "GENERAL";
}

function normalizeRequestPriority(value: unknown): TeacherRequestPriority {
  return ALLOWED_REQUEST_PRIORITIES.includes(value as TeacherRequestPriority)
    ? (value as TeacherRequestPriority)
    : "NORMAL";
}

function normalizeRequestStatus(value: unknown): TeacherRequestStatus | null {
  return ALLOWED_REQUEST_STATUSES.includes(value as TeacherRequestStatus)
    ? (value as TeacherRequestStatus)
    : null;
}

async function getCurrentRemoteUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: userId,
      studyMode: "REMOTE",
      isActive: true,
      role: {
        in: ["ADMIN", "TEACHER"],
      },
    },
    select: {
      id: true,
      role: true,
      fullName: true,
    },
  });
}

function requestIncludes() {
  return {
    teacher: {
      select: {
        id: true,
        fullName: true,
      },
    },
    student: {
      select: {
        id: true,
        fullName: true,
        studentCode: true,
      },
    },
    reviewer: {
      select: {
        id: true,
        fullName: true,
      },
    },
  } as const;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentRemoteUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك بعرض الطلبات" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = normalizeRequestStatus(url.searchParams.get("status"));

    const requests = await prisma.teacherRequest.findMany({
      where: {
        ...(user.role === "TEACHER" ? { teacherId: user.id } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [
        { createdAt: "desc" },
        { updatedAt: "desc" },
      ],
      include: requestIncludes(),
    });

    if (user.role === "ADMIN") {
      const readReceipts = await prisma.userNotification.findMany({
        where: {
          type: "REQUEST_UPDATED",
          link: {
            in: requests.map((request) => `/remote/teacher/requests?requestId=${request.id}`),
          },
        },
        select: {
          link: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      const receiptByRequestId = new Map<string, (typeof readReceipts)[number]>();

      for (const receipt of readReceipts) {
        const requestId = receipt.link?.replace("/remote/teacher/requests?requestId=", "") || "";

        if (requestId && !receiptByRequestId.has(requestId)) {
          receiptByRequestId.set(requestId, receipt);
        }
      }

      return NextResponse.json({
        success: true,
        requests: requests.map((request) => {
          const receipt = receiptByRequestId.get(request.id);

          return {
            ...request,
            teacherNotificationReadAt: receipt?.isRead ? receipt.readAt : null,
            teacherNotificationSentAt: receipt?.createdAt || null,
          };
        }),
      });
    }

    const students = await prisma.student.findMany({
      where: {
        teacherId: user.id,
        studyMode: "REMOTE",
        isActive: true,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
        studentCode: true,
      },
    });

    return NextResponse.json({
      success: true,
      requests,
      students,
    });
  } catch (error) {
    console.error("GET TEACHER REQUESTS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب طلبات المعلم" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentRemoteUser();

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "غير مصرح لك بإضافة طلب" }, { status: 403 });
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();
    const subject = String(body.subject || "").trim();
    const details = String(body.details || "").trim();
    const type = normalizeRequestType(body.type);
    const priority = normalizeRequestPriority(body.priority);

    if (!subject) {
      return NextResponse.json({ error: "عنوان الطلب مطلوب" }, { status: 400 });
    }

    if (!details) {
      return NextResponse.json({ error: "تفاصيل الطلب مطلوبة" }, { status: 400 });
    }

    const student = studentId
      ? await prisma.student.findFirst({
          where: {
            id: studentId,
            teacherId: user.id,
            studyMode: "REMOTE",
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (studentId && !student) {
      return NextResponse.json({ error: "الطالب غير موجود ضمن طلابك" }, { status: 400 });
    }

    const request = await prisma.teacherRequest.create({
      data: {
        teacherId: user.id,
        studentId: student?.id || null,
        type,
        priority,
        subject,
        details,
      },
      include: requestIncludes(),
    });

    await createSupervisionTask({
      studentId: request.studentId,
      createdById: user.id,
      source: "TEACHER",
      category: "TEACHER_REQUEST",
      title: `طلب من المعلم: ${request.subject}`,
      details: request.details,
      triggerKey: `teacher-request:${request.id}`,
    });

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("CREATE TEACHER REQUEST ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ طلب المعلم" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentRemoteUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بتحديث الطلب" }, { status: 403 });
    }

    const body = await req.json();
    const requestId = String(body.requestId || "").trim();
    const status = normalizeRequestStatus(body.status);
    const adminNote = String(body.adminNote || "").trim();

    if (!requestId) {
      return NextResponse.json({ error: "الطلب مطلوب" }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "حالة الطلب غير صالحة" }, { status: 400 });
    }

    const existingRequest = await prisma.teacherRequest.findUnique({
      where: {
        id: requestId,
      },
      include: requestIncludes(),
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const updatedRequest = await prisma.teacherRequest.update({
      where: {
        id: existingRequest.id,
      },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedBy: user.id,
        resolvedAt: status === "RESOLVED" || status === "REJECTED" ? new Date() : null,
      },
      include: requestIncludes(),
    });

    if (updatedRequest.studentId) {
      await logStudentFollowUpAction({
        studentId: updatedRequest.studentId,
        actorId: user.id,
        actionType: "GENERAL_ACTION",
        title: `متابعة طلب معلم: ${updatedRequest.subject}`,
        details: adminNote || `تم تحديث حالة طلب المعلم إلى ${status}.`,
      });
    }

    const studentLabel = updatedRequest.student
      ? ` للطالب ${updatedRequest.student.fullName}`
      : "";

    if (await isMessageAutomationEnabled("TEACHER_REQUEST_UPDATED_NOTIFICATION")) {
      await createTeacherNotification({
        userId: updatedRequest.teacherId,
        type: "REQUEST_UPDATED",
        title: `تم تحديث طلبك${studentLabel}`,
        body: `حالة الطلب الآن: ${status}. ${adminNote ? `ملاحظة الإدارة: ${adminNote}` : "يمكنك مراجعة التفاصيل من صفحة الطلبات."}`,
        link: `/remote/teacher/requests?requestId=${updatedRequest.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("UPDATE TEACHER REQUEST ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث طلب المعلم" },
      { status: 500 }
    );
  }
}
