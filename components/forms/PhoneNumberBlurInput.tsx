"use client";

import { useEffect, useState } from "react";
import PhoneNumberInput from "@/components/forms/PhoneNumberInput";
import { normalizePhoneDigits } from "@/lib/phone-number";

type PhoneNumberBlurInputProps = {
  value: string;
  onCommit: (value: string) => Promise<boolean> | boolean;
  inputClassName?: string;
  placeholder?: string;
};

export default function PhoneNumberBlurInput({
  value,
  onCommit,
  inputClassName,
  placeholder,
}: PhoneNumberBlurInputProps) {
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const commit = async () => {
    const next = normalizePhoneDigits(draft);
    const previous = normalizePhoneDigits(value);

    if (next === previous) {
      setDraft(previous);
      return;
    }

    const saved = await onCommit(next);
    if (!saved) {
      setDraft(value || "");
      return;
    }

    setDraft(next);
  };

  return (
    <div onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        void commit();
      }
    }}>
      <PhoneNumberInput
        value={draft}
        onChange={setDraft}
        inputClassName={inputClassName}
        placeholder={placeholder}
      />
    </div>
  );
}

