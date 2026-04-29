"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  href: string;
  title: string;
  description: string;
  tone: string;
  badge: number | null;
};

export default function DashboardSectionLink({
  href,
  title,
  description,
  tone,
  badge,
}: Props) {
  const storageKey = `alrahma-supervision-badge:${href}:${badge || 0}`;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(Boolean(window.localStorage.getItem(storageKey)));
  }, [storageKey]);

  return (
    <Link
      href={href}
      onClick={() => {
        if (badge && badge > 0) {
          window.localStorage.setItem(storageKey, "1");
          setHidden(true);
        }
      }}
      className={`relative min-h-48 overflow-hidden rounded-[2rem] p-6 shadow-sm ring-1 ring-[#d9c8ad] transition hover:-translate-y-0.5 ${tone}`}
    >
      {badge !== null && badge > 0 && !hidden ? (
        <span className="absolute left-5 top-5 rounded-full bg-[#c39a62] px-3 py-1 text-xs font-black text-white shadow-sm">
          +{badge}
        </span>
      ) : null}
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-4 text-sm leading-8 opacity-75">{description}</p>
      <span className="mt-6 inline-flex rounded-full bg-black/10 px-4 py-2 text-sm font-black">
        فتح القسم
      </span>
    </Link>
  );
}
