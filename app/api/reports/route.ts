import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("REPORT BODY RECEIVED =>", body)

    const {
      studentId,
      lessonName,
      review,
      homework,
      note,
      status,
    } = body

    console.log("REPORT FIELDS =>", {
      studentId,
      lessonName,
      review,
      homework,
      note,
      status,
    })

    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json(
        { error: "الطالب مطلوب" },
        { status: 400 }
      )
    }

    if (!lessonName || typeof lessonName !== "string" || !lessonName.trim()) {
      return NextResponse.json(
        { error: "الدرس مطلوب" },
        { status: 400 }
      )
    }

    if (!homework || typeof homework !== "string" || !homework.trim()) {
      return NextResponse.json(
        { error: "الواجب مطلوب" },
        { status: 400 }
      )
    }

    const report = await prisma.report.create({
      data: {
        studentId: studentId.trim(),
        lessonName: lessonName.trim(),
        review: typeof review === "string" ? review.trim() : "",
        homework: homework.trim(),
        note: typeof note === "string" ? note.trim() : "",
        status:
          status === "ABSENT" || status === "PRESENT"
            ? status
            : "PRESENT",
      },
    })

    console.log("REPORT CREATED =>", report)

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error("CREATE REPORT ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ التقرير" },
      { status: 500 }
    )
  }
}