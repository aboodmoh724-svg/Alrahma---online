import { NextResponse } from "next/server";
import {
  cleanChatPhone,
  conversationInclude,
  getCurrentRemoteAdmin,
  getCurrentTeacher,
  getParentChatPhone,
  serializeConversation,
} from "@/lib/education-chat";
import { prisma } from "@/lib/prisma";

async function parentStudents(parentPhone: string) {
  const students = await prisma.student.findMany({
    where: {
      studyMode: "REMOTE",
      isActive: true,
      parentWhatsapp: { not: null },
    },
    include: {
      teacher: {
        select: {
          id: true,
          fullName: true,
        },
      },
      circle: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return students.filter((student) => cleanChatPhone(student.parentWhatsapp) === parentPhone);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");
    const parentPhone = await getParentChatPhone();
    const teacher = await getCurrentTeacher();
    const admin = await getCurrentRemoteAdmin();

    if (parentPhone) {
      const students = await parentStudents(parentPhone);
      const teacherOptions = Array.from(
        new Map(
          students.map((student) => [
            student.teacher.id,
            {
              teacherId: student.teacher.id,
              teacherName: student.teacher.fullName,
              circleName: student.circle?.name || null,
            },
          ])
        ).values()
      );

      const conversations = await prisma.educationConversation.findMany({
        where: {
          parentPhone,
        },
        include: conversationInclude(),
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      });

      return NextResponse.json({
        role: "PARENT",
        parentPhone,
        teacherOptions,
        canContactSupervision: students.length > 0,
        conversations: conversations.map(serializeConversation),
      });
    }

    if (teacher) {
      const students = await prisma.student.findMany({
        where: {
          studyMode: "REMOTE",
          isActive: true,
          teacherId: teacher.id,
          parentWhatsapp: { not: null },
        },
        select: {
          id: true,
          fullName: true,
          parentWhatsapp: true,
          circle: { select: { name: true } },
        },
        orderBy: { fullName: "asc" },
      });
      const conversations = await prisma.educationConversation.findMany({
        where: {
          teacherId: teacher.id,
        },
        include: conversationInclude(),
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      });

      return NextResponse.json({
        role: "TEACHER",
        teacher,
        studentOptions: students
          .filter((student) => cleanChatPhone(student.parentWhatsapp))
          .map((student) => ({
            studentId: student.id,
            studentName: student.fullName,
            circleName: student.circle?.name || null,
          })),
        conversations: conversations.map(serializeConversation),
      });
    }

    if (admin) {
      if (scope === "supervision") {
        const [conversations, teachers, students] = await Promise.all([
          prisma.educationConversation.findMany({
            where: {
              OR: [
                { type: "SUPERVISION" },
                { type: "SUPERVISION_TEACHER", teacherId: { not: null } },
              ],
            },
            include: conversationInclude(),
            orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
            take: 200,
          }),
          prisma.user.findMany({
            where: {
              role: "TEACHER",
              studyMode: "REMOTE",
              isActive: true,
            },
            select: {
              id: true,
              fullName: true,
            },
            orderBy: { fullName: "asc" },
          }),
          prisma.student.findMany({
            where: {
              studyMode: "REMOTE",
              isActive: true,
              parentWhatsapp: { not: null },
            },
            select: {
              id: true,
              fullName: true,
              parentWhatsapp: true,
              circle: { select: { name: true } },
            },
            orderBy: { fullName: "asc" },
          }),
        ]);

        return NextResponse.json({
          role: "SUPERVISION",
          teacherOptions: teachers.map((teacher) => ({
            teacherId: teacher.id,
            teacherName: teacher.fullName,
            circleName: null,
          })),
          studentOptions: students
            .filter((student) => cleanChatPhone(student.parentWhatsapp))
            .map((student) => ({
              studentId: student.id,
              studentName: student.fullName,
              circleName: student.circle?.name || null,
            })),
          conversations: conversations.map(serializeConversation),
        });
      }

      const conversations = await prisma.educationConversation.findMany({
        where: {
          OR: [
            { type: { not: "SUPERVISION_TEACHER" } },
            { teacherId: { not: null } },
          ],
        },
        include: conversationInclude(),
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
        take: 200,
      });

      return NextResponse.json({
        role: "ADMIN",
        conversations: conversations.map(serializeConversation),
      });
    }

    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  } catch (error) {
    console.error("GET EDUCATION CONVERSATIONS ERROR =>", error);
    return NextResponse.json({ error: "تعذر تحميل المحادثات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parentPhone = await getParentChatPhone();
    const teacher = await getCurrentTeacher();
    const admin = await getCurrentRemoteAdmin();
    const body = await request.json();
    const type = String(body.type || "TEACHER").trim() === "SUPERVISION" ? "SUPERVISION" : "TEACHER";
    const requestedType = String(body.type || "TEACHER").trim();

    if (admin && requestedType === "SUPERVISION_TEACHER") {
      const teacherId = String(body.teacherId || "").trim();
      const teacherRecord = await prisma.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          studyMode: "REMOTE",
          isActive: true,
        },
        select: { id: true },
      });

      if (!teacherRecord) {
        return NextResponse.json({ error: "تعذر فتح محادثة لهذا المعلم" }, { status: 400 });
      }

      const existing = await prisma.educationConversation.findFirst({
        where: {
          teacherId: teacherRecord.id,
          type: "SUPERVISION_TEACHER",
        },
      });

      const conversation =
        existing ||
        (await prisma.educationConversation.create({
          data: {
            teacherId: teacherRecord.id,
            parentPhone: null,
            studentId: null,
            type: "SUPERVISION_TEACHER",
          },
        }));

      return NextResponse.json({ success: true, conversationId: conversation.id });
    }

    if (admin && requestedType === "SUPERVISION") {
      const studentId = String(body.studentId || "").trim();
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          studyMode: "REMOTE",
          isActive: true,
          parentWhatsapp: { not: null },
        },
        select: {
          id: true,
          parentWhatsapp: true,
        },
      });

      const parentPhone = cleanChatPhone(student?.parentWhatsapp);
      if (!student || !parentPhone) {
        return NextResponse.json({ error: "تعذر فتح محادثة مع ولي أمر هذا الطالب" }, { status: 400 });
      }

      const existing = await prisma.educationConversation.findFirst({
        where: {
          studentId: student.id,
          type: "SUPERVISION",
          teacherId: null,
        },
      });

      const conversation =
        existing ||
        (await prisma.educationConversation.create({
          data: {
            studentId: student.id,
            parentPhone,
            teacherId: null,
            type: "SUPERVISION",
          },
        }));

      return NextResponse.json({ success: true, conversationId: conversation.id });
    }

    if (parentPhone) {
      const students = await parentStudents(parentPhone);
      if (students.length === 0) {
        return NextResponse.json({ error: "لا يوجد طالب مرتبط بهذا الرقم" }, { status: 404 });
      }

      const teacherId = String(body.teacherId || "").trim();
      const student =
        type === "SUPERVISION"
          ? students[0]
          : students.find((item) => item.teacher.id === teacherId) || null;

      if (!student) {
        return NextResponse.json({ error: "لا يمكن فتح هذه المحادثة" }, { status: 400 });
      }

      const existing = await prisma.educationConversation.findFirst({
        where: {
          studentId: student.id,
          type,
          ...(type === "TEACHER" ? { teacherId: student.teacher.id } : { teacherId: null }),
        },
      });

      const conversation =
        existing ||
        (await prisma.educationConversation.create({
          data: {
            studentId: student.id,
            parentPhone,
            type,
            teacherId: type === "TEACHER" ? student.teacher.id : null,
          },
        }));

      return NextResponse.json({ success: true, conversationId: conversation.id });
    }

    if (teacher || admin) {
      const studentId = String(body.studentId || "").trim();
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          studyMode: "REMOTE",
          isActive: true,
          ...(teacher ? { teacherId: teacher.id } : {}),
        },
        select: {
          id: true,
          teacherId: true,
          parentWhatsapp: true,
        },
      });

      const parentPhone = cleanChatPhone(student?.parentWhatsapp);
      if (!student || !parentPhone) {
        return NextResponse.json({ error: "لا يمكن فتح محادثة لهذا الطالب" }, { status: 400 });
      }

      const existing = await prisma.educationConversation.findFirst({
        where: {
          studentId: student.id,
          teacherId: student.teacherId,
          type: "TEACHER",
        },
      });

      const conversation =
        existing ||
        (await prisma.educationConversation.create({
          data: {
            studentId: student.id,
            teacherId: student.teacherId,
            parentPhone,
            type: "TEACHER",
          },
        }));

      return NextResponse.json({ success: true, conversationId: conversation.id });
    }

    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  } catch (error) {
    console.error("CREATE EDUCATION CONVERSATION ERROR =>", error);
    return NextResponse.json({ error: "تعذر إنشاء المحادثة" }, { status: 500 });
  }
}
