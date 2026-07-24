/**
 * Smart WhatsApp Sender — Anti-Ban Humanized Sending Engine
 *
 * Central library that controls ALL bulk WhatsApp sending across the platform.
 * Uses randomized delays, batch cooldowns, and daily limits to mimic human behavior
 * and prevent WhatsApp from detecting automated/bulk messaging patterns.
 */

// ─── Delay Configuration ───────────────────────────────────────────
const MIN_INTER_MESSAGE_DELAY_MS = 8_000;   // 8 seconds minimum
const MAX_INTER_MESSAGE_DELAY_MS = 20_000;  // 20 seconds maximum

const SMALL_BATCH_SIZE = 5;                 // After every 5 messages...
const SMALL_BATCH_COOLDOWN_MIN_MS = 60_000; // ...pause 60-120 seconds
const SMALL_BATCH_COOLDOWN_MAX_MS = 120_000;

const LARGE_BATCH_SIZE = 15;                // After every 15 messages...
const LARGE_BATCH_COOLDOWN_MIN_MS = 180_000; // ...pause 3-5 minutes
const LARGE_BATCH_COOLDOWN_MAX_MS = 300_000;

const DAILY_LIMIT_PER_CHANNEL = 50;         // Max messages per channel per day

// ─── Helpers ───────────────────────────────────────────────────────

