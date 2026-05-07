import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl } from "@/lib/supabase-storage";

export type AutoReplyRuleKey = "REGISTRATION" | "FEES" | "SCHEDULE" | "GUIDELINES";

export type AutoReplyRule = {
  key: AutoReplyRuleKey;
  title: string;
  enabled: boolean;
  keywords: string[];
  body: string;
};

export type WhatsAppAutoReplySettings = {
  enabled: boolean;
  rules: AutoReplyRule[];
};

const SETTINGS_KEY = "whatsapp_auto_reply_settings";

const defaultRules: AutoReplyRule[] = [
  {
    key: "REGISTRATION",
    title: "طريقة التسجيل",
    enabled: true,
    keywords: ["تسجيل", "اسجل", "أسجل", "نسجل", "رابط التسجيل", "التحاق", "انضمام"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nيمكنكم التسجيل عبر الرابط التالي:\n{{registrationLink}}\n\nفضلا اقرأوا ملف التعليمات والتوجيهات قبل إرسال الطلب:\n{{guidelinesLink}}\n\nبعد إرسال الطلب ستراجعه الإدارة وتتواصل معكم بإذن الله.",
  },
  {
    key: "FEES",
    title: "الرسوم",
    enabled: true,
    keywords: ["رسوم", "سعر", "تكلفة", "اشتراك", "المبلغ", "كم", "الدفع"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nالرسوم الحالية:\n- مسار الهجاء: 250\n- مسار التلاوة: 250\n- المسار الرباعي: 250\n- المسار الفردي: 600\n\nقد تختلف التفاصيل حسب حالة الطالب أو المسار، وسيتم تأكيدها بعد مراجعة الطلب.",
  },
  {
    key: "SCHEDULE",
    title: "الأوقات المتاحة",
    enabled: true,
    keywords: ["وقت", "أوقات", "اوقات", "موعد", "فترة", "فترات", "دوام", "متى", "الحصة"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nالفترات المتاحة غالبا:\n- الفترة الصباحية: 9:00 - 12:00\n- المسائية الأولى: 3:00 - 6:00 مساء\n- المسائية الثانية: 7:00 - 10:00 مساء\n- المسائية الثالثة: 11:00 مساء - 2:00 ليلا\n- المسائية الرابعة: 3:00 - 6:00 فجرا\n\nيتم تثبيت الفترة المناسبة بعد مراجعة الطلب وتوفر الحلقة.",
  },
  {
    key: "GUIDELINES",
    title: "التعليمات والسياسات",
    enabled: true,
    keywords: ["تعليمات", "توجيهات", "سياسات", "الشروط", "ملف التعليمات", "النظام"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nيمكنكم الاطلاع على ملف التعليمات والتوجيهات من هنا:\n{{guidelinesLink}}\n\nونرجو قراءته قبل التسجيل لأنه يوضح أهم ما يحتاجه الطالب وولي الأمر.",
  },
];

function parseSettings(value: unknown): WhatsAppAutoReplySettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { enabled: true, rules: defaultRules };
  }

  const raw = value as Record<string, unknown>;
  const rawRules = Array.isArray(raw.rules) ? raw.rules : [];
  const storedRules = new Map(
    rawRules
      .map((rule) => {
        if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null;
        const item = rule as Record<string, unknown>;
        const key = String(item.key || "") as AutoReplyRuleKey;
        if (!defaultRules.some((defaultRule) => defaultRule.key === key)) return null;

        return [
          key,
          {
            key,
            title: String(item.title || "").trim(),
            enabled: item.enabled !== false,
            keywords: Array.isArray(item.keywords)
              ? item.keywords.map((keyword) => String(keyword || "").trim()).filter(Boolean)
              : [],
            body: String(item.body || "").trim(),
          },
        ] as const;
      })
      .filter((rule): rule is readonly [AutoReplyRuleKey, Omit<AutoReplyRule, "key"> & { key: AutoReplyRuleKey }] =>
        Boolean(rule)
      )
  );

  return {
    enabled: raw.enabled !== false,
    rules: defaultRules.map((defaultRule) => ({
      ...defaultRule,
      ...storedRules.get(defaultRule.key),
      title: storedRules.get(defaultRule.key)?.title || defaultRule.title,
      keywords: storedRules.get(defaultRule.key)?.keywords.length
        ? storedRules.get(defaultRule.key)?.keywords || defaultRule.keywords
        : defaultRule.keywords,
      body: storedRules.get(defaultRule.key)?.body || defaultRule.body,
    })),
  };
}

export async function getWhatsAppAutoReplySettings() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: SETTINGS_KEY },
    select: { value: true },
  });

  return parseSettings(setting?.value);
}

export async function saveWhatsAppAutoReplySettings(settings: WhatsAppAutoReplySettings) {
  return prisma.appSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: settings },
    update: { value: settings },
  });
}

export function detectAutoReplyRule(message: string, settings: WhatsAppAutoReplySettings) {
  const normalized = message.replace(/\s+/g, " ").trim().toLowerCase();
  if (!settings.enabled || !normalized) return null;

  return (
    settings.rules.find((rule) => {
      if (!rule.enabled) return false;
      return rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
    }) || null
  );
}

async function getGuidelinesLink() {
  const resource = await prisma.trackResource.findFirst({
    where: { resourceScope: "REGISTRATION" },
    orderBy: { createdAt: "desc" },
    select: { fileUrl: true },
  });

  if (!resource?.fileUrl) {
    return appUrl("/registration");
  }

  return createSignedStorageUrl(resource.fileUrl);
}

export async function renderAutoReply(rule: AutoReplyRule) {
  const [guidelinesLink] = await Promise.all([getGuidelinesLink()]);
  return rule.body
    .replaceAll("{{registrationLink}}", appUrl("/registration"))
    .replaceAll("{{guidelinesLink}}", guidelinesLink || appUrl("/registration"));
}
