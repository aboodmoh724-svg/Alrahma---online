import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rawStudyMode = url.searchParams.get("studyMode") || ""
    const studyMode =
      rawStudyMode === "REMOTE" || rawStudyMode === "ONSITE" ? rawStudyMode : ""

    const reports = await prisma.report.findMany({
      where: studyMode
        ? {
            student: {
              is: {
                studyMode,
                teacher: {
                  is: {
                    studyMode,
                  },
                },
              },
            },
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            fullName: true,
            studyMode: true,
            circle: {
              select: {
                id: true,
                name: true,
                track: true,
                studyMode: true,
              },
            },
            teacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studyMode: true,
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
