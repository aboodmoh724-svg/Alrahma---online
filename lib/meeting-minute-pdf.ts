import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";
import { appUrl } from "@/lib/app-url";
import { getLocalUploadsDir } from "@/lib/local-storage";

const execFileAsync = promisify(execFile);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function formatDisplayDate(date: Date | null | undefined) {
  if (!date) return "غير محدد";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(date);
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

function tableRows(items: string[], options?: { striped?: boolean }) {
  const list = items.length ? items : ["لا يوجد"];
  return list
    .map(
      (item, index) => `
        <tr class="${options?.striped && index % 2 === 0 ? "tint" : ""}">
          <td class="num">${index + 1}</td>
          <td class="value">${escapeHtml(item)}</td>
        </tr>
      `
    )
    .join("");
}

function typeCell(type: string | null | undefined, value: string) {
  return `<span class="${type === value ? "meeting-type active" : "meeting-type"}">${escapeHtml(value)}</span>`;
}

function meetingMinuteHtml(input: {
  id: string;
  title: string;
  meetingType?: string | null;
  location?: string | null;
  meetingDate?: Date | null;
  hijriDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  preparedAt?: Date | null;
  preparedBy?: string | null;
  reviewedBy?: string | null;
  participants: unknown;
  agendaItems: unknown;
  decisions: unknown;
  notes: unknown;
}) {
  const dateLabel = `${formatDisplayDate(input.meetingDate)}${input.hijriDate ? ` - ${input.hijriDate}` : ""}`;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>محضر اجتماع - ${escapeHtml(input.title)}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #ffffff;
      color: #1c2d31;
      font-family: Arial, "Noto Naskh Arabic", "Segoe UI", sans-serif;
    }
    .sheet { width: 100%; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .minute-table { border: 2px solid #000; }
    td {
      border: 2px solid #000;
      padding: 9px 10px;
      text-align: center;
      vertical-align: middle;
      font-size: 14px;
      line-height: 1.75;
      font-weight: 700;
    }
    .green { background: #76923c; color: #fff; font-weight: 900; }
    .gray { background: #d9d9d9; font-weight: 900; }
    .label { width: 16%; background: #f2f2f2; font-size: 18px; font-weight: 900; }
    .title-label { width: 16%; font-size: 24px; line-height: 1.45; }
    .title-value { font-size: 20px; font-weight: 900; line-height: 1.7; }
    .meeting-type {
      display: inline-block;
      min-width: 54px;
      border: 1px solid #000;
      padding: 6px 8px;
      margin: 0 2px;
      background: #fff;
      color: #1c2d31;
      font-size: 12px;
      font-weight: 900;
    }
    .meeting-type.active { background: #76923c; color: #fff; }
    .num {
      width: 46px;
      background: #d9d9d9;
      font-weight: 900;
    }
    .value {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.85;
    }
    .tint .value { background: #ebf6f9; }
    .muted { color: #76923c; font-weight: 900; }
    .footer td { font-size: 15px; font-weight: 900; }
  </style>
</head>
<body>
  <main class="sheet">
    <table class="minute-table">
      <tbody>
        <tr>
          <td class="green title-label" rowspan="2">محضر اجتماع</td>
          <td class="gray" colspan="2">عنوان الاجتماع</td>
          <td class="gray">نوع الاجتماع</td>
        </tr>
        <tr>
          <td class="title-value" colspan="2">${escapeHtml(input.title)}</td>
          <td>
            ${typeCell(input.meetingType, "دوري")}
            ${typeCell(input.meetingType, "فصلي")}
            ${typeCell(input.meetingType, "سنوي")}
            ${typeCell(input.meetingType, "طارئ")}
          </td>
        </tr>
        <tr>
          <td class="label">مكان الاجتماع</td>
          <td>${escapeHtml(input.location || "-")}</td>
          <td class="label">تاريخ الاجتماع</td>
          <td>${escapeHtml(dateLabel)}</td>
        </tr>
        <tr>
          <td class="label">المشاركون</td>
          <td colspan="3" style="padding:0;">
            <table>${tableRows(jsonList(input.participants))}</table>
          </td>
        </tr>
        <tr>
          <td class="label">محاور الاجتماع</td>
          <td colspan="3" style="padding:0;">
            <table>${tableRows(jsonList(input.agendaItems), { striped: true })}</table>
          </td>
        </tr>
        <tr>
          <td class="label">قرارات وتوصيات الاجتماع</td>
          <td colspan="3" style="padding:0;">
            <table>${tableRows(jsonList(input.decisions), { striped: true })}</table>
          </td>
        </tr>
        <tr>
          <td class="label">ملاحظات</td>
          <td colspan="3" style="padding:0;">
            <table>${tableRows(jsonList(input.notes))}</table>
          </td>
        </tr>
        <tr>
          <td class="label">وقت بداية الاجتماع</td>
          <td>${escapeHtml(input.startTime || "-")}</td>
          <td class="label">وقت انتهاء الاجتماع</td>
          <td>${escapeHtml(input.endTime || "-")}</td>
        </tr>
        <tr>
          <td class="label">معد المحضر</td>
          <td>${escapeHtml(input.preparedBy || "-")}</td>
          <td class="label">تاريخ إعداد المحضر</td>
          <td>${escapeHtml(formatDisplayDate(input.preparedAt))}</td>
        </tr>
        <tr class="footer">
          <td class="green">إدارة منصة الرحمة</td>
          <td>قسم التعليم عن بعد</td>
          <td class="gray">مدقق المحضر</td>
          <td>${escapeHtml(input.reviewedBy || "-")}</td>
        </tr>
      </tbody>
    </table>
  </main>
</body>
</html>`;
}

export async function generateMeetingMinutePdf(input: {
  id: string;
  title: string;
  meetingType?: string | null;
  location?: string | null;
  meetingDate?: Date | null;
  hijriDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  preparedAt?: Date | null;
  preparedBy?: string | null;
  reviewedBy?: string | null;
  participants: unknown;
  agendaItems: unknown;
  decisions: unknown;
  notes: unknown;
}) {
  const reportDir = path.join(getLocalUploadsDir(), "meeting-minutes");
  const htmlPath = path.join(reportDir, `meeting-${input.id}.html`);
  const pdfPath = path.join(reportDir, `meeting-${input.id}.pdf`);

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(htmlPath, meetingMinuteHtml(input), "utf8");

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
    htmlPath: `/uploads/meeting-minutes/meeting-${input.id}.html`,
    pdfPath: `/uploads/meeting-minutes/meeting-${input.id}.pdf`,
    pdfUrl: appUrl(`/uploads/meeting-minutes/meeting-${input.id}.pdf`),
  };
}
