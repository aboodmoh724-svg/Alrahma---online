import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { appUrl } from "@/lib/app-url";
import {
  teacherVisitDateLabel,
  teacherVisitTypeLabel,
  type TeacherVisitGeneralItem,
  type TeacherVisitMainItem,
  type TeacherVisitTypeValue,
} from "@/lib/teacher-visit-reports";

const execFileAsync = promisify(execFile);
const DEFAULT_LOCAL_UPLOADS_DIR = path.join(process.cwd(), "uploads");

function getLocalUploadsDir() {
  return String(process.env.LOCAL_UPLOADS_DIR || "").trim() || DEFAULT_LOCAL_UPLOADS_DIR;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

async function logoDataUrl() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const bytes = await fs.readFile(logoPath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function teacherVisitHtml(input: {
  visitNumber: number;
  supervisorName: string;
  teacherName: string;
  visitDate: string | Date;
  dayLabel: string;
  visitType: TeacherVisitTypeValue;
  trackLabel: string;
  periodLabel: string;
  overallEvaluation?: string | null;
  finalRecommendation?: string | null;
  generalNotes?: string | null;
  positiveNotes?: string | null;
  mainItems: TeacherVisitMainItem[];
  generalItems: TeacherVisitGeneralItem[];
  logoSrc: string;
}) {
  const mainItemsRows = input.mainItems
    .map(
      (item, index) => `
        <tr>
          <td class="index">${index + 1}</td>
          <td class="label">${escapeHtml(item.label)}</td>
          <td class="note">${escapeHtml(item.note || "-")}</td>
        </tr>
      `
    )
    .join("");
  const positiveSection = input.positiveNotes?.trim()
    ? `<div class="highlight-box"><h3>نقاط إيجابية لدى المعلم</h3><p>${escapeHtml(input.positiveNotes)}</p></div>`
    : "";

  const generalItemsRows = input.generalItems
    .map(
      (item, index) => `
        <tr>
          <td class="index">${index + 1}</td>
          <td class="label">${escapeHtml(item.label)}</td>
          <td class="eval">${escapeHtml(item.evaluation || "-")}</td>
        </tr>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>تقرير زيارة المعلم رقم ${input.visitNumber}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, "Noto Naskh Arabic", "Segoe UI", sans-serif; margin: 0; color: #173d42; background: #fffaf2; }
    .sheet { background: white; border: 1px solid #d9c8ad; border-radius: 18px; padding: 24px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #eadcc6; padding-bottom: 16px; margin-bottom: 18px; gap: 16px; }
    .title { text-align: right; flex: 1; }
    .title h1 { margin: 0; font-size: 30px; line-height: 1.4; }
    .title p { margin: 8px 0 0; color: #8a6335; font-size: 15px; font-weight: bold; }
    .logo { width: 78px; height: 78px; object-fit: contain; }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta td { border: 1px solid #e7dcc8; padding: 10px 12px; font-size: 13px; width: 25%; }
    .meta .heading { background: #f4eee1; font-weight: bold; color: #8a6335; }
    .section { margin-top: 20px; page-break-inside: avoid; }
    .section h2 { margin: 0 0 10px; border-right: 5px solid #1f6358; padding-right: 10px; font-size: 21px; color: #1f6358; }
    .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .table th, .table td { border: 1px solid #e7dcc8; padding: 10px 12px; vertical-align: top; font-size: 13px; }
    .table th { background: #f4eee1; color: #8a6335; font-size: 12px; }
    .index { width: 8%; text-align: center; font-weight: bold; }
    .label { width: 36%; font-weight: bold; }
    .note { width: 56%; line-height: 1.8; white-space: pre-wrap; }
    .eval { width: 24%; text-align: center; font-weight: bold; }
    .highlight-box { margin-top: 20px; border: 1px solid #b8d7cb; border-radius: 16px; background: #eef7f5; padding: 14px 16px; page-break-inside: avoid; }
    .highlight-box h3 { margin: 0 0 8px; font-size: 17px; color: #1f6358; }
    .highlight-box p { margin: 0; line-height: 1.9; white-space: pre-wrap; }
    .footer-box { margin-top: 18px; border: 1px solid #e7dcc8; border-radius: 18px; background: #fffaf2; padding: 14px 16px; }
    .footer-box h3 { margin: 0 0 8px; font-size: 16px; color: #8a6335; }
    .footer-box p { margin: 0; line-height: 1.9; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="title">
        <h1>تقرير زيارة المعلم</h1>
        <p>رقم الزيارة: ${input.visitNumber}</p>
      </div>
      <img class="logo" src="${input.logoSrc}" alt="شعار التحفيظ" />
    </div>
    <table class="meta">
      <tr><td class="heading">اسم المشرف</td><td>${escapeHtml(input.supervisorName)}</td><td class="heading">اسم المعلم</td><td>${escapeHtml(input.teacherName)}</td></tr>
      <tr><td class="heading">تاريخ الزيارة</td><td>${escapeHtml(teacherVisitDateLabel(input.visitDate))}</td><td class="heading">اليوم</td><td>${escapeHtml(input.dayLabel)}</td></tr>
      <tr><td class="heading">نوع الزيارة</td><td>${escapeHtml(teacherVisitTypeLabel(input.visitType))}</td><td class="heading">القسم / المسار</td><td>${escapeHtml(input.trackLabel)}</td></tr>
      <tr><td class="heading">الفترة</td><td>${escapeHtml(input.periodLabel)}</td><td class="heading">التقييم العام</td><td>${escapeHtml(input.overallEvaluation || "-")}</td></tr>
    </table>
    <div class="section">
      <h2>البنود الأساسية</h2>
      <table class="table">
        <thead><tr><th class="index">#</th><th class="label">البند</th><th class="note">ملاحظات المشرف</th></tr></thead>
        <tbody>${mainItemsRows}</tbody>
      </table>
    </div>
    <div class="section">
      <h2>البنود العامة</h2>
      <table class="table">
        <thead><tr><th class="index">#</th><th class="label">البند</th><th class="eval">التقييم</th></tr></thead>
        <tbody>${generalItemsRows}</tbody>
      </table>
    </div>
    ${positiveSection}
    <div class="footer-box"><h3>التوصية النهائية</h3><p>${escapeHtml(input.finalRecommendation || "-")}</p></div>
    <div class="footer-box"><h3>ملاحظات عامة</h3><p>${escapeHtml(input.generalNotes || "-")}</p></div>
  </div>
</body>
</html>`;
}

export async function generateTeacherVisitPdf(input: {
  visitNumber: number;
  supervisorName: string;
  teacherName: string;
  visitDate: string | Date;
  dayLabel: string;
  visitType: TeacherVisitTypeValue;
  trackLabel: string;
  periodLabel: string;
  overallEvaluation?: string | null;
  finalRecommendation?: string | null;
  generalNotes?: string | null;
  positiveNotes?: string | null;
  mainItems: TeacherVisitMainItem[];
  generalItems: TeacherVisitGeneralItem[];
}) {
  const uploadsDir = getLocalUploadsDir();
  const reportDir = path.join(uploadsDir, "teacher-visits");
  const htmlPath = path.join(reportDir, `visit-${input.visitNumber}.html`);
  const pdfPath = path.join(reportDir, `visit-${input.visitNumber}.pdf`);

  await fs.mkdir(reportDir, { recursive: true });

  const html = teacherVisitHtml({
    ...input,
    logoSrc: await logoDataUrl(),
  });

  await fs.writeFile(htmlPath, html, "utf8");

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
    htmlPath: `/uploads/teacher-visits/visit-${input.visitNumber}.html`,
    pdfPath: `/uploads/teacher-visits/visit-${input.visitNumber}.pdf`,
    pdfUrl: appUrl(`/uploads/teacher-visits/visit-${input.visitNumber}.pdf`),
  };
}
