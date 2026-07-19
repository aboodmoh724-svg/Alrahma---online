import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { captureWeeklyCard } from "@/lib/summer-screenshot";
import { sendWhatsAppDocument, normalizeWhatsAppNumber } from "@/lib/whatsapp";

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
    const { studentId, circleId, all } = body;

    // Build the student query
    const whereClause: any = {
      studyMode: "ONSITE_SUMMER",
      isActive: true,
    };

    if (studentId) {
      whereClause.id = studentId;
    } else if (circleId) {
      whereClause.circleId = circleId;
    } else if (!all) {
      return NextResponse.json({ success: false, message: "يعب تحديد هدف الإرسال" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        parentWhatsapp: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        message: "لا يوجد طلاب لإرسال الكروت الأسبوعية لهم",
        sentCount: 0,
      });
    }

    // Resolve base URL from request headers
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    let sentCount = 0;

    for (const student of students) {
      const phone = normalizeWhatsAppNumber(student.parentWhatsapp || "", "90");
      if (!phone) continue;

      try {
        // Generate the screenshot
        const { relativePath, filename } = await captureWeeklyCard(student.id, baseUrl);
        const documentUrl = `${baseUrl}/${relativePath}`;

        // Format Caption
        const caption =
          `السلام عليكم ورحمة الله وبركاته\n\n` +
          `نضع بين أيديكم التقرير الأسبوعي التلخيصي للطالب / *${student.fullName}* في الدورة الصيفية لتحفيظ الرحمة بأفيون.\n\n` +
          `نسأل الله أن يبارك فيه وينفع به ويجعله من أهل القرآن الكريم.\n\n` +
          `إدارة تحفيظ الرحمة للقرآن الكريم`;

        // Send as Document attachment
        await sendWhatsAppDocument({
          to: phone,
          channel: "ONSITE",
          documentUrl,
          fileName: `weekly-report-${student.fullName}.png`,
          caption,
        });

        sentCount++;
      } catch (err) {
        console.error(`FAILED TO GENERATE/SEND WEEKLY CARD FOR STUDENT ${student.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${sentCount} من أصل ${students.length} كروت أسبوعية بنجاح.`,
      sentCount,
    });
  } catch (error) {
    console.error("SEND WEEKLY CARD API ERROR:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ داخلي أثناء إرسال الكروت الأسبوعية" }, { status: 500 });
  }
}
