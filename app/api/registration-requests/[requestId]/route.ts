import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToSupabaseStorage } from "@/lib/supabase-storage";

const MAX_AUDIO_SIZE = 5 * 1024 * 1024;
const MAX_ID_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = ["audio/", "video/"];
const ALLOWED_ID_TYPES = ["image/", "application/pdf"];

function safeFileName(fileName: string, defaultName: string) {
  const extension = path.extname(fileName) || ".bin";
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${baseName || defaultName}-${Date.now()}${extension}`;
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const normalizedRequestId = String(requestId || "").trim();

    if (!normalizedRequestId) {
      return NextResponse.json({ error: "طلب التسجيل مطلوب" }, { status: 400 });
    }

    const request = await prisma.registrationRequest.findUnique({
      where: {
        id: normalizedRequestId,
      },
      select: {
        id: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "طلب التسجيل غير موجود" }, { status: 404 });
    }

    const formData = await req.formData();
    const audio = formData.get("audio");
    const idImage = formData.get("idImage");

    if (!(audio instanceof File) && !(idImage instanceof File)) {
      return NextResponse.json({ error: "لا يوجد ملف جديد للتحديث" }, { status: 400 });
    }

    if (audio instanceof File && audio.size > 0) {
      const audioError = validateUpload(audio, {
        maxSize: MAX_AUDIO_SIZE,
        allowedTypes: ALLOWED_AUDIO_TYPES,
        label: "التسجيل الصوتي",
      });

      if (audioError) {
        return NextResponse.json({ error: audioError }, { status: 400 });
      }
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

    const savedAudio =
      audio instanceof File && audio.size > 0
        ? await saveUploadedFile(audio, "registration-audio", "student-audio")
        : null;
    const savedIdImage =
      idImage instanceof File && idImage.size > 0
        ? await saveUploadedFile(idImage, "registration-ids", "student-id")
        : null;

    const updatedRequest = await prisma.registrationRequest.update({
      where: {
        id: request.id,
      },
      data: {
        ...(savedAudio
          ? {
              audioUrl: savedAudio.url,
              audioFileName: savedAudio.fileName,
            }
          : {}),
        ...(savedIdImage
          ? {
              idImageUrl: savedIdImage.url,
              idImageFileName: savedIdImage.fileName,
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("UPDATE REGISTRATION REQUEST FILES ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث ملفات طلب التسجيل" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const normalizedRequestId = String(requestId || "").trim();

    if (!normalizedRequestId) {
      return NextResponse.json({ error: "طلب التسجيل مطلوب" }, { status: 400 });
    }

    const request = await prisma.registrationRequest.findUnique({
      where: {
        id: normalizedRequestId,
      },
      select: {
        id: true,
        status: true,
        createdStudentId: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "طلب التسجيل غير موجود" }, { status: 404 });
    }

    if (request.status === "ACCEPTED" && request.createdStudentId) {
      return NextResponse.json(
        { error: "لا يمكن حذف طلب تم قبوله وإنشاء الطالب منه" },
        { status: 400 }
      );
    }

    await prisma.registrationRequest.delete({
      where: {
        id: request.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE REGISTRATION REQUEST ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف طلب التسجيل" },
      { status: 500 }
    );
  }
}
