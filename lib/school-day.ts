const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

function shiftedToIstanbul(date: Date) {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MS);
}

export function getIstanbulDayRange(date = new Date()) {
  const shifted = shiftedToIstanbul(date);
  const startUtcMs =
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      0,
      0,
      0,
      0
    ) - ISTANBUL_OFFSET_MS;

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + 24 * 60 * 60 * 1000),
  };
}

export function getIstanbulDateKey(date: Date) {
  const shifted = shiftedToIstanbul(date);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatIstanbulDateEnglish(date: Date) {
  const [year, month, day] = getIstanbulDateKey(date).split("-");

  return `${Number(month)}/${Number(day)}/${year}`;
}
