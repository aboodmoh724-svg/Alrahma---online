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

  throw new Error("لم يتم العثور على متصفح Chromium/Chrome لتوليد PDF.");
}

export async function generateStudentProgressReportPdf(studentId: string, pageHtml?: string) {
  const uploadsDir = getLocalUploadsDir();
  const reportDir = path.join(uploadsDir, "summer-progress-reports");
  const htmlPath = path.join(reportDir, `report-${studentId}.html`);
  const pdfPath = path.join(reportDir, `report-${studentId}.pdf`);

  await fs.mkdir(reportDir, { recursive: true });

  let htmlToSave = pageHtml;
  if (!htmlToSave) {
    // Fetch directly from running app server
    const port = process.env.PORT || 3005;
    const res = await fetch(`http://127.0.0.1:${port}/onsite/summer/parent-report/${studentId}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      htmlToSave = await res.text();
    }
  }

  if (htmlToSave) {
    await fs.writeFile(htmlPath, htmlToSave, "utf8");
  } else {
    // Return direct link if HTML fetch isn't available
    return {
      pdfUrl: appUrl(`/onsite/summer/parent-report/${studentId}`),
      pdfPath: null,
    };
  }

  try {
    const chromiumPath = await resolveChromiumPath();
    await execFileAsync(chromiumPath, [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--allow-file-access-from-files",
      "--print-to-pdf-no-header",
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ]);

    return {
      pdfUrl: appUrl(`/uploads/summer-progress-reports/report-${studentId}.pdf`),
      pdfPath: `/uploads/summer-progress-reports/report-${studentId}.pdf`,
    };
  } catch (error) {
    console.error("Chromium PDF Generation Error:", error);
    return {
      pdfUrl: appUrl(`/onsite/summer/parent-report/${studentId}`),
      pdfPath: null,
    };
  }
}
