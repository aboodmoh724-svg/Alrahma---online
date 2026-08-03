import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber, sendWhatsAppText, sendWhatsAppDocument } from "@/lib/whatsapp";
import { smartDelay, canSendMore, incrementDailySendCount, addMessageVariation } from "@/lib/smart-sender";
import { loadExamGrades } from "@/lib/summer-evaluation";
import { generateStudentProgressReportPdf, generateStudentProgressReportMedia } from "@/lib/student-progress-report-pdf";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
}

// GET: Pre-send inspection
export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const gradeData = loadExamGrades();
    const evaluatedStudentIds = new Set(gradeData.students.map((s) => s.studentId));

    const students = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true, id: { in: Array.from(evaluatedStudentIds) } },
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
        circle: { select: { name: true } },
      },
    });

    let readyCount = 0;
    let missingPhoneCount = 0;
    const readyStudents: string[] = [];
    const missingPhoneStudents: string[] = [];

    for (const s of students) {
      const phone = s.parentWhatsapp ? normalizeWhatsAppNumber(s.parentWhatsapp, "90") : null;
      if (phone) {
        readyCount++;
        readyStudents.push(s.fullName);
      } else {
        missingPhoneCount++;
        missingPhoneStudents.push(s.fullName);
      }
    }

    return NextResponse.json({
      totalEvaluated: gradeData.students.length,
      matchedInDb: students.length,
      readyCount,
      missingPhoneCount,
      readyStudents,
      missingPhoneStudents,
    });
  } catch (error) {
    console.error("GET /api/summer/admin/send-progress-reports error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الجلب" }, { status: 500 });
  }
}

// POST: Bulk send progress reports to parents via WhatsApp (with overridePhone, sendAsDocument support)
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetStudentId = body.studentId as string | undefined;
    const overridePhoneInput = body.overridePhone as string | undefined;
    const limitInput = typeof body.limit === "number" ? body.limit : undefined;
    const sendAsDocument = body.sendAsDocument !== false; // default true for high quality document

    const normalizedOverridePhone = overridePhoneInput
      ? normalizeWhatsAppNumber(overridePhoneInput, "90")
      : null;

    const gradeData = loadExamGrades();
    const studentMap = new Map(gradeData.students.map((s) => [s.studentId, s]));

    let students = await prisma.student.findMany({
      where: {
        studyMode: "ONSITE_SUMMER",
        isActive: true,
        id: targetStudentId ? targetStudentId : { in: Array.from(studentMap.keys()) },
      },
      select: {
        id: true,
        fullName: true,
        studentCode: true,
        parentWhatsapp: true,
        circle: { select: { name: true } },
      },
    });

    if (limitInput && limitInput > 0) {
      students = students.slice(0, limitInput);
    }

    let sent = 0;
    let skippedNoPhone = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const student of students) {
      const evalData = studentMap.get(student.id);
      if (!evalData) continue;

      const phone = normalizedOverridePhone || (student.parentWhatsapp ? normalizeWhatsAppNumber(student.parentWhatsapp, "90") : null);

      if (!phone) {
        skippedNoPhone++;
        continue;
      }

      // Check daily quota
      if (!(await canSendMore("ONSITE_SUMMER"))) {
        errors.push("تم الوصول للحد الأقصى للإرسال اليومي");
        break;
      }

      const reportUrl = appUrl(`/onsite/summer/parent-report/${student.studentCode || student.id}`);

      const msgLines = [
        "السلام عليكم ورحمة الله وبركاته 🌿",
        "",
        "يسر إدارة *تحفيظ الرحمة للقرآن الكريم* أن تشارككم تقرير إنجاز ابنكم في الدورة الصيفية 2026 - الفترة الأولى.",
        "",
        `📖 الطالب: *${student.fullName}*`,
        `الحلقة: ${student.circle?.name || "—"}`,
        `النتيجة النهائية: *${evalData.finalScore}%*`,
        "",
        "نسأل الله أن يبارك فيه وأن يجعله من أهل القرآن وخاصته.",
        "",
        "يمكنكم مشاهدة التقرير التفاعلي من هنا:",
        reportUrl,
        "",
        "مع تحيات إدارة تحفيظ الرحمة",
      ];
      let msg = msgLines.join("\n");

      msg = addMessageVariation(msg);

      let success = false;

    const mediaFormat = (body.mediaFormat === "png" ? "png" : "pdf") as "png" | "pdf";

      if (sendAsDocument) {
        try {
          const mediaResult = await generateStudentProgressReportMedia(student.id, mediaFormat);
          if (mediaResult && mediaResult.mediaUrl) {
            const fileName = `تقرير_إنجاز_${student.fullName.replace(/\s+/g, "_")}.${mediaFormat}`;
            success = await sendWhatsAppDocument({
              to: phone,
              documentUrl: mediaResult.mediaUrl,
              fileName,
              caption: msg,
              channel: "ONSITE_SUMMER",
            });
          }
        } catch (mediaErr) {
          console.warn(`Media document send failed for ${student.fullName}, falling back to text:`, mediaErr);
        }
      }

      // Fallback to text if document sending was disabled or failed
      if (!success) {
        success = await sendWhatsAppText({ to: phone, body: msg, channel: "ONSITE_SUMMER" });
      }

      if (success) {
        sent++;
        await incrementDailySendCount("ONSITE_SUMMER");

        await prisma.whatsAppOutgoingMessage.create({
          data: {
            channel: "ONSITE_SUMMER",
            toNumber: phone,
            body: msg,
            source: "SUMMER_PROGRESS_REPORT",
            category: "GENERAL",
            studentId: student.id,
          },
        });
      } else {
        failed++;
        errors.push(`فشل الإرسال إلى ${student.fullName}`);
      }

      await smartDelay(sent);
    }

    return NextResponse.json({
      success: true,
      sent,
      skippedNoPhone,
      failed,
      targetPhone: normalizedOverridePhone || "الأرقام المسجلة للطلاب",
      errors,
    });
  } catch (error) {
    console.error("POST /api/summer/admin/send-progress-reports error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الإرسال" }, { status: 500 });
  }
}