/** Returns a random integer between min and max (inclusive) */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Async sleep for a random duration between min and max ms */
export async function humanDelay(
  minMs = MIN_INTER_MESSAGE_DELAY_MS,
  maxMs = MAX_INTER_MESSAGE_DELAY_MS
): Promise<number> {
  const delay = randomBetween(minMs, maxMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return delay;
}

/** Returns the appropriate delay for the current message index (0-based) */
export async function smartDelay(messageIndex: number): Promise<number> {
  // After every LARGE_BATCH_SIZE messages → long cooldown
  if (messageIndex > 0 && messageIndex % LARGE_BATCH_SIZE === 0) {
    const delay = randomBetween(LARGE_BATCH_COOLDOWN_MIN_MS, LARGE_BATCH_COOLDOWN_MAX_MS);
    console.log(`[SmartSender] Long cooldown after ${messageIndex} messages: ${(delay / 1000).toFixed(0)}s`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
  }

  // After every SMALL_BATCH_SIZE messages → medium cooldown
  if (messageIndex > 0 && messageIndex % SMALL_BATCH_SIZE === 0) {
    const delay = randomBetween(SMALL_BATCH_COOLDOWN_MIN_MS, SMALL_BATCH_COOLDOWN_MAX_MS);
    console.log(`[SmartSender] Batch cooldown after ${messageIndex} messages: ${(delay / 1000).toFixed(0)}s`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
  }

  // Normal inter-message delay
  if (messageIndex > 0) {
    return humanDelay();
  }

  return 0;
}

// ─── Daily Limit Tracking (in-memory, resets on server restart) ────

const dailySendCounts: Record<string, { count: number; dateKey: string }> = {};

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDailySendCount(channel: string): number {
  const today = getTodayKey();
  const entry = dailySendCounts[channel];
  if (!entry || entry.dateKey !== today) return 0;
  return entry.count;
}

export function incrementDailySendCount(channel: string): number {
  const today = getTodayKey();
  if (!dailySendCounts[channel] || dailySendCounts[channel].dateKey !== today) {
    dailySendCounts[channel] = { count: 0, dateKey: today };
  }
  dailySendCounts[channel].count += 1;
  return dailySendCounts[channel].count;
}

export function canSendMore(channel: string): boolean {
  return getDailySendCount(channel) < DAILY_LIMIT_PER_CHANNEL;
}

export function getDailyLimit(): number {
  return DAILY_LIMIT_PER_CHANNEL;
}

// ─── Message Variation ─────────────────────────────────────────────

/**
 * Adds subtle, invisible variation to message text to prevent
 * WhatsApp from detecting identical bulk messages.
 * Uses zero-width non-joiner characters at random positions.
 */
export function addMessageVariation(text: string): string {
  const ZWNJ = "\u200c"; // Zero-Width Non-Joiner (invisible)
  const lines = text.split("\n");

  // Insert ZWNJ at 1-3 random line boundaries
  const insertCount = randomBetween(1, Math.min(3, lines.length - 1));
  const positions = new Set<number>();

  while (positions.size < insertCount && positions.size < lines.length - 1) {
    positions.add(randomBetween(0, lines.length - 2));
  }

  return lines
    .map((line, idx) => (positions.has(idx) ? line + ZWNJ : line))
    .join("\n");
}

// ─── Estimated Time Calculator ─────────────────────────────────────

/**
 * Estimates the total time (in minutes) for sending N messages
 * with the smart delay system.
 */
export function estimateSendTimeMinutes(messageCount: number): { min: number; max: number } {
  if (messageCount <= 0) return { min: 0, max: 0 };

  let minTotalMs = 0;
  let maxTotalMs = 0;

  for (let i = 0; i < messageCount; i++) {
    if (i === 0) continue; // First message has no delay

    if (i % LARGE_BATCH_SIZE === 0) {
      minTotalMs += LARGE_BATCH_COOLDOWN_MIN_MS;
      maxTotalMs += LARGE_BATCH_COOLDOWN_MAX_MS;
    } else if (i % SMALL_BATCH_SIZE === 0) {
      minTotalMs += SMALL_BATCH_COOLDOWN_MIN_MS;
      maxTotalMs += SMALL_BATCH_COOLDOWN_MAX_MS;
    } else {
      minTotalMs += MIN_INTER_MESSAGE_DELAY_MS;
      maxTotalMs += MAX_INTER_MESSAGE_DELAY_MS;
    }
  }

  return {
    min: Math.ceil(minTotalMs / 60_000),
    max: Math.ceil(maxTotalMs / 60_000),
  };
}

// ─── Smart Batch Sender ────────────────────────────────────────────

export type SmartSendItem<T> = {
  data: T;
  sendFn: (item: T) => Promise<{ success: boolean; error?: string }>;
};

export type SmartSendResult = {
  successCount: number;
  failCount: number;
  skippedCount: number;
  dailyLimitReached: boolean;
  logs: Array<{ index: number; status: "SUCCESS" | "FAILED" | "SKIPPED"; error?: string; delayMs?: number }>;
};

/**
 * Sends messages one-by-one with humanized delays, batch cooldowns,
 * and daily limit enforcement.
 *
 * @param items - Array of items to send, each with a sendFn
 * @param channel - WhatsApp channel for daily limit tracking
 * @param onProgress - Optional callback for progress updates
 */
export async function smartBatchSend<T>(
  items: SmartSendItem<T>[],
  channel: string,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<SmartSendResult> {
  const result: SmartSendResult = {
    successCount: 0,
    failCount: 0,
    skippedCount: 0,
    dailyLimitReached: false,
    logs: [],
  };

  for (let i = 0; i < items.length; i++) {
    // Check daily limit
    if (!canSendMore(channel)) {
      result.dailyLimitReached = true;
      result.skippedCount += items.length - i;
      for (let j = i; j < items.length; j++) {
        result.logs.push({
          index: j,
          status: "SKIPPED",
          error: `تم الوصول للحد اليومي (${DAILY_LIMIT_PER_CHANNEL} رسالة)`,
        });
      }
      console.log(`[SmartSender] Daily limit reached for channel ${channel}. Skipping remaining ${items.length - i} messages.`);
      break;
    }

    // Apply smart delay (humanized)
    const delayMs = await smartDelay(i);

    // Send the message
    try {
      onProgress?.(i + 1, items.length, "sending");
      const sendResult = await items[i].sendFn(items[i].data);

      if (sendResult.success) {
        result.successCount++;
        incrementDailySendCount(channel);
        result.logs.push({ index: i, status: "SUCCESS", delayMs });
      } else {
        result.failCount++;
        result.logs.push({ index: i, status: "FAILED", error: sendResult.error, delayMs });
      }
    } catch (err) {
      result.failCount++;
      const errorMsg = err instanceof Error ? err.message : "فشل الإرسال";
      result.logs.push({ index: i, status: "FAILED", error: errorMsg, delayMs });
    }

    console.log(
      `[SmartSender] [${channel}] Message ${i + 1}/${items.length} — ` +
        `${result.logs[result.logs.length - 1].status} — ` +
        `Daily: ${getDailySendCount(channel)}/${DAILY_LIMIT_PER_CHANNEL}`
    );
  }

  return result;
}
