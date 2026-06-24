import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function getTeacherId() {
  const cookieStore = await cookies();
  return cookieStore.get("alrahma_user_id")?.value || null;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const teacherId = await getTeacherId();
    const { reportId } = await context.params;

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        teacherId,
      },
      select: {
        id: true,
        studentId: true,
        lessonName: true,
        lessonSurah: true,
        lessonMemorized: true,
        lastFiveMemorized: true,
        pageFrom: true,
        pageTo: true,
        pagesCount: true,
        review: true,
        reviewSurah: true,
        reviewFrom: true,
        reviewTo: true,
        reviewPagesCount: true,
        reviewMemorized: true,
        homework: true,
        nextHomework: true,
        nextLessonHomework: true,
        nextReviewHomework: true,
        note: true,
        status: true,
        sentToParent: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("GET REPORT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب التقرير" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const teacherId = await getTeacherId();
    const { reportId } = await context.params;
    const body = await request.json();

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
    }

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        teacherId,
      },
      select: {
        id: true,
        studentId: true,
        sentToParent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });
    }

    // Check if test student (exempt from restrictions)
    const student = await prisma.student.findUnique({
      where: { id: report.studentId },
      select: { studentCode: true },
    });
    const isTestStudent = student?.studentCode === "7500";

    if (!isTestStudent) {
      // Block edit if already sent to parent
      if (report.sentToParent) {
        return NextResponse.json(
          { error: "لا يمكن تعديل التقرير بعد إرساله لولي الأمر" },
          { status: 403 }
        );
      }
      // Block edit if already edited once (updatedAt significantly differs from createdAt)
      const timeDiff = new Date(report.updatedAt).getTime() - new Date(report.createdAt).getTime();
      if (timeDiff > 2000) {
        return NextResponse.json(
          { error: "تم استنفاد فرصة التعديل المتاحة (مرة واحدة فقط)" },
          { status: 403 }
        );
      }
    }

    const isAbsent = body.status === "ABSENT";
    const isAttendanceOnly = Boolean(body.attendanceOnly);
    const lessonName =
      typeof body.lessonName === "string" && body.lessonName.trim()
        ? body.lessonName.trim()
        : "";

    if (!isAbsent && !lessonName) {
      return NextResponse.json({ error: "الدرس مطلوب" }, { status: 400 });
    }

    if (
      !isAbsent &&
      !isAttendanceOnly &&
      (!body.lessonSurah || typeof body.lessonSurah !== "string" || !body.lessonSurah.trim())
    ) {
      return NextResponse.json(
        { error: "اسم السورة في الدرس الجديد مطلوب" },
        { status: 400 }
      );
    }

    const updatedReport = await prisma.report.update({
      where: {
        id: report.id,
      },
      data: {
        lessonName: isAbsent ? "غياب" : lessonName,
        lessonSurah:
          isAttendanceOnly
            ? null
            : typeof body.lessonSurah === "string"
              ? body.lessonSurah.trim()
              : null,
        lessonMemorized:
          typeof body.lessonMemorized === "boolean" ? body.lessonMemorized : null,
        lastFiveMemorized:
          typeof body.lastFiveMemorized === "boolean" ? body.lastFiveMemorized : null,
        review: typeof body.review === "string" ? body.review.trim() : "",
        reviewSurah: typeof body.reviewSurah === "string" ? body.reviewSurah.trim() : null,
        reviewFrom: optionalNumber(body.reviewFrom),
        reviewTo: optionalNumber(body.reviewTo),
        reviewPagesCount: optionalNumber(body.reviewPagesCount),
        reviewMemorized:
          typeof body.reviewMemorized === "boolean" ? body.reviewMemorized : null,
        pageFrom: optionalNumber(body.pageFrom),
        pageTo: optionalNumber(body.pageTo),
        pagesCount: optionalNumber(body.pagesCount),
        homework:
          typeof body.homework === "string" && body.homework.trim()
            ? body.homework.trim()
            : "-",
        nextHomework: typeof body.nextHomework === "string" ? body.nextHomework.trim() : "",
        nextLessonHomework:
          typeof body.nextLessonHomework === "string" ? body.nextLessonHomework.trim() : "",
        nextReviewHomework:
          typeof body.nextReviewHomework === "string" ? body.nextReviewHomework.trim() : "",
        note: typeof body.note === "string" ? body.note.trim() : "",
        status: isAbsent ? "ABSENT" : "PRESENT",
        sentToParent: false,
        parentSentAt: null,
        parentSentChannel: null,
        parentSentError: null,
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error("UPDATE REPORT ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تعديل التقرير" }, { status: 500 });
  }
}
