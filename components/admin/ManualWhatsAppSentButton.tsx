"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ManualWhatsAppSentButtonProps = {
  reportId: string;
  phone: string;
  message: string;
  fallbackUrl: string;
  mode?: "regular" | "business";
};

export function ManualWhatsAppSentButton({
  reportId,
  phone,
  message,
  fallbackUrl,
  mode = "regular",
}: ManualWhatsAppSentButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const markSent = async () => {
    const response = await fetch(`/api/reports/${reportId}/manual-whatsapp-sent`, {
      method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "تعذر تسجيل إرسال الواتساب");
    }
  };

  const openWhatsApp = async () => {
    if (submitting) return;

    setSubmitting(true);
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

    try {
      await markSent();
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "تعذر تسجيل إرسال الواتساب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openWhatsApp}
      disabled={submitting}
      className={
        mode === "business"
          ? "rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358] disabled:cursor-not-allowed disabled:opacity-60"
          : "rounded-2xl bg-[#1f6358] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {submitting
        ? "جاري التسجيل..."
        : mode === "business"
          ? "فتح واتساب بزنس وتسجيل الإرسال"
          : "فتح واتساب وتسجيل الإرسال"}
    </button>
  );
}
