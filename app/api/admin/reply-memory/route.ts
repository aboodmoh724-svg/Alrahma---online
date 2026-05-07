import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set(["PENDING", "APPROVED", "IGNORED", "NEEDS_EDIT"]);

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

export async function GET(request: Request) {
  try {
    const admin = await getCurrentRemoteAdmin();

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بقراءة ذاكرة الردود" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = String(url.searchParams.get("status") || "ALL").trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 80), 1), 200);

    const [memories, candidates] = await Promise.all([
      prisma.whatsAppReplyMemory.findMany({
        where: VALID_STATUSES.has(status) ? { status } : {},
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }),
      prisma.whatsAppIncomingMessage.findMany({
        where: {
          channel: "REMOTE",
          lastOutgoingMessage: {
            is: {
              source: "HUMAN_REPLY",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        include: {
          student: {
            select: {
              fullName: true,
            },
          },
          registrationRequest: {
            select: {
              studentName: true,
            },
          },
          lastOutgoingMessage: {
            select: {
              id: true,
              body: true,
              source: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const memoryByPair = new Map(
      memories.map((memory) => [`${memory.incomingMessageId}:${memory.outgoingMessageId}`, memory])
    );
    const candidateItems = candidates
      .filter((item) => item.lastOutgoingMessage)
      .map((item) => {
        const outgoing = item.lastOutgoingMessage!;
        const pairKey = `${item.id}:${outgoing.id}`;
        const memory = memoryByPair.get(pairKey);

        return {
          id: memory?.id || pairKey,
          incomingMessageId: item.id,
          outgoingMessageId: outgoing.id,
          question: memory?.question || item.body,
          answer: memory?.answer || outgoing.body,
          editedAnswer: memory?.editedAnswer || "",
          category: memory?.category || item.category,
          status: memory?.status || "PENDING",
          notes: memory?.notes || "",
          contactName: item.student?.fullName || item.registrationRequest?.studentName || "",
          incomingCreatedAt: item.createdAt,
          outgoingCreatedAt: outgoing.createdAt,
          persisted: Boolean(memory),
        };
      });

    const knownPairKeys = new Set(candidateItems.map((item) => `${item.incomingMessageId}:${item.outgoingMessageId}`));
    const memoryOnlyItems = memories
      .filter((memory) => !knownPairKeys.has(`${memory.incomingMessageId}:${memory.outgoingMessageId}`))
      .map((memory) => ({
        id: memory.id,
        incomingMessageId: memory.incomingMessageId,
        outgoingMessageId: memory.outgoingMessageId,
        question: memory.question,
        answer: memory.answer,
        editedAnswer: memory.editedAnswer || "",
        category: memory.category || "GENERAL",
        status: memory.status,
        notes: memory.notes || "",
        contactName: "",
        incomingCreatedAt: memory.createdAt,
        outgoingCreatedAt: memory.updatedAt,
        persisted: true,
      }));

    return NextResponse.json({
      success: true,
      items: [...candidateItems, ...memoryOnlyItems].slice(0, limit),
    });
  } catch (error) {
    console.error("GET REPLY MEMORY ERROR =>", error);

    return NextResponse.json({ error: "تعذر تحميل ذاكرة الردود" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentRemoteAdmin();

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بتحديث ذاكرة الردود" }, { status: 403 });
    }

    const body = await request.json();
    const incomingMessageId = String(body.incomingMessageId || "").trim();
    const outgoingMessageId = String(body.outgoingMessageId || "").trim();
    const status = String(body.status || "PENDING").trim();
    const editedAnswer = String(body.editedAnswer || "").trim();
    const notes = String(body.notes || "").trim();

    if (!incomingMessageId || !outgoingMessageId) {
      return NextResponse.json({ error: "بيانات السؤال والرد مطلوبة" }, { status: 400 });
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "حالة الاعتماد غير صالحة" }, { status: 400 });
    }

    const incoming = await prisma.whatsAppIncomingMessage.findUnique({
      where: { id: incomingMessageId },
      include: {
        lastOutgoingMessage: {
          select: {
            id: true,
            body: true,
            source: true,
          },
        },
      },
    });

    if (!incoming || incoming.lastOutgoingMessage?.id !== outgoingMessageId) {
      return NextResponse.json({ error: "لم يتم العثور على زوج سؤال ورد صالح" }, { status: 404 });
    }

    if (incoming.lastOutgoingMessage.source !== "HUMAN_REPLY") {
      return NextResponse.json({ error: "لا يتم اعتماد إلا الردود البشرية المباشرة" }, { status: 400 });
    }

    const memory = await prisma.whatsAppReplyMemory.upsert({
      where: {
        incomingMessageId_outgoingMessageId: {
          incomingMessageId,
          outgoingMessageId,
        },
      },
      create: {
        incomingMessageId,
        outgoingMessageId,
        question: incoming.body,
        answer: incoming.lastOutgoingMessage.body,
        editedAnswer: editedAnswer || null,
        category: incoming.category,
        status,
        notes: notes || null,
        reviewedById: admin.id,
      },
      update: {
        question: incoming.body,
        answer: incoming.lastOutgoingMessage.body,
        editedAnswer: editedAnswer || null,
        category: incoming.category,
        status,
        notes: notes || null,
        reviewedById: admin.id,
      },
    });

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    console.error("PATCH REPLY MEMORY ERROR =>", error);

    return NextResponse.json({ error: "تعذر حفظ حالة ذاكرة الرد" }, { status: 500 });
  }
}
