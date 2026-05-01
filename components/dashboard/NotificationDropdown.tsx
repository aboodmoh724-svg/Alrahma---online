"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type NotificationItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  count: number;
  tone?: "red" | "amber" | "green" | "neutral";
};

type Props = {
  title?: string;
  items: NotificationItem[];
};

const toneClass: Record<NonNullable<NotificationItem["tone"]>, string> = {
  red: "border-red-100 bg-red-50 text-red-800",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  green: "border-emerald-100 bg-emerald-50 text-emerald-800",
  neutral: "border-[#eadcc6] bg-[#fffaf2] text-[#173d42]",
};

export default function NotificationDropdown({ title = "التنبيهات", items }: Props) {
  const [open, setOpen] = useState(false);
  const activeItems = useMemo(() => items.filter((item) => item.count > 0), [items]);
  const total = activeItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-full bg-white px-5 py-3 text-sm font-black text-[#173d42] shadow-sm ring-1 ring-white/30 transition hover:bg-[#fffaf2]"
      >
        {title}
        {total > 0 ? (
          <span className="absolute -left-2 -top-2 inline-flex min-w-7 items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">
            {total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-0 z-30 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border border-[#d9c8ad] bg-white text-[#173d42] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#eadcc6] px-4 py-3">
            <p className="font-black">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#fffaf2] px-3 py-1 text-xs font-black text-[#8a6335]"
            >
              إغلاق
            </button>
          </div>
          <div className="max-h-96 space-y-2 overflow-auto p-3">
            {activeItems.length === 0 ? (
              <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-bold text-[#173d42]/65">
                لا توجد تنبيهات جديدة الآن.
              </div>
            ) : (
              activeItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                    toneClass[item.tone || "neutral"]
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{item.title}</p>
                      <p className="mt-1 text-xs leading-6 opacity-75">{item.description}</p>
                    </div>
                    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-black shadow-sm">
                      +{item.count}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
