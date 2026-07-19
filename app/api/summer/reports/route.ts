import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "غير مصرح - الرجاء تسجيل الدخول" },
        { status: 401 }
      );
    }

    // Verify teacher role
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        isActive: true,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "حساب المعلم غير موجود أو غير نشط" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      dateKey,
      status,
      quranNew,
      quranRevision,
      quranTaqeen,
      noorLearned,
      noorHomework,
      noorHomeworkGrade,
      noorParticipation,
      behaviorGrade,
      behaviorNotes,
    } = body;

    if (!studentId || !dateKey || !status) {
      return NextResponse.json(
        { success: false, message: "البيانات الأساسية ناقصة (معرف الطالب، التاريخ، الحالة)" },
        { status: 400 }
      );
    }

    // Check student existence
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.studyMode !== "ONSITE_SUMMER") {
      return NextResponse.json(
        { success: false, message: "الطالب غير موجود أو غير مسجل في الدورة الصيفية" },
        { status: 404 }
      );
    }

    // Check if report exists to determine whether we create or update
    const existing = await prisma.summerReport.findUnique({
      where: {
        studentId_dateKey: {
          studentId,
          dateKey,
        },
      },
    });

    let report;

    if (existing) {
      // Update
      report = await prisma.summerReport.update({
        where: { id: existing.id },
        data: {
          status,
          // If absent, we clear out academic entries, keeping only behavior if needed, or nulling everything
          quranNew: status === "PRESENT" ? quranNew || null : null,
          quranRevision: status === "PRESENT" ? quranRevision || null : null,
          quranTaqeen: status === "PRESENT" ? quranTaqeen || null : null,
          noorLearned: status === "PRESENT" ? noorLearned || null : null,
          noorHomework: status === "PRESENT" ? (noorHomework ?? null) : null,
          noorHomeworkGrade: status === "PRESENT" ? (noorHomeworkGrade ?? null) : null,
          noorParticipation: status === "PRESENT" ? (noorParticipation ?? null) : null,
          behaviorGrade: status === "PRESENT" ? (behaviorGrade ?? null) : null,
          behaviorNotes: status === "PRESENT" ? behaviorNotes || null : null,
        },
      });
    } else {
      // Create
      report = await prisma.summerReport.create({
        data: {
          studentId,
          teacherId,
          dateKey,
          status,
          quranNew: status === "PRESENT" ? quranNew || null : null,
          quranRevision: status === "PRESENT" ? quranRevision || null : null,
          quranTaqeen: status === "PRESENT" ? quranTaqeen || null : null,
          noorLearned: status === "PRESENT" ? noorLearned || null : null,
          noorHomework: status === "PRESENT" ? (noorHomework ?? null) : null,
          noorHomeworkGrade: status === "PRESENT" ? (noorHomeworkGrade ?? null) : null,
          noorParticipation: status === "PRESENT" ? (noorParticipation ?? null) : null,
          behaviorGrade: status === "PRESENT" ? (behaviorGrade ?? null) : null,
          behaviorNotes: status === "PRESENT" ? behaviorNotes || null : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "تم حفظ التقرير بنجاح",
      report,
    });
  } catch (error) {
    console.error("SUMMER REPORT SAVE API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ داخلي في الخادم" },
      { status: 500 }
    );
  }
}
