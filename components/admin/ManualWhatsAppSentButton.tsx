"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ManualWhatsAppSentButtonProps = {
  reportId: string;
  phone: string;
  message: string;
  fallbackUrl: string;
};

export function ManualWhatsAppSentButton({
  reportId,
  phone,
  message,
  fallbackUrl,
}: ManualWhatsAppSentButtonProps) {
  const router = useRouter();
  const [opening, setOpening] = useState<"regular" | "business" | null>(null);
  const [markingSent, setMarkingSent] = useState(false);

  const markSent = async () => {
    const response = await fetch(`/api/reports/${reportId}/manual-whatsapp-sent`, {
      method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "تعذر تسجيل إرسال الواتساب");
    }
  };

  const openWhatsApp = async (mode: "regular" | "business") => {
    if (opening || markingSent) return;

    setOpening(mode);
    const encodedMessage = encodeURIComponent(message);
    const encodedFallbackUrl = encodeURIComponent(fallbackUrl);

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // WhatsApp still opens even if clipboard permissions are blocked.
    }

    if (mode === "business") {
      const businessIntent = `intent://send/?phone=${phone}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${encodedFallbackUrl};end`;
      const whatsappProtocol = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
      window.location.href = businessIntent;

      window.setTimeout(() => {
        if (!document.hidden) {
          window.location.href = whatsappProtocol;
        }
      }, 700);
    } else {
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    }

    window.setTimeout(() => setOpening(null), 900);
  };

  const confirmSent = async () => {
    if (opening || markingSent) return;

    const confirmed = window.confirm(
      "هل تم إرسال رسالة الواتساب لولي الأمر بالفعل؟\n\nلن يختفي الطالب من القائمة إلا بعد تأكيدك هنا."
    );

    if (!confirmed) return;

    try {
      setMarkingSent(true);
      await markSent();
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تسجيل إرسال الواتساب");
    } finally {
      setMarkingSent(false);
    }
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => openWhatsApp("regular")}
        disabled={Boolean(opening) || markingSent}
        className="rounded-2xl bg-[#1f6358] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {opening === "regular" ? "جاري فتح واتساب..." : "فتح واتساب"}
      </button>
      <button
        type="button"
        onClick={() => openWhatsApp("business")}
        disabled={Boolean(opening) || markingSent}
        className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {opening === "business" ? "جاري فتح واتساب بزنس..." : "فتح واتساب بزنس"}
      </button>
      <button
        type="button"
        onClick={confirmSent}
        disabled={Boolean(opening) || markingSent}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-black text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {markingSent ? "جاري تسجيل الإرسال..." : "تم إرسال الرسالة"}
      </button>
    </div>
  );
}
