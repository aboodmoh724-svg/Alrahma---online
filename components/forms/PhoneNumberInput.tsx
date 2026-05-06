"use client";

import { useMemo, useState } from "react";
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
  compactCountryPicker?: boolean;
  preferredCountryIsos?: string[];
};

const defaultPreferredCountryIsos = [
  "TR",
  "SY",
  "SA",
  "EG",
  "JO",
  "IQ",
  "PS",
  "LB",
  "YE",
  "AE",
  "QA",
  "KW",
  "BH",
  "OM",
  "DE",
  "NL",
  "SE",
  "AT",
  "GB",
  "US",
  "CA",
];

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
  compactCountryPicker = false,
  preferredCountryIsos = defaultPreferredCountryIsos,
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
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const selectedCountry = getCountryOption(countryCode, selectedIso);
  const preferredCountries = useMemo(() => {
    const preferredSet = new Set(preferredCountryIsos);
    return PHONE_COUNTRIES.filter((country) => preferredSet.has(country.iso));
  }, [preferredCountryIsos]);
  const countrySearchResults = useMemo(() => {
    const keyword = countrySearch.trim().toLowerCase().replace("+", "");

    if (!keyword) {
      return preferredCountries;
    }

    return PHONE_COUNTRIES.filter((country) => {
      const searchable = `${country.label} ${country.iso} ${country.code}`.toLowerCase();
      return searchable.includes(keyword);
    }).slice(0, 35);
  }, [countrySearch, preferredCountries]);

  const chooseCountry = (nextIso: string, nextCountryCode: string) => {
    setSelectedIso(nextIso || "");
    setParts(nextCountryCode || "", "");
    setCountrySearch("");
    setCountryPickerOpen(false);
  };

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
          {compactCountryPicker ? (
            <>
              <button
                type="button"
                onClick={() => setCountryPickerOpen((current) => !current)}
                className={`${baseInputClass} pl-10 pr-8 text-left font-mono`}
                aria-label="Country code"
              >
                +{countryCode}
              </button>
              {countryPickerOpen ? (
                <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[#d8bf83] bg-white p-2 text-right shadow-xl" dir="rtl">
                  <input
                    autoFocus
                    value={countrySearch}
                    onChange={(event) => setCountrySearch(event.target.value)}
                    placeholder="ابحث عن الدولة أو الرمز"
                    className="w-full rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-3 py-2 text-sm outline-none focus:border-[#0f5a35]"
                  />
                  <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                    {countrySearchResults.map((country) => (
                      <button
                        key={country.iso}
                        type="button"
                        onClick={() => chooseCountry(country.iso, country.code)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-bold transition hover:bg-[#fffaf4] ${
                          country.iso === selectedIso ? "bg-[#f4ead7] text-[#0f5a35]" : "text-[#1c2d31]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.label}</span>
                        </span>
                        <span dir="ltr" className="font-mono text-[#1c2d31]/60">+{country.code}</span>
                      </button>
                    ))}
                    {countrySearchResults.length === 0 ? (
                      <div className="rounded-xl bg-[#fffaf4] p-3 text-xs leading-6 text-[#1c2d31]/60">
                        لم تظهر الدولة. يمكنك كتابة الرقم كاملًا في خانة الهاتف مثل +49 ثم الرقم.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <select
              lang="en"
              value={`${selectedCountry.iso}:${selectedCountry.code}`}
              onChange={(event) => {
                const [nextIso, nextCountryCode] = event.target.value.split(":");
                chooseCountry(nextIso || "", nextCountryCode || "");
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
          )}
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
