import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { StudyMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

function normalizeChannel(value: unknown): StudyMode {
  return value === "ONSITE" ? "ONSITE" : "REMOTE";
}

function resolveCategory(body: string) {
  const text = body.replace(/\s+/g, " ").trim();

  if (/لا\s*يناسب|غير\s*مناسب|ما\s*يناسب|موعد\s*آخر|تغيير\s*الموعد|لا\s*نستطيع|لا\s*نقدر/.test(text)) {
    return "INTERVIEW_RESCHEDULE" as const;
  }

  if (/عذر|معذور|مريض|مرض|سفر|ظرف|غياب|تعبان|تعبانة/.test(text)) {
    return "ABSENCE_EXCUSE" as const;
  }

  return "GENERAL" as const;
}

async function resolveLinkedEntities(fromNumber: string, channel: StudyMode) {
  const [students, requests] = await Promise.all([
    prisma.student.findMany({
      where: {
        studyMode: channel,
        parentWhatsapp: { not: null },
      },
      select: {
        id: true,
        parentWhatsapp: true,
      },
    }),
    prisma.registrationRequest.findMany({
      where: {
        parentWhatsapp: { not: "" },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
      select: {
        id: true,
        parentWhatsapp: true,
        status: true,
        createdStudentId: true,
      },
    }),
  ]);

  const matchedStudent = students.find(
    (student) => normalizeWhatsAppNumber(student.parentWhatsapp || "") === fromNumber
  );
  const matchedRequest = requests.find(
    (request) => normalizeWhatsAppNumber(request.parentWhatsapp || "") === fromNumber
  );

  return {
    studentId: matchedStudent?.id || null,
    registrationRequestId:
      matchedRequest && (!matchedRequest.createdStudentId || !matchedStudent)
        ? matchedRequest.id
        : null,
  };
}

function isAuthorizedIncoming(request: Request) {
  const expectedToken = String(process.env.WHATSAPP_INCOMING_WEBHOOK_TOKEN || "").trim();

  if (!expectedToken) {
    return true;
  }

  const authorization = String(request.headers.get("authorization") || "");
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  return token === expectedToken;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorizedIncoming(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawFrom = String(body.from || body.fromNumber || body.phone || "").trim();
    const fromNumber = normalizeWhatsAppNumber(rawFrom);
    const messageBody = String(body.body || body.message || "").trim();
    const messageId = String(body.messageId || "").trim() || null;
    const channel = normalizeChannel(body.channel);

    if (!fromNumber) {
      return NextResponse.json({ error: "رقم المرسل غير صالح" }, { status: 400 });
    }

    if (!messageBody) {
      return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
    }

    const linked = await resolveLinkedEntities(fromNumber, channel);
    const data = {
      channel,
      fromNumber,
      body: messageBody,
      messageId,
      category: resolveCategory(messageBody),
      raw: body,
      studentId: linked.studentId,
      registrationRequestId: linked.registrationRequestId,
    };

    const message = messageId
      ? await prisma.whatsAppIncomingMessage.upsert({
          where: { messageId },
          update: data,
          create: data,
        })
      : await prisma.whatsAppIncomingMessage.create({ data });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("WHATSAPP INCOMING WEBHOOK ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ رسالة الواتساب الواردة" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
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
        canAccessSupervision: true,
      },
    });

    if (!admin || (admin.studyMode !== "REMOTE" && !admin.canAccessSupervision)) {
      return NextResponse.json({ error: "غير مصرح لك بقراءة رسائل الواتساب" }, { status: 403 });
    }

    const url = new URL(request.url);
    const channel = normalizeChannel(url.searchParams.get("channel") || admin.studyMode);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 80), 1), 200);

    const messages = await prisma.whatsAppIncomingMessage.findMany({
      where: {
        channel,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            parentWhatsapp: true,
          },
        },
        registrationRequest: {
          select: {
            id: true,
            studentName: true,
            parentWhatsapp: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("GET WHATSAPP INCOMING ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب رسائل الواتساب الواردة" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await request.json();
    const ids = Array.isArray(body.ids)
      ? body.ids.map((value: unknown) => String(value || "").trim()).filter(Boolean)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: "لم يتم تحديد رسائل" }, { status: 400 });
    }

    await prisma.whatsAppIncomingMessage.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MARK WHATSAPP INCOMING READ ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة رسائل الواتساب" },
      { status: 500 }
    );
  }
}
