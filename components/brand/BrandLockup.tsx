import Image from "next/image";

type BrandLockupProps = {
  compact?: boolean;
  light?: boolean;
  className?: string;
};

export default function BrandLockup({
  compact = false,
  light = false,
  className = "",
}: BrandLockupProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex items-center rounded-3xl bg-white shadow-sm ring-1 ring-[#d8bf83]/45 ${
          compact ? "h-14 px-2" : "h-20 px-3"
        }`}
      >
        <Image
          src="/images/brand-preview-logo.jpeg"
          alt="شعار منصة الرحمة"
          width={compact ? 42 : 58}
          height={compact ? 42 : 58}
          className="h-auto w-auto rounded-2xl object-contain"
          priority={!compact}
        />
        <span className="mx-2 h-8 w-px bg-[#d8bf83]/55" />
        <Image
          src="/logo.webp"
          alt="شعار تحفيظ الرحمة"
          width={compact ? 34 : 46}
          height={compact ? 34 : 46}
          className="h-auto w-auto object-contain"
        />
      </div>
      <div className={compact ? "hidden sm:block" : ""}>
        <p
          className={`font-black ${
            compact ? "text-sm" : "text-xl"
          } ${light ? "text-white" : "text-[#0f5a35]"}`}
        >
          منصة الرحمة لتعليم القرآن الكريم
        </p>
        <p
          className={`mt-0.5 font-bold tracking-[0.18em] ${
            compact ? "text-[10px]" : "text-xs"
          } ${light ? "text-[#f2d18a]" : "text-[#bd8f2d]"}`}
          dir="ltr"
        >
          AL-RAHMA QURAN PLATFORM
        </p>
      </div>
    </div>
  );
}
