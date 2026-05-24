import { NextResponse } from "next/server";
import { isMessageAutomationEnabled } from "@/lib/message-automation-settings";
import { renderMessageTemplate } from "@/lib/message-templates";
import { normalizePhoneDigits } from "@/lib/phone-number";
import { prisma } from "@/lib/prisma";
import { isWhatsAppConfigured, normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function yesNo(value: string) {
  return ["نعم", "yes", "true", "1"].includes(value.trim().toLowerCase());
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const studentName = text(formData, "studentName");
    const parentWhatsapp = normalizePhoneDigits(text(formData, "parentWhatsapp"));

    if (!studentName) {
      return NextResponse.json({ error: "اسم الطالب مطلوب" }, { status: 400 });
    }

    if (!parentWhatsapp) {
      return NextResponse.json({ error: "رقم ولي الأمر مطلوب" }, { status: 400 });
    }

    if (!yesNo(text(formData, "readGuidelines"))) {
      return NextResponse.json({ error: "يجب تأكيد قراءة التعليمات قبل إرسال الطلب" }, { status: 400 });
    }

    const age = text(formData, "age");
    const grade = text(formData, "grade");
    const schoolName = text(formData, "schoolName");
    const previousStudent = text(formData, "previousStudent");
    const memorizedAmount = text(formData, "memorizedAmount");
    const tajweedLevel = text(formData, "tajweedLevel");
    const goals = text(formData, "goals");
    const notes = text(formData, "notes");

    const request = await prisma.registrationRequest.create({
      data: {
        studyMode: "ONSITE_SYRIA",
        studentName,
        parentWhatsapp,
        previousStudent: yesNo(previousStudent),
        grade: [grade, age ? `العمر: ${age}` : "", schoolName ? `المدرسة: ${schoolName}` : ""]
          .filter(Boolean)
          .join(" - ") || null,
        gender: "ذكور",
        preferredPeriod: text(formData, "preferredPeriod") || null,
        previousStudy: previousStudent || null,
        memorizedAmount: memorizedAmount || null,
        tajweedLevel: tajweedLevel || null,
        readGuidelines: true,
        hasDevice: true,
        hasLearningIssues: false,
        notes: [goals ? `الأهداف: ${goals}` : "", notes].filter(Boolean).join("\n") || null,
      },
    });

    let whatsappSent = false;
    let whatsappWarning: string | null = null;
    const normalizedWhatsapp = normalizeWhatsAppNumber(parentWhatsapp);

    if (
      normalizedWhatsapp &&
      isWhatsAppConfigured("ONSITE_SYRIA") &&
      (await isMessageAutomationEnabled("REGISTRATION_RECEIVED_WHATSAPP"))
    ) {
      try {
        await sendWhatsAppText({
          to: normalizedWhatsapp,
          body: await renderMessageTemplate("REGISTRATION_RECEIVED", { studentName }),
          channel: "ONSITE_SYRIA",
        });
        whatsappSent = true;
      } catch (error) {
        console.error("SYRIA REGISTRATION WHATSAPP ERROR =>", error);
        whatsappWarning = "تم استلام الطلب، لكن تعذر إرسال رسالة واتساب تلقائية حاليا.";
      }
    }

    return NextResponse.json({ success: true, request, whatsappSent, whatsappWarning });
  } catch (error) {
    console.error("CREATE SYRIA REGISTRATION REQUEST ERROR =>", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال طلب التسجيل" }, { status: 500 });
  }
}
