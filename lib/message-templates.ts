import { prisma } from "@/lib/prisma";

export type MessageTemplateKey =
  | "REGISTRATION_RECEIVED"
  | "TEACHER_WELCOME"
  | "REMOTE_REPORT"
  | "TEACHER_MISSING_REPORT_REMINDER";

export type TemplateDefinition = {
  key: MessageTemplateKey;
  title: string;
  description: string;
  variables: string[];
  defaultBody: string;
};

export type TeacherReminderSettings = {
  enabled: boolean;
  time: string;
  timezone: string;
  lastTriggeredOn: string | null;
};

export const DEFAULT_TEACHER_REMINDER_SETTINGS: TeacherReminderSettings = {
  enabled: false,
  time: "18:00",
  timezone: "Europe/Istanbul",
  lastTriggeredOn: null,
};

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    key: "REGISTRATION_RECEIVED",
    title: "رسالة تسجيل الطالب الجديد",
    description: "ترسل تلقائيًا بعد تعبئة فورم التسجيل بنجاح.",
    variables: ["studentName"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nنشكركم على التسجيل في منصة الرحمة لتعليم القرآن الكريم.\n\nاسم الطالب: {{studentName}}\nتم استلام طلب التسجيل بنجاح، وسيتم التواصل معكم قريبًا بعد مراجعة الطلب بإذن الله.\n\nنسأل الله التوفيق لابنكم، وأن يبارك في رحلته مع كتاب الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "TEACHER_WELCOME",
    title: "رسالة المعلم",
    description: "ترسل تلقائيًا عند إضافة معلم جديد وكان له رقم واتساب.",
    variables: ["teacherName", "platformLabel", "email", "password", "loginUrl"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nمرحبًا بالأستاذ {{teacherName}}\nيسرنا انضمامكم إلى منصة الرحمة لتعليم القرآن الكريم.\n\nنوع الحساب: {{platformLabel}}\nاسم المستخدم: {{email}}\nكلمة المرور: {{password}}\n\nرابط الدخول:\n{{loginUrl}}\n\nنسأل الله لكم التوفيق والسداد، وأن يجعل عملكم في ميزان حسناتكم.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "REMOTE_REPORT",
    title: "رسالة التقرير اليومي",
    description: "ترسل يدويًا من واجهة معلم الأونلاين عند الضغط على إرسال عبر واتساب.",
    variables: ["studentName", "teacherName", "reportDate", "lessonName", "review", "homework", "note"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nتقرير الطالب: {{studentName}}\n\nالمعلم: {{teacherName}}\nالتاريخ: {{reportDate}}\nالدرس: {{lessonName}}\nالمراجعة: {{review}}\nالواجب: {{homework}}\nالملاحظات: {{note}}\n\nجزاكم الله خيرًا، وبارك الله في متابعتكم.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "TEACHER_MISSING_REPORT_REMINDER",
    title: "تذكير المعلم بإكمال التقارير",
    description: "يرسل تلقائيًا بعد الوقت المحدد إذا بقي طلاب بلا تقارير في ذلك اليوم.",
    variables: ["teacherName", "missingCount", "missingStudents"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nتذكير للمعلم {{teacherName}}\nحتى الآن لم تكتمل تقارير اليوم.\nعدد الطلاب الذين لم يضف لهم تقرير: {{missingCount}}\nالطلاب: {{missingStudents}}\n\nنرجو استكمال التقارير في أقرب وقت.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
];

const TEMPLATE_KEYS = TEMPLATE_DEFINITIONS.map((item) => item.key);

export function applyTemplateVariables(
  template: string,
  variables: Record<string, string | number | null | undefined>
) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return String(value);
  });
}

export async function getStoredTemplateBodies() {
  const settings = await prisma.appSetting.findMany({
    where: {
      key: {
        in: TEMPLATE_KEYS.map((key) => `message_template:${key}`),
      },
    },
    select: {
      key: true,
      value: true,
    },
  });

  const map = new Map<MessageTemplateKey, string>();

  for (const setting of settings) {
    const key = setting.key.replace("message_template:", "") as MessageTemplateKey;
    const body =
      setting.value &&
      typeof setting.value === "object" &&
      "body" in setting.value &&
      typeof setting.value.body === "string"
        ? setting.value.body
        : null;

    if (body) {
      map.set(key, body);
    }
  }

  return map;
}

export async function getTemplateDefinitionsWithValues() {
  const storedBodies = await getStoredTemplateBodies();

  return TEMPLATE_DEFINITIONS.map((definition) => ({
    ...definition,
    body: storedBodies.get(definition.key) || definition.defaultBody,
  }));
}

export async function renderMessageTemplate(
  key: MessageTemplateKey,
  variables: Record<string, string | number | null | undefined>
) {
  const storedBodies = await getStoredTemplateBodies();
  const definition = TEMPLATE_DEFINITIONS.find((item) => item.key === key);

  if (!definition) {
    throw new Error(`Unknown message template key: ${key}`);
  }

  const body = storedBodies.get(key) || definition.defaultBody;
  return applyTemplateVariables(body, variables);
}

export async function getTeacherReminderSettings() {
  const setting = await prisma.appSetting.findUnique({
    where: {
      key: "teacher_report_reminder",
    },
    select: {
      value: true,
    },
  });

  if (!setting || typeof setting.value !== "object" || !setting.value) {
    return DEFAULT_TEACHER_REMINDER_SETTINGS;
  }

  const value = setting.value as Record<string, unknown>;

  return {
    enabled:
      typeof value.enabled === "boolean"
        ? value.enabled
        : DEFAULT_TEACHER_REMINDER_SETTINGS.enabled,
    time:
      typeof value.time === "string" && /^\d{2}:\d{2}$/.test(value.time)
        ? value.time
        : DEFAULT_TEACHER_REMINDER_SETTINGS.time,
    timezone:
      typeof value.timezone === "string" && value.timezone.trim()
        ? value.timezone
        : DEFAULT_TEACHER_REMINDER_SETTINGS.timezone,
    lastTriggeredOn:
      typeof value.lastTriggeredOn === "string" && value.lastTriggeredOn.trim()
        ? value.lastTriggeredOn
        : null,
  };
}

export async function saveMessageTemplate(key: MessageTemplateKey, body: string) {
  return prisma.appSetting.upsert({
    where: {
      key: `message_template:${key}`,
    },
    create: {
      key: `message_template:${key}`,
      value: {
        body,
      },
    },
    update: {
      value: {
        body,
      },
    },
  });
}

export async function saveTeacherReminderSettings(settings: TeacherReminderSettings) {
  return prisma.appSetting.upsert({
    where: {
      key: "teacher_report_reminder",
    },
    create: {
      key: "teacher_report_reminder",
      value: settings,
    },
    update: {
      value: settings,
    },
  });
}
