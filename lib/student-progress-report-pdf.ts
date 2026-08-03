import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { evaluateStudent, getCourseMeta, type DailyReportData, type Track } from "@/lib/summer-evaluation";
import { getLocalDayOfWeek, toLocalDateKey } from "@/lib/date-utils";
import { generateStudentReportPdfHtml } from "@/lib/student-progress-report-pdf-template";

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

function countWorkingDays(start: string, end: string): number {
  let count = 0;
  const s = new Date(start);
  const e = new Date(end);
  const cur = new Date(s);
  while (cur <= e) {
    const dow = getLocalDayOfWeek(cur);
    if (dow !== 1) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function generateStudentProgressReportMedia(studentId: string, format: "pdf" | "png" = "pdf") {
  const uploadsDir = getLocalUploadsDir();
  const reportDir = path.join(uploadsDir, "summer-progress-reports");
  const htmlPath = path.join(reportDir, `report-${studentId}.html`);
  const targetPath = path.join(reportDir, `report-${studentId}.${format}`);

  await fs.mkdir(reportDir, { recursive: true });

  const student = await prisma.student.findFirst({
    where: {
      OR: [{ id: studentId }, { studentCode: studentId }],
      isActive: true,
      studyMode: "ONSITE_SUMMER",
    },
    select: {
      id: true,
      fullName: true,
      summerGroup: true,
      teacher: { select: { fullName: true } },
      circle: { select: { name: true } },
      summerReports: {
        where: { dateKey: { gte: "2026-07-09" } },
        select: {
          dateKey: true, status: true,
          quranNew: true, quranRevision: true, quranTaqeen: true,
          noorLearned: true, noorHomework: true, noorHomeworkGrade: true, noorParticipation: true,
          behaviorGrade: true, createdAt: true,
        },
        orderBy: { dateKey: "asc" },
      },
    },
  });

  if (!student) {
    return {
      mediaUrl: appUrl(`/onsite/summer/parent-report/${studentId}`),
      mediaPath: null,
    };
  }

  const courseMeta = getCourseMeta();
  const todayStr = toLocalDateKey(new Date());
  const effectiveEnd = todayStr < courseMeta.courseEnd ? todayStr : courseMeta.courseEnd;
  const totalWorkingDays = countWorkingDays(courseMeta.courseStart, effectiveEnd);
  const track: Track = student.summerGroup === "NOOR_AL_BAYAN" ? "NOOR_AL_BAYAN" : "QURAN";

  const reports: DailyReportData[] = student.summerReports.map((r) => ({
    dateKey: r.dateKey,
    status: r.status as "PRESENT" | "ABSENT",
    quranNew: r.quranNew, quranRevision: r.quranRevision, quranTaqeen: r.quranTaqeen,
    noorLearned: r.noorLearned, noorHomework: r.noorHomework,
    noorHomeworkGrade: r.noorHomeworkGrade, noorParticipation: r.noorParticipation,
    behaviorGrade: r.behaviorGrade, createdAt: r.createdAt,
  }));

  const evaluation = evaluateStudent(
    student.id, student.fullName, track,
    student.teacher?.fullName || "", student.circle?.name || "",
    reports, totalWorkingDays
  );

  const trackLabel = track === "QURAN" ? "مسار القرآن الكريم" : "مسار نور البيان والتمهيدي";
  const teacherName = student.teacher?.fullName || "—";
  const circleName = student.circle?.name || "حلقة القرآن";

  const html = await generateStudentReportPdfHtml(
    student.fullName,
    trackLabel,
    circleName,
    teacherName,
    evaluation
  );

  await fs.writeFile(htmlPath, html, "utf8");

  try {
    const chromiumPath = await resolveChromiumPath();

    if (format === "png") {
      await execFileAsync(chromiumPath, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--window-size=794,1123",
        "--device-scale-factor=2",
        `--screenshot=${targetPath}`,
        pathToFileURL(htmlPath).href,
      ]);
    } else {
      await execFileAsync(chromiumPath, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-margins",
        "--prefer-css-page-size",
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

export async function generateStudentProgressReportPdf(studentId: string) {
  const result = await generateStudentProgressReportMedia(studentId, "pdf");
  return {
    pdfUrl: result.mediaUrl,
    pdfPath: result.mediaPath,
  };
}

export async function generateStudentProgressReportPng(studentId: string) {
  const result = await generateStudentProgressReportMedia(studentId, "png");
  return {
    pngUrl: result.mediaUrl,
    pngPath: result.mediaPath,
  };
}
