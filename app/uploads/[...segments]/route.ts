import { createReadStream } from "fs";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DEFAULT_LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

function getLocalUploadsDir() {
  return String(process.env.LOCAL_UPLOADS_DIR || "").trim() || DEFAULT_LOCAL_UPLOADS_DIR;
}

function contentTypeFor(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

function safeSegments(segments: string[]) {
  const cleaned = segments
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (cleaned.some((segment) => segment === "." || segment === ".." || segment.includes("\\"))) {
    return null;
  }

  return cleaned;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  try {
    const { segments } = await params;
    const safe = safeSegments(segments || []);

    if (!safe?.length) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    const filePath = path.join(getLocalUploadsDir(), ...safe);
    const fileStat = await fs.stat(filePath).catch(() => null);

    if (!fileStat?.isFile()) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    const stream = createReadStream(filePath);

    return new NextResponse(stream as never, {
      headers: {
        "Content-Type": contentTypeFor(filePath),
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("LOCAL UPLOAD READ ERROR =>", error);

    return NextResponse.json({ error: "تعذر قراءة الملف" }, { status: 500 });
  }
}
