import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;
    const { studentId } = await context.params;
    const url = new URL(_request.url);
    const rawStudyMode = url.searchParams.get("studyMode") || "";
    const studyMode =
      rawStudyMode === "REMOTE" || rawStudyMode === "ONSITE" ? rawStudyMode : "";

    if (!teacherId) {
      return NextResponse.json(
        { error: "الرجاء تسجيل الدخول أولًا" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId,
        ...(studyMode ? { studyMode } : {}),
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        reports: {
          orderBy: {
            createdAt: "desc",
          },
          take: 12,
          select: {
            id: true,
            lessonName: true,
            lessonMemorized: true,
            lastFiveMemorized: true,
            review: true,
            pageFrom: true,
            pageTo: true,
            pagesCount: true,
            reviewMemorized: true,
            homework: true,
            nextHomework: true,
            note: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "الطالب غير موجود أو لا يتبع هذا المعلم" },
        { status: 404 }
      );
    }

    const previousReport = student.reports[0] || null;
    const lastNextHomework =
      student.reports.find((report) => report.nextHomework?.trim())
        ?.nextHomework || "";

    return NextResponse.json({
      success: true,
      student,
      reports: student.reports,
      previousReport,
      lastNextHomework,
    });
  } catch (error) {
    console.error("GET STUDENT HISTORY ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب سجل الطالب" },
      { status: 500 }
    );
  }
}
