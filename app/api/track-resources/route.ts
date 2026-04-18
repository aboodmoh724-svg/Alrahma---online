import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl, uploadToSupabaseStorage } from "@/lib/supabase-storage";

const MAX_RESOURCE_FILE_SIZE = 25 * 1024 * 1024;

function normalizeTrack(value: unknown) {
  const track = String(value || "").trim();
  const allowedTracks = ["HIJAA", "RUBAI", "FARDI", "TILAWA"];

  return allowedTracks.includes(track) ? track : null;
}

function safeFileName(fileName: string) {
  const extension = path.extname(fileName) || ".pdf";
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${baseName || "track-resource"}-${Date.now()}${extension}`;
}

export async function GET() {
  try {
    const resources = await prisma.trackResource.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    const resourcesWithSignedUrls = await Promise.all(
      resources.map(async (resource) => ({
        ...resource,
        fileUrl: await createSignedStorageUrl(resource.fileUrl),
      }))
    );

    return NextResponse.json({
      success: true,
      resources: resourcesWithSignedUrls,
    });
  } catch (error) {
    console.error("GET TRACK RESOURCES ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب ملفات المسارات" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const track = normalizeTrack(formData.get("track"));
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json({ error: "عنوان الملف مطلوب" }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    }

    if (file.size > MAX_RESOURCE_FILE_SIZE) {
      return NextResponse.json({ error: "ملف المسار أكبر من الحجم المسموح" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "يرجى رفع ملف PDF فقط" }, { status: 400 });
    }

    const fileName = safeFileName(file.name);
    const filePath = await uploadToSupabaseStorage(file, "track-resources", fileName);

    const resource = await prisma.trackResource.create({
      data: {
        title,
        description: description || null,
        track,
        fileName,
        fileUrl: filePath,
      },
    });

    return NextResponse.json({
      success: true,
      resource,
    });
  } catch (error) {
    console.error("CREATE TRACK RESOURCE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء رفع ملف المسار" },
      { status: 500 }
    );
  }
}
