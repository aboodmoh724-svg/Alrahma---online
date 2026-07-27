export function getTodayDateKey(): string {
  const now = new Date();
  // Use UTC+3 (Turkey/Syria timezone)
  const offset = 3 * 60; // minutes
  const local = new Date(now.getTime() + offset * 60000);
  return local.toISOString().split('T')[0];
}

export function toLocalDateKey(date: Date): string {
  const offset = 3 * 60;
  const local = new Date(date.getTime() + offset * 60000);
  return local.toISOString().split('T')[0];
}

export function getLocalDayOfWeek(date: Date): number {
  const offset = 3 * 60;
  const local = new Date(date.getTime() + offset * 60000);
  return local.getUTCDay();
}
