import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  props: { params: Promise<{ studentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { studentId } = await props.params;
    const isAdmin = user.role === "ADMIN";

    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        isActive: true,
        studyMode: "ONSITE_SUMMER",
        ...(isAdmin
          ? {}
          : {
              OR: [
                { teacherId: user.id },
                { studentCode: "7500" },
              ],
            }),
      },
      include: {
        circle: { select: { name: true } },
        teacherProgressRecords: {
          take: 1,
        },
        summerReports: {
          where: {
            dateKey: { gte: "2026-07-09" },
          },
          orderBy: { dateKey: "desc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    const reports = student.summerReports;
    const presentCount = reports.filter((r) => r.status === "PRESENT").length;
    const absentCount = reports.filter((r) => r.status === "ABSENT").length;

    // Calculate missing working dates from 2026-07-09 up to today (excluding Mondays)
    const todayStr = new Date().toISOString().split("T")[0];
    const startDate = new Date("2026-07-09");
    const today = new Date();
    const recordedDateKeys = new Set(reports.map((r) => r.dateKey));
    const missingDateKeys: string[] = [];

    const curr = new Date(startDate);
    while (curr <= today) {
      const dateStr = curr.toISOString().split("T")[0];
      const dayOfWeek = curr.getDay(); // 1 is Monday

      if (dayOfWeek !== 1 && !recordedDateKeys.has(dateStr)) {
        missingDateKeys.push(dateStr);
      }
      curr.setDate(curr.getDate() + 1);
    }

    // Latest present report for prefilling suggestions
    const lastPresentReport = reports.find((r) => r.status === "PRESENT") || null;

    return NextResponse.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        summerGroup: student.summerGroup,
        circleName: student.circle?.name,
      },
      reports,
      stats: {
        totalRecorded: reports.length,
        presentCount,
        absentCount,
        missingCount: missingDateKeys.length,
      },
      missingDateKeys: missingDateKeys.sort((a, b) => b.localeCompare(a)), // newest first
      lastPresentReport,
      initialStartProgress: student.teacherProgressRecords[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching student summer history:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب سجل الطالب" },
      { status: 500 }
    );
  }
}
