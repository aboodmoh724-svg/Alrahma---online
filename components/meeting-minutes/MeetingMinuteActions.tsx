"use client";

import { useState } from "react";

type MeetingMinuteActionsProps = {
  whatsappText: string;
};

export default function MeetingMinuteActions({
  whatsappText,
}: MeetingMinuteActionsProps) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="no-print flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#0a3f2a]"
      >
        تصدير PDF
      </button>
      <button
        type="button"
        onClick={copyText}
        className="rounded-2xl bg-[#fffaf4] px-5 py-3 text-center text-sm font-black text-[#0a3f2a] ring-1 ring-[#d8bf83] transition hover:bg-white"
      >
        {copied ? "تم نسخ النص" : "نسخ نص الواتساب"}
      </button>
    </div>
  );
}
