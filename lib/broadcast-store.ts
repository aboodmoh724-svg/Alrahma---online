import { prisma } from "@/lib/prisma";
import type { WhatsAppChannel } from "@/lib/whatsapp";

export type BroadcastFailure = {
  phone: string;
  recipientName: string;
  error: string;
};

export type BroadcastHistoryItem = {
  id: string;
  title: string;
  scope: WhatsAppChannel;
  recipientType: string;
  message: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  failed: BroadcastFailure[];
  createdAt: string;
};

export type BroadcastTemplateItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  useCount: number;
};

const HISTORY_LIMIT = 40;
const TEMPLATE_LIMIT = 20;

function historyKey(scope: WhatsAppChannel) {
  return `broadcast_history:${scope}`;
}

function templatesKey(scope: WhatsAppChannel) {
  return `broadcast_templates:${scope}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readList<T>(value: unknown): T[] {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return [];
  }

  return value.items as T[];
}

export function suggestBroadcastTemplateTitle(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();

  if (/بداية|افتتاح/.test(clean)) {
    return "تذكير ببداية الحضور";
  }

  if (/دوام|الحضور|مسجد|العصر|الحلقة|الحلقات/.test(clean)) {
    return "تذكير بموعد الحضور";
  }

  if (/رسوم|دفع|اشتراك/.test(clean)) {
    return "تذكير بالرسوم";
  }

  const firstLine = message
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? firstLine.slice(0, 45) : "رسالة جماعية";
}

export async function getBroadcastHistory(scope: WhatsAppChannel) {
  const setting = await prisma.appSetting.findUnique({
    where: { key: historyKey(scope) },
    select: { value: true },
  });

  return readList<BroadcastHistoryItem>(setting?.value).slice(0, HISTORY_LIMIT);
}

export async function getBroadcastTemplates(scope: WhatsAppChannel) {
  const setting = await prisma.appSetting.findUnique({
    where: { key: templatesKey(scope) },
    select: { value: true },
  });

  return readList<BroadcastTemplateItem>(setting?.value).slice(0, TEMPLATE_LIMIT);
}

export async function saveBroadcastHistory(item: BroadcastHistoryItem) {
  const current = await getBroadcastHistory(item.scope);
  const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT);

  await prisma.appSetting.upsert({
    where: { key: historyKey(item.scope) },
    create: { key: historyKey(item.scope), value: { items: next } },
    update: { value: { items: next } },
  });

  return next;
}

export async function saveBroadcastTemplateFromMessage(input: {
  scope: WhatsAppChannel;
  message: string;
  title?: string;
}) {
  const body = input.message.trim();
  if (!body) {
    return null;
  }

  const now = new Date().toISOString();
  const title = input.title || suggestBroadcastTemplateTitle(body);
  const current = await getBroadcastTemplates(input.scope);
  const existing = current.find((template) => template.body.trim() === body);

  const nextTemplate: BroadcastTemplateItem = existing
    ? {
        ...existing,
        title: existing.title || title,
        updatedAt: now,
        lastUsedAt: now,
        useCount: existing.useCount + 1,
      }
    : {
        id: crypto.randomUUID(),
        title,
        body,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now,
        useCount: 1,
      };

  const next = [
    nextTemplate,
    ...current.filter((template) => template.id !== nextTemplate.id && template.body.trim() !== body),
  ].slice(0, TEMPLATE_LIMIT);

  await prisma.appSetting.upsert({
    where: { key: templatesKey(input.scope) },
    create: { key: templatesKey(input.scope), value: { items: next } },
    update: { value: { items: next } },
  });

  return nextTemplate;
}
