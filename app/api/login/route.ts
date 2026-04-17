import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    console.log("=== LOGIN DEBUG START ===");
    console.log("email from request:", email);

    if (!email || !password) {
      console.log("missing email or password");
      console.log("=== LOGIN DEBUG END ===");

      return NextResponse.json(
        { success: false, message: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    console.log("user found:", user);

    if (!user) {
      console.log("user not found");
      console.log("=== LOGIN DEBUG END ===");

      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    console.log("password from request:", password);
    console.log("password from db:", user.password);

    if (user.password !== password) {
      console.log("password mismatch");
      console.log("=== LOGIN DEBUG END ===");

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

    console.log("login success for:", {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      studyMode: user.studyMode,
      redirectTo,
    });
    console.log("=== LOGIN DEBUG END ===");

    return NextResponse.json({
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