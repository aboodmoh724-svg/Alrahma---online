import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { getTodayDateKey } from "@/lib/date-utils";

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const teacherId = cookieStore.get("alrahma_user_id")?.value;

    if (!teacherId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await req.json();
    const {
      studentId,
      dateKey,
      status,
      // حقول القرآن
      quranNew,
      quranRevision,
      quranTaqeen,
      // حقول نور البيان
      noorLearned,
      noorHomework,
      noorHomeworkGrade,
      noorParticipation,
      // المشترك
      behaviorGrade,
      behaviorNotes,
    } = body;

    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json({ error: "معرف الطالب مطلوب" }, { status: 400 });
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
        summerGroup: true,
        studentCode: true,
      },
    });

    if (!student || student.studyMode !== "ONSITE_SUMMER") {
      return NextResponse.json({ error: "الطالب غير موجود في الدورة الصيفية" }, { status: 403 });
    }

    const actualToday = getTodayDateKey();
    const todayStr = dateKey || actualToday;
    const isPastDate = todayStr < actualToday;

    const reportData = {
      studentId: student.id,
      teacherId,
      dateKey: todayStr,
      status: status === "ABSENT" ? ReportStatus.ABSENT : ReportStatus.PRESENT,
      quranNew: typeof quranNew === "string" ? quranNew.trim() : null,
      quranRevision: typeof quranRevision === "string" ? quranRevision.trim() : null,
      quranTaqeen: typeof quranTaqeen === "string" ? quranTaqeen.trim() : null,
      noorLearned: typeof noorLearned === "string" ? noorLearned.trim() : null,
      noorHomework: typeof noorHomework === "boolean" ? noorHomework : noorHomework === "true",
      noorHomeworkGrade: optionalNumber(noorHomeworkGrade),
      noorParticipation: optionalNumber(noorParticipation),
      behaviorGrade: optionalNumber(behaviorGrade) ?? 5,
      behaviorNotes: typeof behaviorNotes === "string" ? behaviorNotes.trim() : null,
    };

    const report = await prisma.summerReport.upsert({
      where: {
        studentId_dateKey: {
          studentId: student.id,
          dateKey: todayStr,
        },
      },
      create: reportData,
      update: reportData,
    });

    // If report is for a past date, create an Admin TeacherRequest for approval
    if (isPastDate && student.studentCode !== "7500") {
      const teacherInfo = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { fullName: true },
      });
      const studentInfo = await prisma.student.findUnique({
        where: { id: studentId },
        select: { fullName: true },
      });

      const requestSubject = `طلب تعبئة/تعديل تقرير يوم سابق بتاريخ ${todayStr}`;
      
      const existingReq = await prisma.teacherRequest.findFirst({
        where: {
          teacherId,
          studentId: student.id,
          subject: requestSubject,
          status: { in: ["NEW", "IN_REVIEW"] },
        },
      });

      if (!existingReq) {
        await prisma.teacherRequest.create({
          data: {
            teacherId,
            studentId: student.id,
            type: "GENERAL",
            priority: "HIGH",
            target: "ADMIN",
            status: "NEW",
            subject: requestSubject,
            details: `تعبئة/تعديل تقرير يوم سابق: قام المعلم (${teacherInfo?.fullName || "المعلم"}) بتعبئة تقرير الطالب (${studentInfo?.fullName || "الطالب"}) بتاريخ سابق (${todayStr}). يتطلب موافقة واعتماد الإدارة.`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      report,
      isPastDate,
      pendingApproval: isPastDate,
    });
  } catch (error) {
    console.error("SUMMER REPORT SAVE ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ تقرير الدورة الصيفية" }, { status: 500 });
  }
}
