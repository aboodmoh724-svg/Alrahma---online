import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, needsPasswordRehash, verifyPassword } from "@/lib/passwords";

const userCookieName = "alrahma_user_id";
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;

function clientKey(request: Request, email: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `${forwardedFor || realIp || "unknown"}:${email}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_LOGIN_ATTEMPTS;
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

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

    const attemptKey = clientKey(request, email);
    if (isRateLimited(attemptKey)) {
      return NextResponse.json(
        { success: false, message: "محاولات كثيرة. الرجاء الانتظار قليلا ثم المحاولة مرة أخرى." },
        { status: 429 }
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

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { success: false, message: "كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    if (needsPasswordRehash(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(password) },
      });
    }

    clearRateLimit(attemptKey);

    let redirectTo = "/";

    if (user.role === "TEACHER" && user.studyMode === "REMOTE") {
      redirectTo = "/remote/teacher/dashboard";
    } else if (user.role === "ADMIN" && user.studyMode === "REMOTE") {
      if (user.canAccessFinance) {
        redirectTo = "/remote/admin/dashboard";
      } else if (user.canAccessSupervision) {
        redirectTo = "/remote/supervision/dashboard";
      } else {
        redirectTo = "/remote/admin/dashboard";
      }
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
