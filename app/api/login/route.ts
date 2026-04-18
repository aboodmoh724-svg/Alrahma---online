import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const userCookieName = "alrahma_user_id";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود أو غير مفعل" },
        { status: 404 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: "كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    let redirectTo = "/";

    if (user.role === "TEACHER" && user.studyMode === "REMOTE") {
      redirectTo = "/remote/teacher/dashboard";
    } else if (user.role === "ADMIN" && user.studyMode === "REMOTE") {
      redirectTo = "/remote/admin/dashboard";
    } else if (user.role === "TEACHER" && user.studyMode === "ONSITE") {
      redirectTo = "/onsite/teacher/dashboard";
    } else if (user.role === "ADMIN" && user.studyMode === "ONSITE") {
      redirectTo = "/onsite/admin/dashboard";
    }

    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      redirectTo,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studyMode: user.studyMode,
      },
    });

    response.cookies.set(userCookieName, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ داخلي في الخادم",
      },
      { status: 500 }
    );
  }
}
