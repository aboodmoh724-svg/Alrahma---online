import Image from "next/image";

type BrandHeroMediaProps = {
  src: string;
  alt?: string;
  opacity?: string;
};

export default function BrandHeroMedia({
  src,
  alt = "",
  opacity = "opacity-55",
}: BrandHeroMediaProps) {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className={`absolute inset-0 object-cover ${opacity}`}
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0a3f2a]/94 via-[#0a3f2a]/78 to-[#0a3f2a]/48" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#062b1d]/70 to-transparent" />
    </>
  );
}
