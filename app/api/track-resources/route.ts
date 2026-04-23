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

function normalizeScope(value: unknown) {
  return value === "REGISTRATION" ? "REGISTRATION" : "TEACHER";
}

function safeFileName(fileName: string) {
  const extension = path.extname(fileName) || ".pdf";
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  return `${baseName || "teacher-resource"}-${Date.now()}${extension}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teacherId = String(url.searchParams.get("teacherId") || "").trim();
    const scope = normalizeScope(url.searchParams.get("scope"));

    const resources = await prisma.trackResource.findMany({
      where:
        scope === "REGISTRATION"
          ? {
              resourceScope: "REGISTRATION",
            }
          : teacherId
            ? {
                resourceScope: "TEACHER",
                teacherId,
              }
            : {
                resourceScope: "TEACHER",
              },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            studyMode: true,
          },
        },
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
      { error: "حدث خطأ أثناء جلب ملفات المعلمين" },
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
    const teacherId = String(formData.get("teacherId") || "").trim();
    const scope = normalizeScope(formData.get("scope"));
    const file = formData.get("file");

    if (!title) {
      return NextResponse.json({ error: "عنوان الملف مطلوب" }, { status: 400 });
    }

    if (scope === "TEACHER" && !teacherId) {
      return NextResponse.json({ error: "اختر المعلم أولا" }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    }

    if (file.size > MAX_RESOURCE_FILE_SIZE) {
      return NextResponse.json({ error: "الملف أكبر من الحجم المسموح" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "يرجى رفع ملف PDF فقط" }, { status: 400 });
    }

    const teacher =
      scope === "TEACHER"
        ? await prisma.user.findFirst({
            where: {
              id: teacherId,
              role: "TEACHER",
              studyMode: "REMOTE",
              isActive: true,
            },
            select: {
              id: true,
            },
          })
        : null;

    if (scope === "TEACHER" && !teacher) {
      return NextResponse.json({ error: "المعلم المحدد غير موجود" }, { status: 404 });
    }

    const fileName = safeFileName(file.name);
    const filePath = await uploadToSupabaseStorage(file, "track-resources", fileName);

    const existingRegistrationResource =
      scope === "REGISTRATION"
        ? await prisma.trackResource.findFirst({
            where: {
              resourceScope: "REGISTRATION",
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
            },
          })
        : null;

    const resource = existingRegistrationResource
      ? await prisma.trackResource.update({
          where: {
            id: existingRegistrationResource.id,
          },
          data: {
            title,
            description: description || null,
            track: null,
            teacherId: null,
            resourceScope: "REGISTRATION",
            fileName,
            fileUrl: filePath,
          },
          include: {
            teacher: {
              select: {
                id: true,
                fullName: true,
                studyMode: true,
              },
            },
          },
        })
      : await prisma.trackResource.create({
          data: {
            title,
            description: description || null,
            track: scope === "REGISTRATION" ? null : track,
            teacherId: teacher?.id || null,
            resourceScope: scope,
            fileName,
            fileUrl: filePath,
          },
          include: {
            teacher: {
              select: {
                id: true,
                fullName: true,
                studyMode: true,
              },
            },
          },
        });

    return NextResponse.json({
      success: true,
      resource,
    });
  } catch (error) {
    console.error("CREATE TRACK RESOURCE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء رفع الملف" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const resourceId = String(body.resourceId || "").trim();

    if (!resourceId) {
      return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    }

    const resource = await prisma.trackResource.findUnique({
      where: {
        id: resourceId,
      },
      select: {
        id: true,
      },
    });

    if (!resource) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    await prisma.trackResource.delete({
      where: {
        id: resource.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE TRACK RESOURCE ERROR =>", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الملف" },
      { status: 500 }
    );
  }
}
