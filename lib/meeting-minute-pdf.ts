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

async function imageDataUrl(fileName: string, mimeType: string) {
  const filePath = path.join(process.cwd(), "public", fileName);
  const bytes = await fs.readFile(filePath);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function listHtml(items: string[]) {
  if (!items.length) return `<p class="empty">لا يوجد</p>`;
  return `<ol>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ol>`;
}

function meetingMinuteHtml(input: {
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
  logoSrc: string;
  brandSrc: string;
}) {
  const participants = jsonList(input.participants);
  const agendaItems = jsonList(input.agendaItems);
  const decisions = jsonList(input.decisions);
  const notes = jsonList(input.notes);
  const dateLabel = `${formatDisplayDate(input.meetingDate)}${input.hijriDate ? ` - ${input.hijriDate}` : ""}`;
  const timeLabel = `${input.startTime || "-"} إلى ${input.endTime || "-"}`;

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>محضر اجتماع - ${escapeHtml(input.title)}</title>
  <style>
    @page { size: A4; margin: 9mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8f1e6;
      color: #183439;
      font-family: Arial, "Noto Naskh Arabic", "Segoe UI", sans-serif;
    }
    .sheet {
      min-height: 277mm;
      overflow: hidden;
      border: 1px solid #d8bf83;
      border-radius: 20px;
      background:
        radial-gradient(circle at 8% 10%, rgba(196, 154, 87, 0.16), transparent 18%),
        linear-gradient(180deg, #fffdf8 0%, #ffffff 44%, #fffaf2 100%);
      padding: 17px 18px;
      position: relative;
    }
    .sheet:before {
      content: "";
      position: absolute;
      inset: 10px;
      border: 1px solid rgba(216, 191, 131, 0.55);
      border-radius: 16px;
      pointer-events: none;
    }
    .top {
      display: grid;
      grid-template-columns: 72px 1fr 72px;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #d8bf83;
      padding: 0 4px 12px;
      position: relative;
      z-index: 1;
    }
    .logo {
      width: 66px;
      height: 66px;
      object-fit: contain;
      border-radius: 18px;
      background: #fffaf2;
      padding: 7px;
      border: 1px solid #eadcc4;
    }
    .title { text-align: center; }
    .kicker { margin: 0; color: #a87837; font-size: 12px; font-weight: 800; }
    h1 { margin: 4px 0 0; font-size: 28px; line-height: 1.35; }
    .subtitle {
      display: inline-block;
      margin-top: 7px;
      border-radius: 999px;
      background: #0a3f2a;
      color: white;
      padding: 5px 16px;
      font-size: 12px;
      font-weight: 800;
    }
    .meeting-title {
      margin: 15px 0 10px;
      border-radius: 18px;
      background: #0a3f2a;
      color: white;
      padding: 13px 18px;
      position: relative;
      z-index: 1;
    }
    .meeting-title p { margin: 0 0 4px; color: #d7b46c; font-size: 12px; font-weight: 800; }
    .meeting-title h2 { margin: 0; font-size: 23px; line-height: 1.45; }
    .meta {
      width: 100%;
      border-collapse: separate;
      border-spacing: 7px;
      margin: 0 -7px 8px;
      position: relative;
      z-index: 1;
    }
    .meta td {
      width: 25%;
      border: 1px solid #eadcc4;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.86);
      padding: 8px 10px;
      vertical-align: top;
    }
    .meta span { display: block; color: #a87837; font-size: 10px; font-weight: 800; margin-bottom: 4px; }
    .meta strong { display: block; color: #183439; font-size: 12px; line-height: 1.55; }
    .grid {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      gap: 9px;
      position: relative;
      z-index: 1;
    }
    .box {
      border: 1px solid #eadcc4;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.88);
      padding: 11px 13px;
      break-inside: avoid;
    }
    .box h3 {
      margin: 0 0 7px;
      color: #0a3f2a;
      font-size: 15px;
      line-height: 1.5;
      border-bottom: 1px solid #eadcc4;
      padding-bottom: 6px;
    }
    ol { margin: 0; padding: 0 21px 0 0; }
    li {
      margin: 0 0 5px;
      padding-right: 2px;
      color: #183439;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.75;
    }
    .participants li { margin-bottom: 3px; }
    .empty { margin: 0; color: rgba(24, 52, 57, 0.55); font-size: 12px; }
    .wide { grid-column: 1 / -1; }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 9px;
      position: relative;
      z-index: 1;
    }
    .signature {
      border-radius: 14px;
      background: #f6ead8;
      border: 1px solid #d8bf83;
      padding: 8px 10px;
      min-height: 54px;
    }
    .signature span { display: block; color: #9b713a; font-size: 10px; font-weight: 800; }
    .signature strong { display: block; margin-top: 5px; font-size: 12px; line-height: 1.5; }
    .footer {
      margin-top: 11px;
      border-top: 1px solid #d8bf83;
      padding-top: 7px;
      text-align: center;
      color: rgba(24, 52, 57, 0.65);
      font-size: 11px;
      font-weight: 700;
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  <main class="sheet">
    <header class="top">
      <img class="logo" src="${input.logoSrc}" alt="شعار التحفيظ" />
      <div class="title">
        <p class="kicker">تحفيظ الرحمة للقرآن الكريم</p>
        <h1>محضر اجتماع</h1>
        <span class="subtitle">قسم التعليم عن بعد</span>
      </div>
      <img class="logo" src="${input.brandSrc}" alt="شعار المنصة" />
    </header>

    <section class="meeting-title">
      <p>عنوان الاجتماع</p>
      <h2>${escapeHtml(input.title)}</h2>
    </section>

    <table class="meta">
      <tr>
        <td><span>نوع الاجتماع</span><strong>${escapeHtml(input.meetingType || "-")}</strong></td>
        <td><span>مكان الاجتماع</span><strong>${escapeHtml(input.location || "-")}</strong></td>
        <td><span>التاريخ</span><strong>${escapeHtml(dateLabel)}</strong></td>
        <td><span>الوقت</span><strong>${escapeHtml(timeLabel)}</strong></td>
      </tr>
    </table>

    <section class="grid">
      <div class="box participants">
        <h3>المشاركون</h3>
        ${listHtml(participants)}
      </div>
      <div class="box">
        <h3>محاور الاجتماع</h3>
        ${listHtml(agendaItems)}
      </div>
      <div class="box">
        <h3>القرارات والتوصيات</h3>
        ${listHtml(decisions)}
      </div>
      <div class="box">
        <h3>ملاحظات</h3>
        ${listHtml(notes)}
      </div>
    </section>

    <section class="signatures">
      <div class="signature"><span>تاريخ إعداد المحضر</span><strong>${escapeHtml(formatDisplayDate(input.preparedAt))}</strong></div>
      <div class="signature"><span>معد المحضر</span><strong>${escapeHtml(input.preparedBy || "-")}</strong></div>
      <div class="signature"><span>مدقق المحضر</span><strong>${escapeHtml(input.reviewedBy || "-")}</strong></div>
    </section>

    <footer class="footer">منصة الرحمة - محضر رسمي قابل للإرسال عبر الواتساب بصيغة نصية أو PDF</footer>
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

  const html = meetingMinuteHtml({
    ...input,
    logoSrc: await imageDataUrl("logo.png", "image/png"),
    brandSrc: await imageDataUrl("images/alrahma-logo-square.png", "image/png"),
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
    htmlPath: `/uploads/meeting-minutes/meeting-${input.id}.html`,
    pdfPath: `/uploads/meeting-minutes/meeting-${input.id}.pdf`,
    pdfUrl: appUrl(`/uploads/meeting-minutes/meeting-${input.id}.pdf`),
  };
}
