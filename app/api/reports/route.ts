import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;
    const body = await req.json();

    const {
      studentId,
      attendanceOnly,
      lessonName,
      lessonSurah,
      lessonMemorized,
      lastFiveMemorized,
      review,
      reviewSurah,
      reviewFrom,
      reviewTo,
      reviewPagesCount,
      reviewMemorized,
      pageFrom,
      pageTo,
      pagesCount,
      homework,
      nextHomework,
      nextLessonHomework,
      nextReviewHomework,
      note,
      status,
    } = body;

    const isAbsent = status === "ABSENT";
    const isAttendanceOnly = Boolean(attendanceOnly);

    if (!teacherId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولًا" },
        { status: 401 }
      );
    }

    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json({ error: "الطالب مطلوب" }, { status: 400 });
    }

    if (!isAbsent && (!lessonName || typeof lessonName !== "string" || !lessonName.trim())) {
      return NextResponse.json({ error: "الدرس مطلوب" }, { status: 400 });
    }

    if (
      !isAbsent &&
      !isAttendanceOnly &&
      (!lessonSurah || typeof lessonSurah !== "string" || !lessonSurah.trim())
    ) {
      return NextResponse.json(
        { error: "اسم السورة في الدرس الجديد مطلوب" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId.trim(),
        teacherId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "لا يمكنك إضافة تقرير لهذا الطالب" },
        { status: 403 }
      );
    }

    const report = await prisma.report.create({
      data: {
        studentId: student.id,
        teacherId,
        lessonName: isAbsent ? "غياب" : lessonName.trim(),
        lessonSurah:
          isAttendanceOnly
            ? null
            : typeof lessonSurah === "string"
              ? lessonSurah.trim()
              : null,
        lessonMemorized: typeof lessonMemorized === "boolean" ? lessonMemorized : null,
        lastFiveMemorized: typeof lastFiveMemorized === "boolean" ? lastFiveMemorized : null,
        review: typeof review === "string" ? review.trim() : "",
        reviewSurah: typeof reviewSurah === "string" ? reviewSurah.trim() : null,
        reviewFrom: optionalNumber(reviewFrom),
        reviewTo: optionalNumber(reviewTo),
        reviewPagesCount: optionalNumber(reviewPagesCount),
        reviewMemorized: typeof reviewMemorized === "boolean" ? reviewMemorized : null,
        pageFrom: optionalNumber(pageFrom),
        pageTo: optionalNumber(pageTo),
        pagesCount: optionalNumber(pagesCount),
        homework: typeof homework === "string" && homework.trim() ? homework.trim() : "-",
        nextHomework: typeof nextHomework === "string" ? nextHomework.trim() : "",
        nextLessonHomework:
          typeof nextLessonHomework === "string" ? nextLessonHomework.trim() : "",
        nextReviewHomework:
          typeof nextReviewHomework === "string" ? nextReviewHomework.trim() : "",
        note: typeof note === "string" ? note.trim() : "",
        status: isAbsent ? "ABSENT" : "PRESENT",
      },
    });

    return NextResponse.json({
      success: true,
      report,
      whatsapp: { attempted: false },
    });
  } catch (error) {
    console.error("CREATE REPORT ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ التقرير" },
      { status: 500 }
    );
  }
}
