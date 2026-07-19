import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/whatsapp";

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("alrahma_user_id")?.value;
  if (!adminId) return false;
  const admin = await prisma.user.findFirst({
    where: { id: adminId, role: "ADMIN", isActive: true },
  });
  return !!admin;
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { dateKey, studentId, circleId, all } = body;

    if (!dateKey) {
      return NextResponse.json({ success: false, message: "التاريخ مطلوب" }, { status: 400 });
    }

    // Build the query to find unsent reports
    const whereClause: any = {
      dateKey,
      dailySent: false,
    };

    if (studentId) {
      whereClause.studentId = studentId;
    } else if (circleId) {
      whereClause.student = {
        circleId,
      };
    } else if (!all) {
      return NextResponse.json({ success: false, message: "يجب تحديد هدف الإرسال" }, { status: 400 });
    }

    // Find the reports to send
    const reports = await prisma.summerReport.findMany({
      where: whereClause,
      include: {
        student: true,
      },
    });

    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        message: "لا توجد تقارير غير مرسلة للمحدد",
        sentCount: 0,
      });
    }

    let sentCount = 0;

    for (const report of reports) {
      const student = report.student;
      if (!student.parentWhatsapp) {
        // Skip or log error
        await prisma.summerReport.update({
          where: { id: report.id },
          data: { dailySentError: "لا يوجد رقم واتساب لولي الأمر" },
        });
        continue;
      }

      // Format message based on status and group
      let messageText = "";

      if (report.status === "ABSENT") {
        messageText =
          `السلام عليكم ورحمة الله وبركاته\n\n` +
          `نفيدك بأن ابنك الكريم / *${student.fullName}*\n` +
          `غائب عن الدورة الصيفية اليوم بتاريخ *${dateKey}* بدون عذر.\n\n` +
          `نرجو منكم الاهتمام بحضور ابنكم الكريم لضمان استمراريته وتقدمه.\n\n` +
          `نشكر لكم حسن تعاونكم واهتمامكم.\n\n` +
          `إدارة منصة الرحمة لتعليم القرآن الكريم`;
      } else {
        const isQuran = student.summerGroup === "QURAN";
        if (isQuran) {
          messageText =
            `السلام عليكم ورحمة الله وبركاته\n\n` +
            `تقرير اليوم لولي أمر الطالب الكريم: *${student.fullName}*\n` +
            `في الدورة الصيفية - تحفيظ الرحمة\n` +
            `التاريخ: *${dateKey}*\n\n` +
            `- *الحالة:* حاضر\n` +
            `- *الحفظ الجديد:* ${report.quranNew || "لا يوجد"}\n` +
            `- *المراجعة:* ${report.quranRevision || "لا يوجد"}\n` +
            `- *التلقين:* ${report.quranTaqeen || "لا يوجد"}\n` +
            `- *درجة السلوك والانضباط:* ${report.behaviorGrade || 10}/10\n` +
            (report.behaviorNotes ? `- *ملاحظات السلوك:* ${report.behaviorNotes}\n` : "") +
            `\nنسأل الله له التوفيق والقبول، ونشكر لكم متابعتكم.\n\n` +
            `إدارة منصة الرحمة لتعليم القرآن الكريم`;
        } else {
          // Noor Al-Bayan
          const hwLabel = report.noorHomework ? `تم التسليم (الدرجة: ${report.noorHomeworkGrade || 10}/10)` : "لم يتم تسليم الواجب";
          messageText =
            `السلام عليكم ورحمة الله وبركاته\n\n` +
            `تقرير اليوم لولي أمر الطالب الكريم: *${student.fullName}*\n` +
            `في الدورة الصيفية - تحفيظ الرحمة (نور البيان)\n` +
            `التاريخ: *${dateKey}*\n\n` +
            `- *الحالة:* حاضر\n` +
            `- *ماذا تعلم اليوم:* ${report.noorLearned || "لا يوجد"}\n` +
            `- *تسليم الواجب:* ${hwLabel}\n` +
            `- *درجة المشاركة والتفاعل:* ${report.noorParticipation || 10}/10\n` +
            `- *درجة السلوك والانضباط:* ${report.behaviorGrade || 10}/10\n` +
            (report.behaviorNotes ? `- *ملاحظات السلوك:* ${report.behaviorNotes}\n` : "") +
            `\nنسأل الله له التوفيق والقبول، ونشكر لكم متابعتكم.\n\n` +
            `إدارة منصة الرحمة لتعليم القرآن الكريم`;
        }
      }

      try {
        await sendWhatsAppText({
          to: student.parentWhatsapp,
          body: messageText,
          channel: "ONSITE", // Uses Afyon's WhatsApp server configuration
          source: "SUMMER_DAILY_REPORT",
        });

        // Update database status
        await prisma.summerReport.update({
          where: { id: report.id },
          data: {
            dailySent: true,
            dailySentAt: new Date(),
            dailySentError: null,
          },
        });

        sentCount++;
      } catch (err: any) {
        console.error(`FAILED TO SEND WHATSAPP TO ${student.parentWhatsapp}:`, err);
        await prisma.summerReport.update({
          where: { id: report.id },
          data: {
            dailySentError: err.message || "فشل إرسال واتساب",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${sentCount} من أصل ${reports.length} تقارير بنجاح.`,
      sentCount,
    });
  } catch (error) {
    console.error("SEND DAILY API ERROR:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ داخلي أثناء الإرسال" }, { status: 500 });
  }
}
