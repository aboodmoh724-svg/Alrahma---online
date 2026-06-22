import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIstanbulDayRange } from "@/lib/school-day";
import { checkAndCreateAutomaticTasksForReport } from "@/lib/supervision";

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
      // حقول الأخطاء والتنبيهات الجديدة
      lessonErrors,
      lessonWarnings,
      lessonHasHesitation,
      lastFiveErrors,
      lastFiveWarnings,
      lastFiveHasHesitation,
      reviewErrors,
      reviewWarnings,
      quranMarks,
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
        isActive: true,
        OR: [
          { teacherId },
          { studentCode: "7500" },
        ],
      },
      select: {
        id: true,
        studyMode: true,
        parentWhatsapp: true,
        isTemporary: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "لا يمكنك إضافة تقرير لهذا الطالب" },
        { status: 403 }
      );
    }

    const { start, end } = getIstanbulDayRange();
    const existingTodayReport = await prisma.report.findFirst({
      where: {
        studentId: student.id,
        teacherId,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingTodayReport) {
      return NextResponse.json(
        { error: "تم حفظ تقرير لهذا الطالب اليوم بالفعل. يمكن إضافة تقرير واحد فقط لكل طالب في اليوم." },
        { status: 409 }
      );
    }

    // احتساب حالة الحفظ تلقائياً بناءً على الأخطاء والتنبيهات
    let calculatedLessonMemorized = typeof lessonMemorized === "boolean" ? lessonMemorized : null;
    let calculatedLastFiveMemorized = typeof lastFiveMemorized === "boolean" ? lastFiveMemorized : null;
    let calculatedReviewMemorized = typeof reviewMemorized === "boolean" ? reviewMemorized : null;

    const rErrors = optionalNumber(reviewErrors) ?? 0;
    const rWarnings = optionalNumber(reviewWarnings) ?? 0;

    if (!isAbsent && !isAttendanceOnly && reviewErrors !== undefined) {
      calculatedReviewMemorized = rErrors <= 3 && rWarnings <= 6;
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
        lessonMemorized: calculatedLessonMemorized,
        lessonErrors: isAbsent || isAttendanceOnly ? null : optionalNumber(lessonErrors),
        lessonWarnings: isAbsent || isAttendanceOnly ? null : optionalNumber(lessonWarnings),
        lessonHasHesitation: isAbsent || isAttendanceOnly ? null : (lessonHasHesitation === true || lessonHasHesitation === "true"),
        lastFiveMemorized: calculatedLastFiveMemorized,
        lastFiveErrors: isAbsent || isAttendanceOnly ? null : optionalNumber(lastFiveErrors),
        lastFiveWarnings: isAbsent || isAttendanceOnly ? null : optionalNumber(lastFiveWarnings),
        lastFiveHasHesitation: isAbsent || isAttendanceOnly ? null : (lastFiveHasHesitation === true || lastFiveHasHesitation === "true"),
        review: typeof review === "string" ? review.trim() : "",
        reviewSurah: typeof reviewSurah === "string" ? reviewSurah.trim() : null,
        reviewFrom: optionalNumber(reviewFrom),
        reviewTo: optionalNumber(reviewTo),
        reviewPagesCount: optionalNumber(reviewPagesCount),
        reviewMemorized: calculatedReviewMemorized,
        reviewErrors: isAbsent || isAttendanceOnly ? null : rErrors,
        reviewWarnings: isAbsent || isAttendanceOnly ? null : rWarnings,
        reviewPenaltyScore: null,
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
        quranMarks: isAbsent || isAttendanceOnly ? undefined : (Array.isArray(quranMarks) ? quranMarks : []),
      },
    });

    // تشغيل منطق التحقق التلقائي لمهام الإشراف (توقف الدرس الجديد والغياب المتكرر)
    try {
      await checkAndCreateAutomaticTasksForReport(report.id);
    } catch (taskError) {
      console.error("RUN AUTOMATIC SUPERVISION TASKS ERROR =>", taskError);
    }

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
