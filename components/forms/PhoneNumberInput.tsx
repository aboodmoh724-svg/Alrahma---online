"use client";

import {
  joinInternationalPhone,
  normalizePhoneDigits,
  splitInternationalPhone,
} from "@/lib/phone-number";

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
    "w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10";

  const setParts = (nextCountryCode: string, nextLocalNumber: string) => {
    onChange(joinInternationalPhone(nextCountryCode, nextLocalNumber));
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
      <div className="grid grid-cols-[104px_1fr] gap-2" dir="ltr">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[#1c2d31]/45">
            +
          </span>
          <input
            type="tel"
            inputMode="tel"
            lang="en"
            value={countryCode}
            onChange={(event) => setParts(event.target.value, localNumber)}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (!text) return;
              const parsed = splitInternationalPhone(text, countryCode);
              if (parsed.localNumber) {
                event.preventDefault();
                setParts(parsed.countryCode, parsed.localNumber);
              }
            }}
            className={`${baseInputClass} pl-7 text-left font-mono`}
            aria-label="Country code"
            required={required}
          />
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
