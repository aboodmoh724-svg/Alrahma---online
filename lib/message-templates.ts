import { prisma } from "@/lib/prisma";

export type MessageTemplateKey =
  | "REGISTRATION_RECEIVED"
  | "REGISTRATION_ACCEPTED_DETAILS"
  | "REGISTRATION_INTERVIEW"
  | "SUPERVISION_ACCEPTANCE"
  | "SUPERVISION_CIRCLE_DETAILS"
  | "PARENT_EDUCATION_CHAT_GUIDE"
  | "TEACHER_EDUCATION_CHAT_GUIDE"
  | "FULL_PAYMENT_RECEIVED"
  | "TEACHER_VISIT_REPORT"
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
    key: "REGISTRATION_ACCEPTED_DETAILS",
    title: "رسالة قبول الطالب مع التفاصيل",
    description: "ترسل عند قبول الطالب وإرسال بيانات الحلقة والمعلم وموعد الدخول.",
    variables: ["studentName", "circleName", "teacherName", "scheduleDetails", "zoomUrl"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nنحيطكم علمًا بأنه تم قبول الطالب *{{studentName}}* في منصة الرحمة.\n\n*الحلقة:* {{circleName}}\n*المعلم:* {{teacherName}}\n*تفاصيل الموعد:* {{scheduleDetails}}\n*رابط الحلقة:* {{zoomUrl}}\n\nنسأل الله له التوفيق والبركة في رحلته مع كتاب الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "REGISTRATION_INTERVIEW",
    title: "رسالة تحديد موعد المقابلة",
    description: "ترسل من الإشراف لولي الأمر عند تحديد موعد اختبار المستوى.",
    variables: ["studentName", "interviewDate", "interviewTime", "zoomUrl"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nأهلًا بكم في منصة الرحمة لتعليم القرآن الكريم.\nتم تحديد موعد المقابلة الأولى لتحديد مستوى الطالب/ـة: *{{studentName}}*\n\n*التاريخ:* {{interviewDate}}\n*الوقت:* {{interviewTime}} بتوقيت مكة المكرمة\n*رابط الزوم:* {{zoomUrl}}\n\nنرجو تأكيد ما إذا كان هذا الموعد مناسبًا لكم أو غير مناسب بالرد على هذه الرسالة.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "SUPERVISION_ACCEPTANCE",
    title: "رسالة قبول الطالب من الإشراف",
    description: "ترسل بعد وضع الطالب في الحلقة وقبل إرسال تفاصيل الحلقة.",
    variables: ["studentName"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nنحيطكم علمًا بأنه تم قبول الطالب *{{studentName}}* في منصة الرحمة لتعليم القرآن الكريم.\n\nستصلكم رسالة أخرى بتفاصيل الحلقة والمعلم وموعد الدخول بإذن الله.\n\nنسأل الله أن يفتح عليه، وأن يجعل رحلته مع كتاب الله مباركة نافعة.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "SUPERVISION_CIRCLE_DETAILS",
    title: "رسالة تفاصيل الحلقة",
    description: "ترسل بعد وضع الطالب في الحلقة، وفيها الحلقة والمعلم والوقت والرابط.",
    variables: ["studentName", "circleName", "teacherName", "periodLabel", "startsAt", "endsAt", "zoomUrl"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nتفاصيل حلقة الطالب *{{studentName}}* في منصة الرحمة:\n\n*الحلقة:* {{circleName}}\n*المعلم:* {{teacherName}}\n*الفترة:* {{periodLabel}}\n*وقت الدخول:* {{startsAt}}\n*وقت الخروج:* {{endsAt}}\n*رابط الحلقة:* {{zoomUrl}}\n\nنرجو الحرص على دخول الطالب في الموعد المحدد، ونسأل الله له التوفيق والثبات.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "PARENT_EDUCATION_CHAT_GUIDE",
    title: "رسالة آلية تواصل ولي الأمر",
    description: "ترسل لولي الأمر لشرح رابط المراسلات اليومية مع المعلم.",
    variables: ["studentName", "chatUrl"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nأهلًا بكم في منصة الرحمة.\n\nتم تفعيل قناة *المراسلات اليومية مع المعلم* الخاصة بالطالب/ـة *{{studentName}}*.\n\nمن خلال هذا الرابط يمكنكم التواصل مع المعلم أو الإشراف فيما يخص متابعة الطالب التعليمية:\n{{chatUrl}}\n\n*طريقة الدخول:*\n1. افتحوا الرابط السابق.\n2. اكتبوا رقم الجوال المسجل لدينا لولي الأمر.\n3. سيصلكم رمز دخول على الواتساب.\n4. أدخلوا الرمز، ثم اختاروا المعلم وابدؤوا المحادثة.\n\nنرجو متابعة هذه القناة باستمرار، واستخدامها في الأمور التعليمية مثل الغياب، التعثر، الواجبات، والاستفسارات المتعلقة بالحفظ والمراجعة.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "TEACHER_EDUCATION_CHAT_GUIDE",
    title: "رسالة آلية تواصل المعلم",
    description: "ترسل للمعلم لشرح هدف مراسلات أولياء الأمور داخل النظام.",
    variables: ["teacherName", "studentName", "parentPhone"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nأستاذنا *{{teacherName}}*، تم تفعيل قناة المراسلات التعليمية مع ولي أمر الطالب/ـة *{{studentName}}* داخل منصة الرحمة.\n\nالهدف من القناة أن يكون التواصل التعليمي محفوظًا وواضحًا وتحت متابعة الإشراف، مثل:\n- التنبيه على الغياب أو التأخر.\n- متابعة التعثر أو الضعف في الواجب.\n- إرسال ملاحظة مختصرة أو تسجيل صوتي عند الحاجة.\n- استقبال رد ولي الأمر بما يخدم انتظام الطالب.\n\nيمكنكم الدخول من لوحة المعلم ثم قسم *مراسلات أولياء الأمور*، واختيار ولي أمر الطالب وبدء المحادثة.\n\nرقم ولي الأمر المسجل: {{parentPhone}}\n\nنرجو أن يبقى التواصل مختصرًا ومباشرًا ومرتبطًا بالعملية التعليمية.\n\nإدارة منصة الرحمة",
  },
  {
    key: "FULL_PAYMENT_RECEIVED",
    title: "رسالة اكتمال الرسوم",
    description: "ترسل لولي الأمر عند تسجيل اكتمال الرسوم المطلوبة للطالب.",
    variables: ["studentName", "amount", "currency", "circleName"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nتم استلام الرسوم كاملة للطالب *{{studentName}}* بنجاح.\n\n*المبلغ المسدد:* {{amount}} {{currency}}\n*الحلقة:* {{circleName}}\n\nنسأل الله أن يبارك لكم، وأن يفتح على الطالب في رحلته مع كتاب الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "TEACHER_VISIT_REPORT",
    title: "رسالة تقرير زيارة المعلم",
    description: "ترسل للمعلم عند حفظ تقرير زيارة إشرافية.",
    variables: ["teacherName", "supervisorName", "visitNumber", "visitType", "visitDate"],
    defaultBody:
      "السلام عليكم ورحمة الله وبركاته\n\nأستاذنا *{{teacherName}}*، تم حفظ تقرير الزيارة الإشرافية رقم {{visitNumber}}.\n\n*نوع الزيارة:* {{visitType}}\n*تاريخ الزيارة:* {{visitDate}}\n*المشرف:* {{supervisorName}}\n\nنرجو الاطلاع على التقرير، ونسأل الله لكم التوفيق والسداد.\n\nإدارة منصة الرحمة",
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

export async function deleteMessageTemplate(key: MessageTemplateKey) {
  return prisma.appSetting.deleteMany({
    where: {
      key: `message_template:${key}`,
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
