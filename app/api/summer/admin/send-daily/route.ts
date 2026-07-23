import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

function buildQuranDailyMessage(input: {
  studentName: string;
  circleName?: string | null;
  teacherName?: string | null;
  reportDate: string;
  quranNew?: string | null;
  quranRevision?: string | null;
  quranTaqeen?: string | null;
  behaviorGrade?: number | null;
  behaviorNotes?: string | null;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته 🌹\n\n` +
    `📋 *تقرير الطالب اليومي - الدورة الصيفية الأولى* 🌟\n\n` +
    `👤 *اسم الطالب:* ${input.studentName}\n` +
    `🏫 *الحلقة:* ${input.circleName || "-"}\n` +
    `👳‍♂️ *المعلم:* ${input.teacherName || "-"}\n` +
    `📅 *التاريخ:* ${input.reportDate}\n\n` +
    `----------------------------------------\n` +
    `📖 *الحفظ الجديد:*\n${input.quranNew || "-"}\n\n` +
    `🔄 *المراجعة:*\n${input.quranRevision || "-"}\n\n` +
    `🗣️ *التلقين:*\n${input.quranTaqeen || "-"}\n\n` +
    `----------------------------------------\n` +
    `⭐ *السلوك والانضباط:* ${input.behaviorGrade ?? 5} من 5\n` +
    `📝 *ملاحظات المعلم:* ${input.behaviorNotes || "-"}\n\n` +
    `جزاكم الله خيراً على حسن المتابعة.\n` +
    `إدارة الدورة الصيفية الأولى - تحفيظ الرحمة`
  );
}

function buildNoorDailyMessage(input: {
  studentName: string;
  circleName?: string | null;
  teacherName?: string | null;
  reportDate: string;
  noorLearned?: string | null;
  noorHomework?: boolean | null;
  noorHomeworkGrade?: number | null;
  noorParticipation?: number | null;
  behaviorGrade?: number | null;
  behaviorNotes?: string | null;
}) {
  const hwStatus = input.noorHomework ? "تم التسليم ✅" : "لم يتم التسليم ❌";
  const hwGradeStr = input.noorHomeworkGrade !== null ? ` (الدرجة: ${input.noorHomeworkGrade}/5)` : "";

  return (
    `السلام عليكم ورحمة الله وبركاته 🌹\n\n` +
    `📋 *تقرير الطالب اليومي - الدورة الصيفية الأولى* 🌟\n\n` +
    `👤 *اسم الطالب:* ${input.studentName}\n` +
    `🏫 *الحلقة:* ${input.circleName || "-"}\n` +
    `👳‍♂️ *المعلم:* ${input.teacherName || "-"}\n` +
    `📅 *التاريخ:* ${input.reportDate}\n\n` +
    `----------------------------------------\n` +
    `📚 *ماذا تعلم اليوم:*\n${input.noorLearned || "-"}\n\n` +
    `📝 *الواجب اليومي:* ${hwStatus}${hwGradeStr}\n` +
    `🖐️ *المشاركة والتفاعل:* ${input.noorParticipation ?? 5} من 5\n\n` +
    `----------------------------------------\n` +
    `⭐ *السلوك والانضباط:* ${input.behaviorGrade ?? 5} من 5\n` +
    `📝 *ملاحظات المعلم:* ${input.behaviorNotes || "-"}\n\n` +
    `جزاكم الله خيراً على حسن المتابعة.\n` +
    `إدارة الدورة الصيفية الأولى - تحفيظ الرحمة`
  );
}

function buildAbsenceMessage(input: {
  studentName: string;
  reportDate: string;
}) {
  return (
    `السلام عليكم ورحمة الله وبركاته\n\n` +
    `نفيدكم بأن ابنكم الكريم / *${input.studentName}*\n` +
    `قد غاب عن الدورة الصيفية اليوم بتاريخ ${input.reportDate}.\n\n` +
    `نرجو الحرص على انتظام الحضور لما له من أثر على مستوى الطالب.\n` +
    `نشكر لكم حسن التعاون.\n\n` +
    `إدارة الدورة الصيفية - تحفيظ الرحمة`
  );
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { reportIds, dateKey } = body;

    const targetDate = dateKey || new Date().toISOString().split("T")[0];

    const reports = await prisma.summerReport.findMany({
      where: reportIds && Array.isArray(reportIds) && reportIds.length > 0
        ? { id: { in: reportIds } }
        : { dateKey: targetDate },
      include: {
        student: {
          select: {
            fullName: true,
            parentWhatsapp: true,
            summerGroup: true,
            circle: { select: { name: true } },
          },
        },
        teacher: { select: { fullName: true } },
      },
    });

    let sentCount = 0;
    let failCount = 0;

    for (const report of reports) {
      const phone = report.student.parentWhatsapp
        ? normalizeWhatsAppNumber(report.student.parentWhatsapp, "90")
        : null;

      if (!phone) {
        await prisma.summerReport.update({
          where: { id: report.id },
          data: { dailySentError: "لا يوجد رقم واتساب مسجل لولي الأمر" },
        });
        failCount += 1;
        continue;
      }

      let messageText = "";

      if (report.status === "ABSENT") {
        messageText = buildAbsenceMessage({
          studentName: report.student.fullName,
          reportDate: report.dateKey,
        });
      } else if (report.student.summerGroup === "NOOR_AL_BAYAN") {
        messageText = buildNoorDailyMessage({
          studentName: report.student.fullName,
          circleName: report.student.circle?.name,
          teacherName: report.teacher?.fullName,
          reportDate: report.dateKey,
          noorLearned: report.noorLearned,
          noorHomework: report.noorHomework,
          noorHomeworkGrade: report.noorHomeworkGrade,
          noorParticipation: report.noorParticipation,
          behaviorGrade: report.behaviorGrade,
          behaviorNotes: report.behaviorNotes,
        });
      } else {
        messageText = buildQuranDailyMessage({
          studentName: report.student.fullName,
          circleName: report.student.circle?.name,
          teacherName: report.teacher?.fullName,
          reportDate: report.dateKey,
          quranNew: report.quranNew,
          quranRevision: report.quranRevision,
          quranTaqeen: report.quranTaqeen,
          behaviorGrade: report.behaviorGrade,
          behaviorNotes: report.behaviorNotes,
        });
      }

      try {
        await sendWhatsAppText({
          to: phone,
          body: messageText,
          channel: "ONSITE_SUMMER",
          source: "SUMMER_DAILY_REPORT",
        });

        await prisma.summerReport.update({
          where: { id: report.id },
          data: {
            dailySent: true,
            dailySentAt: new Date(),
            dailySentError: null,
          },
        });

        sentCount += 1;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "فشل الإرسال عبر الواتساب";
        await prisma.summerReport.update({
          where: { id: report.id },
          data: { dailySentError: errorMsg },
        });
        failCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failCount,
      total: reports.length,
    });
  } catch (error) {
    console.error("SEND SUMMER DAILY REPORTS ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال التقارير اليومية" }, { status: 500 });
  }
}
