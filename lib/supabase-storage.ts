import { promises as fs } from "fs";
import path from "path";

const DEFAULT_BUCKET = "alrahma-uploads";
const DEFAULT_LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

function storageDriver() {
  return String(process.env.STORAGE_DRIVER || "supabase").trim().toLowerCase() === "local"
    ? "local"
    : "supabase";
}

function getLocalUploadsDir() {
  return String(process.env.LOCAL_UPLOADS_DIR || "").trim() || DEFAULT_LOCAL_UPLOADS_DIR;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for file uploads");
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
    bucket,
  };
}

function cleanPath(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+/g, "/");
}

function localUploadPublicPath(filePath: string) {
  return `/uploads/${cleanPath(filePath)}`;
}

function storageRequestHeaders(contentType?: string) {
  const { serviceRoleKey } = getSupabaseConfig();

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export function isStoredInSupabase(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return !value.startsWith("http") && !value.startsWith("/uploads/");
}

export async function uploadToSupabaseStorage(file: File, folder: string, fileName: string) {
  if (storageDriver() === "local") {
    const objectPath = cleanPath(`${folder}/${fileName}`);
    const outputPath = path.join(getLocalUploadsDir(), objectPath);
    const bytes = await file.arrayBuffer();

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(bytes));

    return objectPath;
  }

  const { url, bucket } = getSupabaseConfig();
  const objectPath = cleanPath(`${folder}/${fileName}`);
  const uploadUrl = `${url}/storage/v1/object/${bucket}/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`;
  const bytes = await file.arrayBuffer();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      ...storageRequestHeaders(file.type || "application/octet-stream"),
      "x-upsert": "false",
    },
    body: Buffer.from(bytes),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase upload failed: ${message}`);
  }

  return objectPath;
}

export async function createSignedStorageUrl(filePath: string | null | undefined, expiresIn = 60 * 60) {
  if (!filePath || !isStoredInSupabase(filePath)) {
    return filePath || null;
  }

  if (storageDriver() === "local") {
    return localUploadPublicPath(filePath);
  }

  const { url, bucket } = getSupabaseConfig();
  const objectPath = cleanPath(filePath);
  const signUrl = `${url}/storage/v1/object/sign/${bucket}/${encodeURIComponent(objectPath).replace(/%2F/g, "/")}`;

  const response = await fetch(signUrl, {
    method: "POST",
    headers: {
      ...storageRequestHeaders("application/json"),
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase signed URL failed: ${message}`);
  }

  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL || data.signedUrl;

  if (!signedPath) {
    return null;
  }

  return signedPath.startsWith("http") ? signedPath : `${url}/storage/v1${signedPath}`;
}
