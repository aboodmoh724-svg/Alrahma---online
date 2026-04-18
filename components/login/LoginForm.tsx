"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
};

function getSavedLogin() {
  if (typeof window === "undefined") {
    return {
      email: "",
      password: "",
      rememberMe: false,
    };
  }

  const savedLogin = localStorage.getItem("alrahma_teacher_login");

  if (!savedLogin) {
    return {
      email: "",
      password: "",
      rememberMe: false,
    };
  }

  try {
    const parsed = JSON.parse(savedLogin) as {
      email?: string;
      password?: string;
    };
    const email = parsed.email || "";
    const password = parsed.password || "";

    return {
      email,
      password,
      rememberMe: Boolean(email || password),
    };
  } catch {
    localStorage.removeItem("alrahma_teacher_login");

    return {
      email: "",
      password: "",
      rememberMe: false,
    };
  }
}

export default function LoginForm({
  title = "تسجيل الدخول",
  subtitle = "أدخل بياناتك للوصول إلى حسابك",
  buttonLabel = "تسجيل الدخول",
}: LoginFormProps) {
  const router = useRouter();
  const [savedLogin] = useState(getSavedLogin);

  const [email, setEmail] = useState(savedLogin.email);
  const [password, setPassword] = useState(savedLogin.password);
  const [rememberMe, setRememberMe] = useState(savedLogin.rememberMe);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "فشل تسجيل الدخول");
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem(
          "alrahma_teacher_login",
          JSON.stringify({ email, password })
        );
      } else {
        localStorage.removeItem("alrahma_teacher_login");
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch (error) {
      console.error("LOGIN FORM ERROR:", error);
      setErrorMessage("حدث خطأ أثناء تسجيل الدخول");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-right">
        <div className="mb-4 inline-flex rounded-full bg-[#1f6358]/10 px-4 py-2 text-xs font-bold text-[#1f6358]">
          منصة الرحمة
        </div>
        <h1 className="text-4xl font-black text-[#1c2d31]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[#1c2d31]/60">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1c2d31]">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fbf8f2] px-4 py-4 text-right text-sm text-[#1c2d31] outline-none transition placeholder:text-[#1c2d31]/35 focus:border-[#1f6358] focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#1c2d31]">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fbf8f2] px-4 py-4 text-right text-sm text-[#1c2d31] outline-none transition placeholder:text-[#1c2d31]/35 focus:border-[#1f6358] focus:bg-white"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[#1c2d31]/65">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[#d9c8ad]"
          />
          تذكرني
        </label>

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#1f6358] px-4 py-4 text-base font-black text-white shadow-md transition hover:bg-[#173d42] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "جاري تسجيل الدخول..." : buttonLabel}
        </button>
      </form>
    </div>
  );
}
