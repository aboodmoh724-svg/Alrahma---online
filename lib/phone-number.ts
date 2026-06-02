import { KNOWN_PHONE_COUNTRY_CODES } from "@/lib/phone-countries";

export function normalizePhoneDigits(value: unknown) {
  let digits = String(value || "").replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  digits = digits.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  return digits;
}

export function normalizeInternationalPhone(value: unknown, defaultCountryCode = "90") {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";

  const fallbackCountry = normalizePhoneDigits(defaultCountryCode) || "90";
  if (digits.startsWith("0") && !digits.startsWith("00") && digits.length >= 9 && digits.length <= 11) {
    return `${fallbackCountry}${digits.slice(1)}`;
  }

  const parts = splitInternationalPhone(digits, fallbackCountry);
  let localNumber = normalizePhoneDigits(parts.localNumber);
  const countryCode = normalizePhoneDigits(parts.countryCode) || fallbackCountry;

  while (
    localNumber.startsWith(countryCode) &&
    localNumber.length > countryCode.length + 5
  ) {
    localNumber = localNumber.slice(countryCode.length);
  }

  if (localNumber.startsWith("00") && localNumber.length > 8) {
    localNumber = localNumber.slice(2);
  }

  if (localNumber.startsWith("0") && localNumber.length > 8) {
    localNumber = localNumber.slice(1);
  }

  return `${countryCode}${localNumber}`;
}

export function splitInternationalPhone(value: unknown, defaultCountryCode = "90") {
  const digits = normalizePhoneDigits(value);
  const fallbackCountry = normalizePhoneDigits(defaultCountryCode) || "90";

  if (!digits) {
    return { countryCode: fallbackCountry, localNumber: "" };
  }

  if (digits === fallbackCountry) {
    return { countryCode: fallbackCountry, localNumber: "" };
  }

  const exactCountryCode = KNOWN_PHONE_COUNTRY_CODES.find((code) => digits === code);
  if (exactCountryCode) {
    return { countryCode: exactCountryCode, localNumber: "" };
  }

  const matchedCountryCode = KNOWN_PHONE_COUNTRY_CODES.find(
    (code) => digits.startsWith(code) && digits.length > code.length
  );
  if (matchedCountryCode) {
    return {
      countryCode: matchedCountryCode,
      localNumber: digits.slice(matchedCountryCode.length),
    };
  }

  if (digits.startsWith(fallbackCountry) && digits.length > fallbackCountry.length + 3) {
    return {
      countryCode: fallbackCountry,
      localNumber: digits.slice(fallbackCountry.length),
    };
  }

  if (digits.startsWith("90") && digits.length > 5) {
    return { countryCode: "90", localNumber: digits.slice(2) };
  }

  if (digits.startsWith("966") && digits.length > 6) {
    return { countryCode: "966", localNumber: digits.slice(3) };
  }

  if (digits.length > 10) {
    return {
      countryCode: digits.slice(0, digits.length - 10),
      localNumber: digits.slice(-10),
    };
  }

  return { countryCode: fallbackCountry, localNumber: digits };
}

export function joinInternationalPhone(countryCode: unknown, localNumber: unknown) {
  const country = normalizePhoneDigits(countryCode);
  const local = normalizePhoneDigits(localNumber);

  return normalizeInternationalPhone(`${country}${local}`, country);
}

export function normalizeSyriaPhone(value: unknown) {
  const normalized = normalizeInternationalPhone(value, "963");
  const parts = splitInternationalPhone(normalized, "963");
  let localNumber = normalizePhoneDigits(parts.localNumber);

  if (localNumber.startsWith("0") && localNumber.length > 9) {
    localNumber = localNumber.slice(1);
  }

  if (localNumber.length !== 9) {
    return "";
  }

  return `963${localNumber}`;
}

export function formatSyriaLocalPhone(value: unknown) {
  const normalized = normalizeSyriaPhone(value);
  if (!normalized) return "";

  const localNumber = normalized.slice(3);
  return [localNumber.slice(0, 3), localNumber.slice(3, 6), localNumber.slice(6, 9)]
    .filter(Boolean)
    .join(" ");
}
