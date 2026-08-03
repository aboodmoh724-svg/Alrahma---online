import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { appUrl } from "@/lib/app-url";

const execFileAsync = promisify(execFile);
const DEFAULT_LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

function getLocalUploadsDir() {
  return String(process.env.LOCAL_UPLOADS_DIR || "").trim() || DEFAULT_LOCAL_UPLOADS_DIR;
}

function chromiumCandidates() {
  return [
    process.env.CHROMIUM_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "/snap/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean) as string[];
}

async function resolveChromiumPath() {
  for (const candidate of chromiumCandidates()) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("لم يتم العثور على متصفح Chromium/Chrome لتوليد التقارير.");
}

export async function generateStudentProgressReportMedia(studentId: string, format: "pdf" | "png" = "pdf", pageHtml?: string) {
  const uploadsDir = getLocalUploadsDir();
  const reportDir = path.join(uploadsDir, "summer-progress-reports");
  const htmlPath = path.join(reportDir, `report-${studentId}.html`);
  const targetPath = path.join(reportDir, `report-${studentId}.${format}`);

  await fs.mkdir(reportDir, { recursive: true });

  let htmlToSave = pageHtml;
  if (!htmlToSave) {
    const port = process.env.PORT || 3005;
    const res = await fetch(`http://127.0.0.1:${port}/onsite/summer/parent-report/${studentId}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      htmlToSave = await res.text();
    }
  }

  if (htmlToSave) {
    await fs.writeFile(htmlPath, htmlToSave, "utf8");
  } else {
    return {
      mediaUrl: appUrl(`/onsite/summer/parent-report/${studentId}`),
      mediaPath: null,
    };
  }

  try {
    const chromiumPath = await resolveChromiumPath();

    if (format === "png") {
      await execFileAsync(chromiumPath, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--window-size=680,1050",
        `--screenshot=${targetPath}`,
        pathToFileURL(htmlPath).href,
      ]);
    } else {
      await execFileAsync(chromiumPath, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--allow-file-access-from-files",
        "--print-to-pdf-no-header",
        `--print-to-pdf=${targetPath}`,
        pathToFileURL(htmlPath).href,
      ]);
    }

    return {
      mediaUrl: appUrl(`/uploads/summer-progress-reports/report-${studentId}.${format}`),
      mediaPath: `/uploads/summer-progress-reports/report-${studentId}.${format}`,
    };
  } catch (error) {
    console.error(`Chromium ${format.toUpperCase()} Generation Error:`, error);
    return {
      mediaUrl: appUrl(`/onsite/summer/parent-report/${studentId}`),
      mediaPath: null,
    };
  }
}

export async function generateStudentProgressReportPdf(studentId: string, pageHtml?: string) {
  const result = await generateStudentProgressReportMedia(studentId, "pdf", pageHtml);
  return {
    pdfUrl: result.mediaUrl,
    pdfPath: result.mediaPath,
  };
}

export async function generateStudentProgressReportPng(studentId: string, pageHtml?: string) {
  const result = await generateStudentProgressReportMedia(studentId, "png", pageHtml);
  return {
    pngUrl: result.mediaUrl,
    pngPath: result.mediaPath,
  };
}
