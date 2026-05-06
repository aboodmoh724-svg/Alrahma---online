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

export function splitInternationalPhone(value: unknown, defaultCountryCode = "90") {
  const digits = normalizePhoneDigits(value);
  const fallbackCountry = normalizePhoneDigits(defaultCountryCode) || "90";

  if (!digits) {
    return { countryCode: fallbackCountry, localNumber: "" };
  }

  if (digits === fallbackCountry) {
    return { countryCode: fallbackCountry, localNumber: "" };
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

  return `${country}${local}`;
}
