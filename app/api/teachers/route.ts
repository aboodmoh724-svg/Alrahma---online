import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function normalizeStudyMode(value: unknown) {
  return value === "REMOTE" || value === "ONSITE" ? value : undefined
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const studyMode = normalizeStudyMode(url.searchParams.get("studyMode"))
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        ...(studyMode ? { studyMode } : {}),
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const teacherId = String(body.teacherId || "").trim()
    const fullName = String(body.fullName || "").trim()
    const email = String(body.email || "").trim().toLowerCase()
    const studyMode = normalizeStudyMode(body.studyMode)

    if (!teacherId) {
      return NextResponse.json(
        { error: "المعلم مطلوب" },
        { status: 400 }
      )
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "اسم المعلم مطلوب" },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        ...(studyMode ? { studyMode } : {}),
      },
      select: {
        id: true,
      },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: "المعلم غير موجود" },
        { status: 404 }
      )
    }

    const emailOwner = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    })

    if (emailOwner && emailOwner.id !== teacher.id) {
      return NextResponse.json(
        { error: "هذا البريد مستخدم لمستخدم آخر" },
        { status: 400 }
      )
    }

    const updatedTeacher = await prisma.user.update({
      where: {
        id: teacher.id,
      },
      data: {
        fullName,
        email,
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
      teacher: updatedTeacher,
    })
  } catch (error) {
    console.error("UPDATE TEACHER ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث بيانات المعلم" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const teacherId = String(body.teacherId || "").trim()
    const studyMode = normalizeStudyMode(body.studyMode)

    if (!teacherId) {
      return NextResponse.json(
        { error: "المعلم مطلوب" },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        ...(studyMode ? { studyMode } : {}),
      },
      select: {
        id: true,
        fullName: true,
        _count: {
          select: {
            students: true,
            circles: true,
            reports: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: "المعلم غير موجود" },
        { status: 404 }
      )
    }

    if (teacher._count.students > 0 || teacher._count.circles > 0) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف هذا المعلم لأنه مرتبط بطلاب أو حلقات. انقل الطلاب والحلقات أولا ثم أعد المحاولة.",
        },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: {
        id: teacher.id,
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("DELETE TEACHER ERROR =>", error)

    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المعلم" },
      { status: 500 }
    )
  }
}
