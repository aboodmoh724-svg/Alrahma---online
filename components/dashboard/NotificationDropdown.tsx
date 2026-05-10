"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  neutral: "border-[#e7d7b4] bg-[#fffaf4] text-[#0a3f2a]",
};

export default function NotificationDropdown({ title = "التنبيهات", items }: Props) {
  const [open, setOpen] = useState(false);
  const [hiddenKeys, setHiddenKeys] = useState<Record<string, boolean>>({});
  const visibleItems = useMemo(
    () => items.filter((item) => item.count > 0),
    [items]
  );
  const badgeItems = useMemo(
    () => items.filter((item) => item.count > 0 && !hiddenKeys[`${item.key}:${item.count}`]),
    [hiddenKeys, items]
  );
  const total = badgeItems.reduce((sum, item) => sum + item.count, 0);

  useEffect(() => {
    const hidden: Record<string, boolean> = {};
    for (const item of items) {
      const key = `${item.key}:${item.count}`;
      if (item.count > 0 && window.localStorage.getItem(`alrahma-dashboard-notification:${key}`)) {
        hidden[key] = true;
      }
    }
    setHiddenKeys(hidden);
  }, [items]);

  const markVisibleItemsAsSeen = () => {
    const nextHidden: Record<string, boolean> = {};
    for (const item of visibleItems) {
      const key = `${item.key}:${item.count}`;
      window.localStorage.setItem(`alrahma-dashboard-notification:${key}`, "1");
      nextHidden[key] = true;
    }
    if (Object.keys(nextHidden).length > 0) {
      setHiddenKeys((prev) => ({ ...prev, ...nextHidden }));
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) markVisibleItemsAsSeen();
            return next;
          });
        }}
        className="relative rounded-full bg-white px-5 py-3 text-sm font-black text-[#0a3f2a] shadow-sm ring-1 ring-white/30 transition hover:bg-[#fffaf4]"
      >
        {title}
        {total > 0 ? (
          <span className="absolute -left-2 -top-2 inline-flex min-w-7 items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">
            {total}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
        <button
          type="button"
          aria-label="إغلاق التنبيهات"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[80] cursor-default bg-transparent"
        />
        <div className="fixed left-1/2 top-20 z-[90] flex max-h-[calc(100dvh-6rem)] w-[min(30rem,calc(100vw-1rem))] -translate-x-1/2 flex-col overflow-hidden rounded-[1.5rem] border border-[#d8bf83] bg-white text-[#0a3f2a] shadow-2xl sm:top-24">
          <div className="flex items-center justify-between border-b border-[#e7d7b4] px-4 py-3">
            <p className="font-black">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#fffaf4] px-3 py-1 text-xs font-black text-[#8a661f]"
            >
              إغلاق
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
            {visibleItems.length === 0 ? (
              <div className="rounded-2xl bg-[#fffaf4] p-4 text-sm font-bold text-[#0a3f2a]/65">
                لا توجد تنبيهات جديدة الآن.
              </div>
            ) : (
              visibleItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => {
                    const key = `${item.key}:${item.count}`;
                    window.localStorage.setItem(`alrahma-dashboard-notification:${key}`, "1");
                    setHiddenKeys((prev) => ({ ...prev, [key]: true }));
                    setOpen(false);
                  }}
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
        </>
      ) : null}
    </div>
  );
}
