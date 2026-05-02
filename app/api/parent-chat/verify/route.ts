import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cleanChatPhone, PARENT_CHAT_COOKIE } from "@/lib/education-chat";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = cleanChatPhone(body.phone);
    const code = String(body.code || "").replace(/\D/g, "").slice(0, 6);

    if (!phone || code.length !== 6) {
      return NextResponse.json({ error: "الرقم أو الرمز غير صالح" }, { status: 400 });
    }

    const record = await prisma.parentPortalCode.findFirst({
      where: {
        phone,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "الرمز غير صحيح أو انتهت صلاحيته" }, { status: 400 });
    }

    await prisma.parentPortalCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const cookieStore = await cookies();
    cookieStore.set(PARENT_CHAT_COOKIE, phone, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PARENT CHAT VERIFY ERROR =>", error);
    return NextResponse.json({ error: "تعذر التحقق من الرمز" }, { status: 500 });
  }
}
