import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";

export async function GET() {
  try {
    const adminEmail = "admin@test.com";
    const adminPassword = "test";
    const hashedPassword = hashPassword(adminPassword);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        password: hashedPassword,
        fullName: "إدارة الدورة الصيفية",
        role: "ADMIN",
        studyMode: "ONSITE_SUMMER",
        isActive: true,
      },
      update: {
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تثبيت حساب الإدارة الرئيسي بنجاح ✅",
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error("SETUP ADMIN ERROR =>", error);
    return NextResponse.json({ error: "فشل تثبيت حساب الإدارة" }, { status: 500 });
  }
}
