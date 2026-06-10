"use client";

import { useState } from "react";

type Recipient = {
  id: string;
  name: string | null;
  phone: string;
};

type MeetingMinuteWhatsappSenderProps = {
  minuteId: string;
  recipients: Recipient[];
};

export default function MeetingMinuteWhatsappSender({
  minuteId,
  recipients,
}: MeetingMinuteWhatsappSenderProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState<"text" | "pdf" | null>(null);
  const [message, setMessage] = useState("");

  const toggleRecipient = (recipientId: string) => {
    setSelected((current) =>
      current.includes(recipientId)
        ? current.filter((id) => id !== recipientId)
        : [...current, recipientId]
    );
  };

  const send = async (mode: "text" | "pdf") => {
    if (!selected.length) {
      setMessage("اختر مستلمًا واحدًا على الأقل.");
      return;
    }

    setSending(mode);
    setMessage("");

    try {
      const response = await fetch(`/api/remote/meeting-minutes/${minuteId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          recipientIds: selected,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      setMessage(result?.message || result?.error || "حدث خطأ أثناء الإرسال.");
    } catch {
      setMessage("حدث خطأ أثناء الإرسال.");
    } finally {
      setSending(null);
    }
  };

  if (!recipients.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#76923c] p-6 text-center text-sm text-[#1c2d31]/60">
        لا توجد أرقام محفوظة. أضف رقمًا ثم أرسل المحضر.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2">
        {recipients.map((recipient) => (
          <label
            key={recipient.id}
            className={`flex items-center gap-3 border px-4 py-3 text-sm font-bold transition ${
              selected.includes(recipient.id)
                ? "border-[#76923c] bg-[#edf4e4]"
                : "border-[#d9d9d9] bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(recipient.id)}
              onChange={() => toggleRecipient(recipient.id)}
              className="h-4 w-4 accent-[#76923c]"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-black">{recipient.name || "مستلم بدون اسم"}</span>
              <span className="block text-xs text-[#1c2d31]/55" dir="ltr">
                {recipient.phone}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => send("text")}
          disabled={Boolean(sending)}
          className="bg-[#76923c] px-5 py-3 text-sm font-black text-white transition hover:bg-[#5e7430] disabled:opacity-60"
        >
          {sending === "text" ? "جار الإرسال..." : "إرسال نص عبر الواتساب"}
        </button>
        <button
          type="button"
          onClick={() => send("pdf")}
          disabled={Boolean(sending)}
          className="bg-[#1c2d31] px-5 py-3 text-sm font-black text-white transition hover:bg-[#101b1e] disabled:opacity-60"
        >
          {sending === "pdf" ? "جار الإرسال..." : "إرسال PDF عبر الواتساب"}
        </button>
      </div>

      {message ? (
        <div className="border border-[#d9d9d9] bg-[#fef1e6] px-4 py-3 text-sm font-black text-[#1c2d31]">
          {message}
        </div>
      ) : null}
    </div>
  );
}
