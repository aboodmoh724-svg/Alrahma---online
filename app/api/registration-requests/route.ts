import path from "path";
import { NextResponse } from "next/server";
import { registrationReceivedEmail, sendEmail } from "@/lib/email";
import { renderMessageTemplate } from "@/lib/message-templates";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl, uploadToSupabaseStorage } from "@/lib/supabase-storage";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppNumber,
  registrationAcceptedWhatsAppMessage,
  sendWhatsAppText,
} from "@/lib/whatsapp";

const MAX_AUDIO_SIZE = 5 * 1024 * 1024;
const MAX_ID_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = ["audio/", "video/"];
const ALLOWED_ID_TYPES = ["image/", "application/pdf"];
const DEFAULT_TUITION_AMOUNT = 250;
const REGISTRATION_REQUESTS_LAST_SEEN_KEY = "registration_requests:last_seen_at";
const TRACK_TUITION: Record<string, number> = {
  HIJAA: 250,
  TILAWA: 250,
  RUBAI: 250,
  FARDI: 600,
};

async function generateStudentCode() {
  const studentsCount = await prisma.student.count();

  for (let offset = 1; offset < 1000; offset += 1) {
    const code = `ST-${1000 + studentsCount + offset}`;
    const existingStudent = await prisma.student.findUnique({
      where: {
        studentCode: code,
      },
      select: {
        id: true,
      },
    });

    if (!existingStudent) {
      return code;
    }
  }

  return `ST-${Date.now()}`;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "yes" || value === "نعم";
}

