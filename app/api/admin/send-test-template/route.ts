import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderMessageTemplate } from "@/lib/message-templates";
import { sendWhatsAppText } from "@/lib/whatsapp";

const TEST_PHONE = "963930181269";

const dummyVariables = {
  studentName: "عبدالرحمن الصالح",
  teacherName: "همام القناص",
  circleName: "حلقة عبدالله بن عباس - 1",
  reportDate: "2026-06-23",
  lessonName: "سورة البقرة من الآية 1 إلى 10",
  review: "سورة الفاتحة كاملة",
  homework: "حفظ سورة البقرة من الآية 11 إلى 15",
  note: "ممتاز ومثابر ما شاء الله تبارك الله",
  evaluationSummary: "*نتيجة التقييم:*\n- *الدرس الجديد:* *حافظ*\n- *المراجعة:* *حافظ*",
  zoomUrl: "https://zoom.us/j/123456789",
  startsAt: "16:00",
  endsAt: "17:00",
  periodLabel: "الفترة العصرية",
  amount: 50,
  currency: "USD",
  paidAmount: 150,
  remainingAmount: 0,
  visitNumber: "3",
  visitType: "دورية",
  visitDate: "2026-06-23",
  supervisorName: "حافظ الرحال",
  email: "teacher@example.com",
  password: "123456",
  loginUrl: "https://alrahma.ly/login",
  chatUrl: "https://alrahma.ly/chat",
  parentPhone: "+963 930 181 269",
  missingCount: 2,
  missingStudents: "أحمد، محمد",
  platformLabel: "قسم الحضوري (سوريا)",
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("alrahma_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "الرجاء تسجيل الدخول أولاً" }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "ADMIN",
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بإرسال رسائل اختبار" }, { status: 403 });
    }

    const body = await request.json();
    const { templateKey } = body;

    if (!templateKey) {
      return NextResponse.json({ error: "مفتاح القالب مطلوب" }, { status: 400 });
    }

    let messageText = "";

    if (templateKey === "SYRIA_DAILY_REPORT") {
      messageText =
        `السلام عليكم ورحمة الله وبركاته\n\n` +
        `تقرير الطالب اليومي - قسم سوريا\n\n` +
        `*الطالب:* ${dummyVariables.studentName}\n` +
        `*الحلقة:* ${dummyVariables.circleName}\n` +
        `*المعلم:* ${dummyVariables.teacherName}\n` +
        `*التاريخ:* ${dummyVariables.reportDate}\n\n` +
        `*الدرس:* ${dummyVariables.lessonName}\n` +
        `*المراجعة:* ${dummyVariables.review}\n` +
        `*الواجب:* ${dummyVariables.homework}\n\n` +
        `${dummyVariables.evaluationSummary}\n\n` +
        `*الملاحظات:* ${dummyVariables.note}\n\n` +
        `جزاكم الله خيرًا على المتابعة والحرص.\n\n` +
        `إدارة تحفيظ الرحمة للقرآن الكريم - سوريا`;
    } else if (templateKey === "SYRIA_ABSENCE") {
      messageText =
        `السلام عليكم ورحمة الله وبركاته\n\n` +
        `نفيدكم أن ابنكم الكريم / *${dummyVariables.studentName}*\n` +
        `غائب عن التحفيظ اليوم بتاريخ ${dummyVariables.reportDate} بدون عذر.\n\n` +
        `نرجو منكم الاهتمام بحضور ابنكم إلى التحفيظ لأن هذا يؤثر على مستواه التعليمي.\n\n` +
        `نشكر لكم حسن تعاونكم.\n\n` +
        `إدارة تحفيظ الرحمة للقرآن الكريم - سوريا`;
    } else {
      // Standard template
      messageText = await renderMessageTemplate(templateKey, dummyVariables);
    }

    // Send the WhatsApp message using ONSITE_SYRIA channel
    await sendWhatsAppText({
      to: TEST_PHONE,
      body: messageText,
      channel: "ONSITE_SYRIA",
      source: "ADMIN_TEST_SEND",
    });

    return NextResponse.json({
      success: true,
      phone: TEST_PHONE,
      message: messageText,
    });
  } catch (error) {
    console.error("SEND TEST TEMPLATE ERROR =>", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حدث خطأ أثناء إرسال رسالة الاختبار" },
      { status: 500 }
    );
  }
}
