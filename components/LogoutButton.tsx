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
      {loading ? "جاري الخروج..." : "🚪 خروج"}
    </button>
  );
}
