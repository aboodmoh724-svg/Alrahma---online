import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      teachers,
    })
  } catch (error) {
    console.error("GET TEACHERS ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المعلمين" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("CREATE TEACHER BODY =>", body)

    const { fullName, email, password, studyMode } = body

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { error: "اسم المعلم مطلوب" },
        { status: 400 }
      )
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      )
    }

    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        { error: "كلمة المرور مطلوبة" },
        { status: 400 }
      )
    }

    if (!studyMode || (studyMode !== "REMOTE" && studyMode !== "ONSITE")) {
      return NextResponse.json(
        { error: "نوع الدراسة غير صالح" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.trim(),
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد مستخدم مسبقًا" },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        role: "TEACHER",
        studyMode,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        studyMode: true,
        isActive: true,
        createdAt: true,
      },
    })

    console.log("TEACHER CREATED =>", teacher)

    return NextResponse.json({
      success: true,
      teacher,
    })
  } catch (error) {
    console.error("CREATE TEACHER ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المعلم" },
      { status: 500 }
    )
  }
}