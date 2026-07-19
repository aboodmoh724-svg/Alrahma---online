import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import path from "path";

// Candidates for chromium executable path
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
  return undefined; // Let Puppeteer find it if none of the candidates match
}

export async function captureWeeklyCard(studentId: string, baseUrl: string): Promise<{ relativePath: string; filename: string }> {
  const url = `${baseUrl}/onsite/summer/admin/weekly-card/${studentId}`;
  
  const uploadDir = path.join(process.cwd(), "uploads", "summer-weekly");
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filename = `${studentId}-${Date.now()}.png`;
  const outputPath = path.join(uploadDir, filename);

  const executablePath = await resolveChromiumPath();
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security"
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport matching the weekly card layout (760px) and a height
    await page.setViewport({
      width: 760,
      height: 1280,
      deviceScaleFactor: 2, // High resolution/retina quality screenshot
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait a brief moment to ensure fonts load completely
    await new Promise((resolve) => setTimeout(resolve, 800));

    await page.screenshot({
      path: outputPath,
      fullPage: true, // Capture the full length
    });

    return {
      relativePath: `uploads/summer-weekly/${filename}`,
      filename,
    };
  } finally {
    await browser.close();
  }
}
