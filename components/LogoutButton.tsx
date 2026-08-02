"use client";

import { useState } from "react";

type LogoutButtonProps = {
  redirectUrl?: string;
  className?: string;
};

export default function LogoutButton({
  redirectUrl = "/onsite/summer",
  className,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Ignore network errors, proceed to clear cookies via location redirect
    }

    // Force expire client cookies manually as fallback
    document.cookie = "alrahma_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "alrahma_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    document.cookie = "alrahma_user_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

    window.location.href = redirectUrl;
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ||
        "rounded-xl bg-red-900/80 border border-red-400/40 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-900 transition flex items-center gap-1 font-serif disabled:opacity-50"
      }
      title="تسجيل الخروج"
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      )}
    </button>
  );
}
