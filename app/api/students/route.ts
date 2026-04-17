import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      students,
    })
  } catch (error) {
    console.error("GET STUDENTS ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الطلاب" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("CREATE STUDENT BODY =>", body)

    const { fullName, teacherId, studyMode } = body

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { error: "اسم الطالب مطلوب" },
        { status: 400 }
      )
    }

    if (!teacherId || typeof teacherId !== "string" || !teacherId.trim()) {
      return NextResponse.json(
        { error: "المعلم مطلوب" },
        { status: 400 }
      )
    }

    if (!studyMode || (studyMode !== "REMOTE" && studyMode !== "ONSITE")) {
      return NextResponse.json(
        { error: "نوع الدراسة غير صالح" },
        { status: 400 }
      )
    }

    const student = await prisma.student.create({
      data: {
        fullName: fullName.trim(),
        teacherId: teacherId.trim(),
        studyMode,
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    console.log("STUDENT CREATED =>", student)

    return NextResponse.json({
      success: true,
      student,
    })
  } catch (error) {
    console.error("CREATE STUDENT ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة الطالب" },
      { status: 500 }
    )
  }
}