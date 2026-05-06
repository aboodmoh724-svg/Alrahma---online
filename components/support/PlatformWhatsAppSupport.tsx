const supportPhoneDisplay = "+44 7366 520921";
const supportPhoneForWhatsApp = "447366520921";

type PlatformWhatsAppSupportProps = {
  compact?: boolean;
};

export default function PlatformWhatsAppSupport({
  compact = false,
}: PlatformWhatsAppSupportProps) {
  const message = encodeURIComponent(
    "السلام عليكم، لدي استفسار بخصوص منصة الرحمة."
  );

  return (
    <section
      className={`rounded-[1.5rem] border border-[#d8bf83] bg-[#fffaf4] text-[#1c2d31] shadow-sm ${
        compact ? "p-4" : "p-4 sm:p-5"
      }`}
    >
      <div
        className={`flex gap-3 ${
          compact
            ? "flex-col"
            : "flex-col sm:flex-row sm:items-center sm:justify-between"
        }`}
      >
        <div>
          <p className="text-sm font-black text-[#0a3f2a]">الدعم عبر واتساب</p>
          <p className="mt-1 text-sm leading-7 text-[#1c2d31]/65">
            في حال وجود أي مشكلة في التسجيل أو أي استفسار يمكنك التواصل مباشرة
            مع رقم المنصة.
          </p>
        </div>
        <a
          href={`https://wa.me/${supportPhoneForWhatsApp}?text=${message}`}
          target="_blank"
          rel="noreferrer"
          dir="ltr"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#0f5a35] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a]"
        >
          WhatsApp {supportPhoneDisplay}
        </a>
      </div>
    </section>
  );
}
