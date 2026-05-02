import { prisma } from "@/lib/prisma";

export type MessageAutomationKey =
  | "REGISTRATION_RECEIVED_WHATSAPP"
  | "REGISTRATION_ACCEPTED_DETAILS_WHATSAPP"
  | "REGISTRATION_INTERVIEW_WHATSAPP"
  | "SUPERVISION_ACCEPTANCE_WHATSAPP"
  | "SUPERVISION_CIRCLE_DETAILS_WHATSAPP"
  | "PARENT_EDUCATION_CHAT_GUIDE_WHATSAPP"
  | "TEACHER_EDUCATION_CHAT_GUIDE_WHATSAPP"
  | "TEACHER_WELCOME_WHATSAPP"
  | "TEACHER_MISSING_REPORT_REMINDER_WHATSAPP"
  | "FULL_PAYMENT_RECEIVED_WHATSAPP"
  | "TEACHER_VISIT_REPORT_WHATSAPP"
  | "TEACHER_VISIT_REPORT_NOTIFICATION"
  | "SUPERVISION_ACTION_NOTIFICATION"
  | "TEACHER_REQUEST_UPDATED_NOTIFICATION"
  | "STUDENT_ASSIGNED_NOTIFICATION"
  | "STUDENT_MOVED_NOTIFICATION"
  | "CIRCLE_ASSIGNED_NOTIFICATION";

export type MessageAutomationRule = {
  key: MessageAutomationKey;
  title: string;
  trigger: string;
  recipient: string;
  channel: "WHATSAPP" | "IN_APP";
  location: string;
  templateKey?: string;
  defaultEnabled: boolean;
  notes?: string;
};

export type CustomMessageAutomationRule = {
  id: string;
  title: string;
  trigger: string;
  recipient: string;
  channel: "WHATSAPP" | "IN_APP";
  enabled: boolean;
  notes: string;
};

export type MessageAutomationSettings = {
  systemRules: Array<MessageAutomationRule & { enabled: boolean }>;
  customRules: CustomMessageAutomationRule[];
};

const SETTINGS_KEY = "message_automation_settings";

