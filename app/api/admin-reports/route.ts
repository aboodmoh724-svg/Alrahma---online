import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studyMode: true,
            teacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      reports,
    })
  } catch (error) {
    console.error("GET ADMIN REPORTS ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب التقارير" },
      { status: 500 }
    )
  }
}