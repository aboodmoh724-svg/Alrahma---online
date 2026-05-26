import { promises as fs } from "fs";
import path from "path";

const DEFAULT_LOCAL_UPLOADS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");

export function getLocalUploadsDir() {
  return String(process.env.LOCAL_UPLOADS_DIR || "").trim() || DEFAULT_LOCAL_UPLOADS_DIR;
}

function cleanPath(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+/g, "/");
}

export function isLocalStoragePath(value: string | null | undefined) {
  return Boolean(value && !value.startsWith("http") && !value.startsWith("/uploads/"));
}

export function publicStorageUrl(filePath: string | null | undefined) {
  if (!filePath) return null;
  if (!isLocalStoragePath(filePath)) return filePath;
  return `/uploads/${cleanPath(filePath)}`;
}

export async function uploadToLocalStorage(file: File, folder: string, fileName: string) {
  const objectPath = cleanPath(`${folder}/${fileName}`);
  const outputPath = path.join(/*turbopackIgnore: true*/ getLocalUploadsDir(), objectPath);
  const bytes = await file.arrayBuffer();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(bytes));

  return objectPath;
}