export const MESSAGE_AUTOMATION_RULES: MessageAutomationRule[] = [
  {
    key: "REGISTRATION_RECEIVED_WHATSAPP",
    title: "تأكيد استلام طلب التسجيل",
    trigger: "عند إرسال ولي الأمر طلب تسجيل جديد من صفحة التسجيل العامة.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "نموذج التسجيل العام",
    templateKey: "REGISTRATION_RECEIVED",
    defaultEnabled: true,
  },
  {
    key: "REGISTRATION_ACCEPTED_DETAILS_WHATSAPP",
    title: "قبول الطالب مع تفاصيل الحلقة",
    trigger: "عند إرسال الإدارة رسالة قبول الطالب مع تفاصيل الحلقة.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "طلبات التسجيل في الإدارة",
    templateKey: "REGISTRATION_ACCEPTED_DETAILS",
    defaultEnabled: true,
  },
  {
    key: "REGISTRATION_INTERVIEW_WHATSAPP",
    title: "تحديد موعد المقابلة",
    trigger: "عند تحديد الإشراف موعد مقابلة أو اختبار مستوى للطالب.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "طلبات التسجيل في الإشراف",
    templateKey: "REGISTRATION_INTERVIEW",
    defaultEnabled: true,
  },
  {
    key: "SUPERVISION_ACCEPTANCE_WHATSAPP",
    title: "قبول الطالب من الإشراف",
    trigger: "عند ضغط المشرف زر إرسال رسالة القبول بعد وضع الطالب في الحلقة.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "سجل الطلبات المحولة للإشراف",
    templateKey: "SUPERVISION_ACCEPTANCE",
    defaultEnabled: true,
  },
  {
    key: "SUPERVISION_CIRCLE_DETAILS_WHATSAPP",
    title: "تفاصيل الحلقة من الإشراف",
    trigger: "عند ضغط المشرف زر إرسال تفاصيل الحلقة.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "سجل الطلبات المحولة للإشراف",
    templateKey: "SUPERVISION_CIRCLE_DETAILS",
    defaultEnabled: true,
  },
  {
    key: "PARENT_EDUCATION_CHAT_GUIDE_WHATSAPP",
    title: "شرح مراسلات ولي الأمر",
    trigger: "عند ضغط المشرف زر شرح المراسلات لولي الأمر.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "سجل الطلبات المحولة للإشراف",
    templateKey: "PARENT_EDUCATION_CHAT_GUIDE",
    defaultEnabled: true,
  },
  {
    key: "TEACHER_EDUCATION_CHAT_GUIDE_WHATSAPP",
    title: "شرح مراسلات المعلم",
    trigger: "عند ضغط المشرف زر شرح المراسلات للمعلم.",
    recipient: "معلم الطالب",
    channel: "WHATSAPP",
    location: "سجل الطلبات المحولة للإشراف",
    templateKey: "TEACHER_EDUCATION_CHAT_GUIDE",
    defaultEnabled: true,
  },
  {
    key: "TEACHER_WELCOME_WHATSAPP",
    title: "ترحيب المعلم الجديد",
    trigger: "عند إضافة معلم جديد من الإدارة وكان له رقم واتساب.",
    recipient: "المعلم الجديد",
    channel: "WHATSAPP",
    location: "إدارة المعلمين",
    templateKey: "TEACHER_WELCOME",
    defaultEnabled: true,
  },
  {
    key: "TEACHER_MISSING_REPORT_REMINDER_WHATSAPP",
    title: "تذكير المعلم بالتقارير الناقصة",
    trigger: "عند تشغيل الفحص اليومي بعد الوقت المحدد ووجود طلاب بلا تقرير اليوم.",
    recipient: "المعلم صاحب الطلاب الناقصين",
    channel: "WHATSAPP",
    location: "المهمة المجدولة اليومية",
    templateKey: "TEACHER_MISSING_REPORT_REMINDER",
    defaultEnabled: false,
    notes: "له وقت تشغيل مستقل محفوظ في إعدادات التذكير.",
  },
  {
    key: "FULL_PAYMENT_RECEIVED_WHATSAPP",
    title: "تأكيد اكتمال الرسوم",
    trigger: "عندما تصل مدفوعات الطالب إلى كامل المبلغ المطلوب.",
    recipient: "ولي أمر الطالب",
    channel: "WHATSAPP",
    location: "الحسابات المالية",
    templateKey: "FULL_PAYMENT_RECEIVED",
    defaultEnabled: true,
  },
  {
    key: "TEACHER_VISIT_REPORT_WHATSAPP",
    title: "إرسال تقرير زيارة المعلم",
    trigger: "عند حفظ تقرير زيارة معلم من الإشراف.",
    recipient: "المعلم المزور",
    channel: "WHATSAPP",
    location: "زيارات المعلمين",
    templateKey: "TEACHER_VISIT_REPORT",
    defaultEnabled: true,
    notes: "يرسل ملف PDF، وإن تعذر الإرسال كمستند يحاول إرسال رابط نصي.",
  },
  {
    key: "TEACHER_VISIT_REPORT_NOTIFICATION",
    title: "تنبيه المعلم بتقرير زيارة جديد",
    trigger: "بعد حفظ تقرير زيارة المعلم.",
    recipient: "المعلم داخل لوحة المعلم",
    channel: "IN_APP",
    location: "زيارات المعلمين",
    defaultEnabled: true,
  },
  {
    key: "SUPERVISION_ACTION_NOTIFICATION",
    title: "تنبيه المعلم بإجراء إشرافي",
    trigger: "عندما يحفظ المشرف إجراء متابعة على مهمة مرتبطة بطالب.",
    recipient: "معلم الطالب داخل لوحة المعلم",
    channel: "IN_APP",
    location: "المهام الإشرافية",
    defaultEnabled: true,
  },
  {
    key: "TEACHER_REQUEST_UPDATED_NOTIFICATION",
    title: "تنبيه المعلم بتحديث طلبه",
    trigger: "عند تحديث الإدارة أو الإشراف حالة طلب أرسله المعلم.",
    recipient: "المعلم صاحب الطلب داخل لوحة المعلم",
    channel: "IN_APP",
    location: "طلبات المعلمين",
    defaultEnabled: true,
  },
  {
    key: "STUDENT_ASSIGNED_NOTIFICATION",
    title: "تنبيه المعلم بإضافة طالب له",
    trigger: "عند إضافة طالب جديد وربطه بمعلم.",
    recipient: "المعلم داخل لوحة المعلم",
    channel: "IN_APP",
    location: "إدارة الطلاب",
    defaultEnabled: true,
  },
  {
    key: "STUDENT_MOVED_NOTIFICATION",
    title: "تنبيه المعلم بنقل طالب إليه",
    trigger: "عند نقل طالب إلى معلم أو حلقة جديدة.",
    recipient: "المعلم الجديد داخل لوحة المعلم",
    channel: "IN_APP",
    location: "إدارة الطلاب",
    defaultEnabled: true,
  },
  {
    key: "CIRCLE_ASSIGNED_NOTIFICATION",
    title: "تنبيه المعلم بإسناد حلقة له",
    trigger: "عند ربط حلقة فيها طلاب بمعلم جديد.",
    recipient: "المعلم داخل لوحة المعلم",
    channel: "IN_APP",
    location: "إدارة الحلقات",
    defaultEnabled: true,
  },
];

