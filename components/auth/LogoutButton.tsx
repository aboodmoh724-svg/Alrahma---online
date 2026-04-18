"use client";

import { useState } from "react";

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={className}
    >
      {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
