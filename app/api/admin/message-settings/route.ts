import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  DEFAULT_TEACHER_REMINDER_SETTINGS,
  getTeacherReminderSettings,
  getTemplateDefinitionsWithValues,
  MessageTemplateKey,
  saveMessageTemplate,
  saveTeacherReminderSettings,
  TEMPLATE_DEFINITIONS,
} from "@/lib/message-templates";
import { prisma } from "@/lib/prisma";
import { getReportNotePresets, saveReportNotePresets } from "@/lib/report-note-presets";

async function getRemoteAdminUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
    },
  });
}

export async function GET() {
  try {
    const admin = await getRemoteAdminUser();

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بعرض إعدادات الرسائل" }, { status: 403 });
    }

    const [templates, reminderSettings, notePresets] = await Promise.all([
      getTemplateDefinitionsWithValues(),
      getTeacherReminderSettings(),
      getReportNotePresets(),
    ]);

    return NextResponse.json({
      success: true,
      templates,
      reminderSettings,
      notePresets,
    });
  } catch (error) {
    console.error("GET MESSAGE SETTINGS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب إعدادات الرسائل" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getRemoteAdminUser();

    if (!admin) {
      return NextResponse.json({ error: "غير مصرح لك بتحديث إعدادات الرسائل" }, { status: 403 });
    }

    const body = await request.json();

    if (body.templateKey) {
      const templateKey = String(body.templateKey) as MessageTemplateKey;
      const content = String(body.body || "").trim();
      const exists = TEMPLATE_DEFINITIONS.some((item) => item.key === templateKey);

      if (!exists) {
        return NextResponse.json({ error: "قالب الرسالة غير صالح" }, { status: 400 });
      }

      if (!content) {
        return NextResponse.json({ error: "نص القالب مطلوب" }, { status: 400 });
      }

      await saveMessageTemplate(templateKey, content);

      return NextResponse.json({
        success: true,
      });
    }

    if (body.reminderSettings) {
      const rawSettings = body.reminderSettings as Record<string, unknown>;
      const enabled = Boolean(rawSettings.enabled);
      const time = String(rawSettings.time || DEFAULT_TEACHER_REMINDER_SETTINGS.time).trim();
      const timezone = String(
        rawSettings.timezone || DEFAULT_TEACHER_REMINDER_SETTINGS.timezone
      ).trim();
      const lastTriggeredOn =
        typeof rawSettings.lastTriggeredOn === "string" ? rawSettings.lastTriggeredOn : null;

      if (!/^\d{2}:\d{2}$/.test(time)) {
        return NextResponse.json({ error: "وقت التذكير غير صالح" }, { status: 400 });
      }

      await saveTeacherReminderSettings({
        enabled,
        time,
        timezone: timezone || DEFAULT_TEACHER_REMINDER_SETTINGS.timezone,
        lastTriggeredOn,
      });

      return NextResponse.json({
        success: true,
      });
    }

    if (body.notePresets) {
      const presets = Array.isArray(body.notePresets)
        ? body.notePresets.map((item: unknown) => String(item || "").trim()).filter(Boolean)
        : [];

      await saveReportNotePresets(presets);

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json({ error: "البيانات المرسلة غير صالحة" }, { status: 400 });
  } catch (error) {
    console.error("UPDATE MESSAGE SETTINGS ERROR =>", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث إعدادات الرسائل" },
      { status: 500 }
    );
  }
}
