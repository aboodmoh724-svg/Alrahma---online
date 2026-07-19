import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("alrahma_user_id")?.value;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: { id: adminId, role: "ADMIN", isActive: true },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "صلاحيات غير كافية" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, message: "التاريخ مطلوب" },
        { status: 400 }
      );
    }

    const reports = await prisma.summerReport.findMany({
      where: { dateKey: date },
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("GET SUMMER REPORTS API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ داخلي في الخادم" },
      { status: 500 }
    );
  }
}
