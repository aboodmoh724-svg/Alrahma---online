import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReportNotePresets } from "@/lib/report-note-presets";

async function getAllowedUser() {
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
    },
  });
}

export async function GET() {
  try {
    const user = await getAllowedUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح لك بعرض الملاحظات الجاهزة" }, { status: 403 });
    }

    const presets = await getReportNotePresets();

    return NextResponse.json({
      success: true,
      presets,
    });
  } catch (error) {
    console.error("GET REPORT NOTE PRESETS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الملاحظات الجاهزة" },
      { status: 500 }
    );
  }
}
