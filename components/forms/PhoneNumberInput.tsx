"use client";

import { useState } from "react";
import {
  joinInternationalPhone,
  normalizePhoneDigits,
  splitInternationalPhone,
} from "@/lib/phone-number";
import { PHONE_COUNTRIES } from "@/lib/phone-countries";

type PhoneNumberInputProps = {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  defaultCountryCode?: string;
};

function getCountryOption(countryCode: string, selectedIso: string) {
  return (
    PHONE_COUNTRIES.find(
      (country) => country.code === countryCode && country.iso === selectedIso
    ) ||
    PHONE_COUNTRIES.find((country) => country.code === countryCode) || {
      iso: "CUSTOM",
      code: countryCode,
      flag: "🌐",
      label: `+${countryCode}`,
    }
  );
}

export default function PhoneNumberInput({
  label,
  name,
  value,
  onChange,
  required,
  placeholder = "5xxxxxxxxx",
  className = "",
  inputClassName = "",
  defaultCountryCode = "90",
}: PhoneNumberInputProps) {
  const { countryCode, localNumber } = splitInternationalPhone(
    value,
    defaultCountryCode
  );
  const baseInputClass =
    inputClassName ||
    "w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0f5a35] focus:ring-4 focus:ring-[#0f5a35]/10";

  const setParts = (nextCountryCode: string, nextLocalNumber: string) => {
    onChange(joinInternationalPhone(nextCountryCode, nextLocalNumber));
  };
  const [selectedIso, setSelectedIso] = useState(() => {
    return PHONE_COUNTRIES.find((country) => country.code === countryCode)?.iso || "";
  });
  const selectedCountry = getCountryOption(countryCode, selectedIso);

  const handleLocalChange = (rawValue: string) => {
    const raw = rawValue.trim();

    if (/^\+|^00/.test(raw) || normalizePhoneDigits(raw).length > 10) {
      const parsed = splitInternationalPhone(raw, countryCode);
      setParts(parsed.countryCode, parsed.localNumber);
      return;
    }

    setParts(countryCode, raw);
  };

  return (
    <div className={className}>
      {label ? (
        <label className="mb-2 block text-sm font-black text-[#1c2d31]">
          {label}
        </label>
      ) : null}
      {name ? (
        <input
          type="hidden"
          name={name}
          value={joinInternationalPhone(countryCode, localNumber)}
        />
      ) : null}
      <div className="grid grid-cols-[132px_1fr] gap-2" dir="ltr">
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg"
            aria-hidden="true"
          >
            {selectedCountry.flag}
          </span>
          <select
            lang="en"
            value={`${selectedCountry.iso}:${selectedCountry.code}`}
            onChange={(event) => {
              const [nextIso, nextCountryCode] = event.target.value.split(":");
              setSelectedIso(nextIso || "");
              setParts(nextCountryCode || "", "");
            }}
            className={`${baseInputClass} appearance-none pl-10 pr-8 text-left font-mono`}
            aria-label="Country code"
            required={required}
          >
            {PHONE_COUNTRIES.map((country) => (
              <option key={country.iso} value={`${country.iso}:${country.code}`}>
                +{country.code} {country.label}
              </option>
            ))}
            {PHONE_COUNTRIES.some((country) => country.code === countryCode) ? null : (
              <option value={`${selectedCountry.iso}:${countryCode}`}>
                +{countryCode}
              </option>
            )}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#1c2d31]/40"
            aria-hidden="true"
          >
            ▾
          </span>
        </div>
        <input
          type="tel"
          inputMode="tel"
          lang="en"
          value={localNumber}
          onChange={(event) => handleLocalChange(event.target.value)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (!text) return;
            const parsed = splitInternationalPhone(text, countryCode);
            if (parsed.localNumber) {
              event.preventDefault();
              setParts(parsed.countryCode, parsed.localNumber);
            }
          }}
          placeholder={placeholder}
          className={`${baseInputClass} text-left font-mono`}
          aria-label={label || "Phone number"}
          required={required}
        />
      </div>
    </div>
  );
}