type StoredSettings = {
  overrides?: Partial<Record<MessageAutomationKey, boolean>>;
  customRules?: CustomMessageAutomationRule[];
};

function parseStoredSettings(value: unknown): StoredSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const overrides =
    raw.overrides && typeof raw.overrides === "object" && !Array.isArray(raw.overrides)
      ? (raw.overrides as Partial<Record<MessageAutomationKey, boolean>>)
      : {};
  const customRules = Array.isArray(raw.customRules)
    ? raw.customRules
        .map((rule) => {
          if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null;
          const item = rule as Record<string, unknown>;
          return {
            id: String(item.id || crypto.randomUUID()),
            title: String(item.title || "").trim(),
            trigger: String(item.trigger || "").trim(),
            recipient: String(item.recipient || "").trim(),
            channel: item.channel === "IN_APP" ? "IN_APP" : "WHATSAPP",
            enabled: item.enabled !== false,
            notes: String(item.notes || "").trim(),
          } satisfies CustomMessageAutomationRule;
        })
        .filter((rule): rule is CustomMessageAutomationRule => Boolean(rule?.title))
    : [];

  return { overrides, customRules };
}

async function getStoredSettings() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: SETTINGS_KEY },
    select: { value: true },
  });

  return parseStoredSettings(setting?.value);
}

export async function getMessageAutomationSettings(): Promise<MessageAutomationSettings> {
  const stored = await getStoredSettings();
  const overrides = stored.overrides || {};

  return {
    systemRules: MESSAGE_AUTOMATION_RULES.map((rule) => ({
      ...rule,
      enabled:
        typeof overrides[rule.key] === "boolean"
          ? Boolean(overrides[rule.key])
          : rule.defaultEnabled,
    })),
    customRules: stored.customRules || [],
  };
}

export async function saveMessageAutomationSettings(settings: {
  overrides: Partial<Record<MessageAutomationKey, boolean>>;
  customRules: CustomMessageAutomationRule[];
}) {
  return prisma.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: settings,
    },
    update: {
      value: settings,
    },
  });
}

export async function isMessageAutomationEnabled(key: MessageAutomationKey) {
  const rule = MESSAGE_AUTOMATION_RULES.find((item) => item.key === key);
  if (!rule) return false;

  const stored = await getStoredSettings();
  const value = stored.overrides?.[key];

  return typeof value === "boolean" ? value : rule.defaultEnabled;
}
