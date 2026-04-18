"use client";

type WhatsAppBusinessButtonProps = {
  phone: string;
  message: string;
  fallbackUrl: string;
};

export function WhatsAppBusinessButton({
  phone,
  message,
  fallbackUrl,
}: WhatsAppBusinessButtonProps) {
  const openWhatsAppBusiness = async () => {
    const encodedMessage = encodeURIComponent(message);
    const encodedFallbackUrl = encodeURIComponent(fallbackUrl);
    const businessIntent = `intent://send/?phone=${phone}&text=${encodedMessage}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${encodedFallbackUrl};end`;
    const whatsappProtocol = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Clipboard access can be blocked by the browser; opening WhatsApp still works.
    }

    window.location.href = businessIntent;

    window.setTimeout(() => {
      if (!document.hidden) {
        window.location.href = whatsappProtocol;
      }
    }, 700);
  };

  return (
    <button
      type="button"
      onClick={openWhatsAppBusiness}
      className="rounded-2xl bg-[#173d42] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#1f6358]"
    >
      فتح واتساب بزنس
    </button>
  );
}
