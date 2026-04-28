import { NextResponse } from "next/server";
import {
  getTeacherReminderSettings,
  renderMessageTemplate,
  saveTeacherReminderSettings,
} from "@/lib/message-templates";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsAppNumber, sendWhatsAppText } from "@/lib/whatsapp";

function getTodayRangeInIstanbul() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(now).split("-");
  const start = new Date(`${year}-${month}-${day}T00:00:00+03:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end, dateKey: `${year}-${month}-${day}` };
}

function getCurrentTimeInTimezone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value || "00";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";

  return `${hour}:${minute}`;
}

function isAuthorizedCronRequest(request: Request) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronHeader) {
    return true;
  }

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminderSettings = await getTeacherReminderSettings();

    if (!reminderSettings.enabled) {
      return NextResponse.json({ success: true, skipped: "disabled" });
    }

    const currentTime = getCurrentTimeInTimezone(reminderSettings.timezone);

    if (currentTime < reminderSettings.time) {
      return NextResponse.json({ success: true, skipped: "before-reminder-time" });
    }

    const { start, end, dateKey } = getTodayRangeInIstanbul();

    if (reminderSettings.lastTriggeredOn === dateKey) {
      return NextResponse.json({ success: true, skipped: "already-sent-today" });
    }

    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        studyMode: "REMOTE",
        isActive: true,
        whatsapp: {
          not: null,
        },
        students: {
          some: {
            isActive: true,
            studyMode: "REMOTE",
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        whatsapp: true,
        students: {
          where: {
            isActive: true,
            studyMode: "REMOTE",
          },
          select: {
            id: true,
            fullName: true,
            reports: {
              where: {
                createdAt: {
                  gte: start,
                  lt: end,
                },
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    let sentCount = 0;
    const failed: Array<{ teacherName: string; error: string }> = [];

    for (const teacher of teachers) {
      const phone = normalizeWhatsAppNumber(teacher.whatsapp || "");
      if (!phone) {
        continue;
      }

      const missingStudents = teacher.students
        .filter((student) => student.reports.length === 0)
        .map((student) => student.fullName);

      if (missingStudents.length === 0) {
        continue;
      }

      try {
        const message = await renderMessageTemplate("TEACHER_MISSING_REPORT_REMINDER", {
          teacherName: teacher.fullName,
          missingCount: missingStudents.length,
          missingStudents: missingStudents.join(" - "),
        });

        await sendWhatsAppText({
          to: phone,
          body: message,
          channel: "REMOTE",
        });

        sentCount += 1;
      } catch (error) {
        failed.push({
          teacherName: teacher.fullName,
          error: error instanceof Error ? error.message : "تعذر الإرسال",
        });
      }
    }

    await saveTeacherReminderSettings({
      ...reminderSettings,
      lastTriggeredOn: dateKey,
    });

    return NextResponse.json({
      success: failed.length === 0,
      sentCount,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    console.error("TEACHER REPORT REMINDERS CRON ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تنفيذ تذكير المعلمين" },
      { status: 500 }
    );
  }
}
