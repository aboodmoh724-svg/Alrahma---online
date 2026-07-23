import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const missingStudents = await prisma.student.findMany({
      where: {
        studyMode: "ONSITE_SUMMER",
        OR: [{ parentWhatsapp: null }, { parentWhatsapp: "" }],
      },
      select: {
        id: true,
        fullName: true,
        studentCode: true,
        circle: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
      orderBy: { fullName: "asc" },
    });

    const withPhoneStudents = await prisma.student.findMany({
      where: {
        studyMode: "ONSITE_SUMMER",
        parentWhatsapp: { not: null, not: "" },
      },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        circle: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({
      success: true,
      missingCount: missingStudents.length,
      withPhoneCount: withPhoneStudents.length,
      missingStudents,
      withPhoneStudents,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