function parseDate(value: unknown) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeFileName(fileName: string, defaultName = "uploaded-file") {
  const extension = path.extname(fileName) || ".webm";
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${baseName || defaultName}-${Date.now()}${extension}`;
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getBoolean(formData: FormData, key: string) {
  return parseBoolean(formData.get(key));
}

function parseAmount(value: unknown) {
  const amount = Number(String(value || "").replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function getExpectedTuitionAmount(requestedTracks: string | null | undefined, circleTrack?: string | null) {
  const tracks = [
    ...(circleTrack ? [circleTrack] : []),
    ...String(requestedTracks || "")
      .split(",")
      .map((track) => track.trim())
      .filter(Boolean),
  ];

  if (tracks.includes("FARDI")) return TRACK_TUITION.FARDI;
  const firstPricedTrack = tracks.find((track) => TRACK_TUITION[track]);

  return firstPricedTrack ? TRACK_TUITION[firstPricedTrack] : DEFAULT_TUITION_AMOUNT;
}

function isAllowedFileType(file: File, allowedTypes: string[]) {
  return allowedTypes.some((type) =>
    type.endsWith("/") ? file.type.startsWith(type) : file.type === type
  );
}

function validateUpload(file: File, options: { maxSize: number; allowedTypes: string[]; label: string }) {
  if (file.size > options.maxSize) {
    return `${options.label} أكبر من الحجم المسموح`;
  }

  if (!isAllowedFileType(file, options.allowedTypes)) {
    return `نوع ${options.label} غير مسموح`;
  }

  return null;
}

async function saveUploadedFile(file: File, folder: string, defaultName: string) {
  const fileName = safeFileName(file.name, defaultName);
  const filePath = await uploadToSupabaseStorage(file, folder, fileName);

  return {
    fileName,
    url: filePath,
  };
}

export async function GET() {
  try {
    const requests = await prisma.registrationRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    const requestsWithSignedUrls = await Promise.all(
      requests.map(async (request) => ({
        ...request,
        audioUrl: await createSignedStorageUrl(request.audioUrl),
        idImageUrl: await createSignedStorageUrl(request.idImageUrl),
      }))
    );

    return NextResponse.json({
      success: true,
      requests: requestsWithSignedUrls,
    });
  } catch (error) {
    console.error("GET REGISTRATION REQUESTS ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب طلبات التسجيل" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const studentName = getString(formData, "studentName");
    const parentWhatsapp = getString(formData, "parentWhatsapp");
    const audio = formData.get("audio");
    const idImage = formData.get("idImage");

    if (!studentName) {
      return NextResponse.json({ error: "اسم الطالب مطلوب" }, { status: 400 });
    }

    if (!parentWhatsapp) {
      return NextResponse.json({ error: "رقم ولي الأمر مطلوب" }, { status: 400 });
    }

    if (!getBoolean(formData, "readGuidelines")) {
      return NextResponse.json(
        { error: "يجب تأكيد قراءة التعليمات والتوجيهات" },
        { status: 400 }
      );
    }

    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json(
        { error: "تسجيل آية الكرسي بصوت الطالب مطلوب" },
        { status: 400 }
      );
    }

    const audioError = validateUpload(audio, {
      maxSize: MAX_AUDIO_SIZE,
      allowedTypes: ALLOWED_AUDIO_TYPES,
      label: "تسجيل آية الكرسي",
    });

    if (audioError) {
      return NextResponse.json({ error: audioError }, { status: 400 });
    }

    if (idImage instanceof File && idImage.size > 0) {
      const idImageError = validateUpload(idImage, {
        maxSize: MAX_ID_FILE_SIZE,
        allowedTypes: ALLOWED_ID_TYPES,
        label: "ملف الهوية أو الإقامة",
      });

      if (idImageError) {
        return NextResponse.json({ error: idImageError }, { status: 400 });
      }
    }

    const savedAudio = await saveUploadedFile(audio, "registration-audio", "student-audio");
    const savedIdImage =
      idImage instanceof File && idImage.size > 0
        ? await saveUploadedFile(idImage, "registration-ids", "student-id")
        : null;

    const request = await prisma.registrationRequest.create({
      data: {
        studentName,
        parentWhatsapp,
        previousStudent: getBoolean(formData, "previousStudent"),
        birthDate: parseDate(formData.get("birthDate")),
        grade: getString(formData, "grade") || null,
        gender: "ذكور",
        nationality: getString(formData, "nationality") || null,
        country: getString(formData, "country") || null,
        fatherAlive: getBoolean(formData, "fatherAlive"),
        motherAlive: getBoolean(formData, "motherAlive"),
        livingWith: getString(formData, "livingWith") || null,
        fatherEducation: getString(formData, "fatherEducation") || null,
        motherEducation: getString(formData, "motherEducation") || null,
        idImageUrl: savedIdImage?.url || null,
        idImageFileName: savedIdImage?.fileName || null,
        preferredPeriod: getString(formData, "preferredPeriod") || null,
        parentEmail: getString(formData, "parentEmail") || null,
        previousStudy: formData.getAll("previousStudy").join(",") || null,
        memorizedAmount: getString(formData, "memorizedAmount") || null,
        readingLevel: getString(formData, "readingLevel") || null,
        tajweedLevel: getString(formData, "tajweedLevel") || null,
        hasLearningIssues: getBoolean(formData, "hasLearningIssues"),
        learningIssuesNote: getString(formData, "notes") || null,
        hasDevice: getBoolean(formData, "hasDevice"),
        requestedTracks: formData.getAll("requestedTracks").join(",") || null,
        readGuidelines: getBoolean(formData, "readGuidelines"),
        audioUrl: savedAudio.url,
        audioFileName: savedAudio.fileName,
        notes: getString(formData, "notes") || null,
      },
    });

    const parentEmail = getString(formData, "parentEmail");
    let emailSent = false;
    let emailWarning: string | null = null;
    let whatsappSent = false;
    let whatsappWarning: string | null = null;

    if (parentEmail) {
      try {
        const emailContent = registrationReceivedEmail(studentName);
        await sendEmail({
          to: parentEmail,
          subject: emailContent.subject,
          text: emailContent.text,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("REGISTRATION EMAIL ERROR =>", emailError);
        emailWarning = "تم استلام الطلب، لكن لم يتم إرسال رسالة التأكيد عبر الإيميل حاليا.";
      }
    }

    const normalizedWhatsapp = normalizeWhatsAppNumber(parentWhatsapp);

    if (normalizedWhatsapp && isWhatsAppConfigured()) {
      try {
        const whatsAppMessage = await renderMessageTemplate("REGISTRATION_RECEIVED", {
          studentName,
        });

        await sendWhatsAppText({
          to: normalizedWhatsapp,
          body: whatsAppMessage,
          channel: "REMOTE",
        });
        whatsappSent = true;
      } catch (whatsappError) {
        console.error("REGISTRATION WHATSAPP ERROR =>", whatsappError);
        whatsappWarning = "تم استلام الطلب، لكن تعذر إرسال رسالة واتساب تلقائية حاليا.";
      }
    }

    return NextResponse.json({
      success: true,
      request,
      emailSent,
      emailWarning,
      whatsappSent,
      whatsappWarning,
    });
  } catch (error) {
    console.error("CREATE REGISTRATION REQUEST ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال طلب التسجيل" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const action = String(body.action || "").trim();

    if (action === "MARK_SEEN") {
      const seenAt = new Date().toISOString();

      await prisma.appSetting.upsert({
        where: { key: REGISTRATION_REQUESTS_LAST_SEEN_KEY },
        update: { value: { seenAt } },
        create: {
          key: REGISTRATION_REQUESTS_LAST_SEEN_KEY,
          value: { seenAt },
        },
      });

      return NextResponse.json({ success: true });
    }

    const requestId = String(body.requestId || "").trim();

    if (!requestId) {
      return NextResponse.json({ error: "طلب التسجيل مطلوب" }, { status: 400 });
    }

    const request = await prisma.registrationRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "طلب التسجيل غير موجود" }, { status: 404 });
    }

    if (action === "REJECT") {
      const updatedRequest = await prisma.registrationRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ success: true, request: updatedRequest });
    }

    if (action === "SEND_ACCEPTANCE_MESSAGE") {
      if (request.status !== "ACCEPTED" || !request.createdStudentId) {
        return NextResponse.json(
          { error: "يجب قبول الطلب وإنشاء الطالب أولا قبل إرسال رسالة القبول" },
          { status: 400 }
        );
      }

      if (!isWhatsAppConfigured()) {
        return NextResponse.json({ error: "خدمة واتساب غير مفعلة حاليا" }, { status: 400 });
      }

      const createdStudent = await prisma.student.findUnique({
        where: {
          id: request.createdStudentId,
        },
        select: {
          fullName: true,
          parentWhatsapp: true,
          circle: {
            select: {
              name: true,
              zoomUrl: true,
            },
          },
          teacher: {
            select: {
              fullName: true,
            },
          },
        },
      });

      if (!createdStudent) {
        return NextResponse.json({ error: "الطالب المرتبط بالطلب غير موجود" }, { status: 404 });
      }

      const normalizedWhatsapp = normalizeWhatsAppNumber(createdStudent.parentWhatsapp || "");

      if (!normalizedWhatsapp) {
        return NextResponse.json({ error: "رقم ولي الأمر غير صالح للإرسال" }, { status: 400 });
      }

      await sendWhatsAppText({
        to: normalizedWhatsapp,
        body: registrationAcceptedWhatsAppMessage({
          studentName: createdStudent.fullName || request.studentName,
          circleName: createdStudent.circle?.name || null,
          teacherName: createdStudent.teacher?.fullName || null,
          zoomUrl: createdStudent.circle?.zoomUrl || null,
          scheduleDetails: String(body.scheduleDetails || "").trim() || null,
        }),
        channel: "REMOTE",
      });

      return NextResponse.json({ success: true });
    }

    if (action !== "ACCEPT") {
      return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
    }

    const circleId = String(body.circleId || "").trim();
    const teacherIdFromBody = String(body.teacherId || "").trim();
    const hasFinanceAmountOverride =
      body.financeAmount !== undefined && body.financeAmount !== null && String(body.financeAmount).trim() !== "";
    const financeAmountFromBody = parseAmount(body.financeAmount);
    const financeCurrency = String(body.financeCurrency || "USD").trim() || "USD";

    const circle = circleId
      ? await prisma.circle.findUnique({
          where: { id: circleId },
          select: { id: true, teacherId: true, studyMode: true, track: true },
        })
      : null;

    const teacherId = circle?.teacherId || teacherIdFromBody;

    if (!teacherId) {
      return NextResponse.json(
        { error: "اختر حلقة لها معلم أو اختر معلما قبل قبول الطلب" },
        { status: 400 }
      );
    }

    if (request.status === "ACCEPTED" && request.createdStudentId) {
      return NextResponse.json({ error: "هذا الطلب مقبول سابقا" }, { status: 400 });
    }

    const expectedTuitionAmount =
      hasFinanceAmountOverride
        ? financeAmountFromBody
        : getExpectedTuitionAmount(request.requestedTracks, circle?.track);

    const studentCode = await generateStudentCode();
    const { student, updatedRequest } = await prisma.$transaction(async (tx) => {
      const createdStudent = await tx.student.create({
        data: {
          studentCode,
          fullName: request.studentName,
          parentWhatsapp: request.parentWhatsapp,
          parentEmail: request.parentEmail,
          teacherId,
          circleId: circle?.id || null,
          studyMode: circle?.studyMode || "REMOTE",
          isActive: true,
        },
      });

      await tx.studentFinanceAccount.create({
        data: {
          studentId: createdStudent.id,
          totalAmount: expectedTuitionAmount,
          discountAmount: 0,
          currency: financeCurrency,
          notes: `تم إنشاء الرسوم تلقائيا من طلب التسجيل. المسارات المطلوبة: ${request.requestedTracks || "-"}`,
        },
      });

      const acceptedRequest = await tx.registrationRequest.update({
        where: { id: request.id },
        data: {
          status: "ACCEPTED",
          createdStudentId: createdStudent.id,
        },
      });

      return {
        student: createdStudent,
        updatedRequest: acceptedRequest,
      };
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      student,
      finance: {
        totalAmount: expectedTuitionAmount,
        currency: financeCurrency,
      },
    });
  } catch (error) {
    console.error("UPDATE REGISTRATION REQUEST ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء مراجعة طلب التسجيل" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const deleted = await prisma.registrationRequest.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error("DELETE ALL REGISTRATION REQUESTS ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء مسح طلبات التسجيل" },
      { status: 500 }
    );
  }
}
