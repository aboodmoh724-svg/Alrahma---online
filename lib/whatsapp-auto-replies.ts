import { appUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl } from "@/lib/supabase-storage";

export type AutoReplyRuleKey = "REGISTRATION" | "TRACKS" | "FEES" | "SCHEDULE" | "GUIDELINES";

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

const registrationKnowledge = {
  periods:
    "- الفترة الصباحية: 9:00 صباحا - 11:00 صباحا\n" +
    "- المسائية الأولى: 3:00 عصرا - 6:00 مساء\n" +
    "- المسائية الثانية: 7:00 مساء - 10:00 مساء\n" +
    "- المسائية الثالثة: 11:00 مساء - 2:00 بعد منتصف الليل\n" +
    "- المسائية الرابعة: 3:00 فجرا - 6:00 فجرا",
  tracks:
    "- مسار الهجاء/القاعدة النورانية: للمبتدئين في الحروف والمقاطع والقراءة من خلال القاعدة النورانية.\n" +
    "- مسار الحفظ الرباعي: خمسة أيام في الأسبوع، مدة الحلقة ساعة ونصف يوميا، وفي الفصل 4 طلاب. يشمل تسميع الدرس الجديد، آخر خمس صفحات، المراجعة اليومية، وتصحيح درس اليوم التالي.\n" +
    "- مسار الحفظ الفردي: وقت مستقل لكل طالب مع المعلم، خمسة أيام في الأسبوع لمدة ساعة كاملة؛ يركز على الدرس الجديد وآخر خمس صفحات والمراجعة ثم تلقين درس اليوم التالي.\n" +
    "- مسار التلاوة بالنظر: لتعلم القراءة الصحيحة المجودة المرتلة بالنظر، مع حفظ بعض الأجزاء.",
  fees:
    "- المسار الفردي: 600 دولار للفصل الدراسي الكامل.\n" +
    "- مسار الهجاء: 250 دولار للفصل الدراسي الكامل.\n" +
    "- مسار التلاوة: 250 دولار للفصل الدراسي الكامل.\n" +
    "- المسار الرباعي: 250 دولار للفصل الدراسي الكامل.",
  guidelines:
    "- الدراسة عن بعد بالصوت والصورة عبر Zoom خمسة أيام أسبوعيا من الإثنين إلى الجمعة.\n" +
    "- يتم إرسال رابط الحلقة وموعد الطالب خلال 5 أيام من تاريخ التسجيل.\n" +
    "- يجرى اختبار تحديد مستوى للمستجدين لتوجيه الطالب إلى المسار الأنسب.\n" +
    "- يلزم توفر سماعة وميكروفون وكاميرا وجودة إنترنت قبل بدء الحلقة.\n" +
    "- يلزم الالتزام بوقت الحلقة وآدابها، وعدم إغلاق الكاميرا أو كتم الصوت أثناء سير الحلقة إلا بإذن المعلم.\n" +
    "- ترسل تقارير دورية توضح درجات الطالب وملاحظات المعلم عبر الوسيلة المعتمدة.",
};

const defaultRules: AutoReplyRule[] = [
  {
    key: "REGISTRATION",
    title: "طريقة التسجيل",
    enabled: true,
    keywords: ["تسجيل", "اسجل", "أسجل", "نسجل", "رابط التسجيل", "التحاق", "انضمام"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n" +
      "يمكنكم التسجيل عبر الرابط التالي:\n{{registrationLink}}\n\n" +
      "فضلا اقرأوا ملف التعليمات والتوجيهات قبل إرسال الطلب:\n{{guidelinesLink}}\n\n" +
      "بعد إرسال الطلب ستراجعه الإدارة، ثم يتم تحديد مستوى الطالب وتوجيهه للمسار المناسب بإذن الله.",
  },
  {
    key: "TRACKS",
    title: "المسارات التعليمية",
    enabled: true,
    keywords: [
      "مسار",
      "مسارات",
      "الحفظ",
      "الهجاء",
      "النورانية",
      "القاعدة النورانية",
      "التلاوة",
      "الرباعي",
      "الفردي",
      "المستوى",
    ],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n" +
      "المسارات المتاحة في منصة الرحمة:\n{{tracksSummary}}\n\n" +
      "يتم توجيه الطالب للمسار الأنسب بعد اختبار تحديد المستوى.",
  },
  {
    key: "FEES",
    title: "الرسوم",
    enabled: true,
    keywords: ["رسوم", "سعر", "تكلفة", "اشتراك", "المبلغ", "كم", "الدفع", "دولار"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n" +
      "الرسوم الحالية بنظام الفصل الدراسي الكامل:\n{{feesSummary}}\n\n" +
      "يتم تأكيد التفاصيل بعد مراجعة طلب التسجيل وتحديد المسار المناسب للطالب.",
  },
  {
    key: "SCHEDULE",
    title: "الأوقات المتاحة",
    enabled: true,
    keywords: ["وقت", "أوقات", "اوقات", "موعد", "فترة", "فترات", "دوام", "متى", "الحصة", "صباح", "مساء"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n" +
      "الفترات المتاحة غالبا:\n{{periodsSummary}}\n\n" +
      "يتم تثبيت الفترة المناسبة بعد مراجعة الطلب وتوفر الحلقة.",
  },
  {
    key: "GUIDELINES",
    title: "التعليمات والسياسات",
    enabled: true,
    keywords: ["تعليمات", "توجيهات", "سياسات", "الشروط", "ملف التعليمات", "النظام", "زوم", "zoom", "الكاميرا"],
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n" +
      "أهم التعليمات:\n{{guidelinesSummary}}\n\n" +
      "ويمكنكم الاطلاع على ملف التعليمات والتوجيهات كاملا من هنا:\n{{guidelinesLink}}",
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
    .replaceAll("{{guidelinesLink}}", guidelinesLink || appUrl("/registration"))
    .replaceAll("{{periodsSummary}}", registrationKnowledge.periods)
    .replaceAll("{{tracksSummary}}", registrationKnowledge.tracks)
    .replaceAll("{{feesSummary}}", registrationKnowledge.fees)
    .replaceAll("{{guidelinesSummary}}", registrationKnowledge.guidelines);
}
