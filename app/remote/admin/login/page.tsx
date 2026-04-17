import Link from "next/link";

export default function RemoteAdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f3eee6]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] bg-white shadow-[0_25px_80px_rgba(36,54,61,0.14)] lg:grid-cols-2">
          <div
            className="relative hidden min-h-[720px] bg-cover bg-center lg:block"
            style={{ backgroundImage: "url('/images/login-admin.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#102a33]/35 to-transparent" />
          </div>

          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center justify-between">
                <Link
                  href="/remote"
                  className="text-sm font-semibold text-[#24363D]/70 transition hover:text-[#24363D]"
                >
                  ← رجوع
                </Link>

                <div className="rounded-full bg-[#143b46]/10 px-4 py-1.5 text-xs font-semibold text-[#143b46]">
                  الإدارة
                </div>
              </div>

              <div className="mb-8 text-right">
                <div className="mb-3 inline-flex rounded-full bg-[#143b46]/10 px-4 py-1.5 text-sm font-semibold text-[#143b46]">
                  منصة الرحمة
                </div>
                <h1 className="text-3xl font-extrabold text-[#24363D] md:text-4xl">
                  تسجيل دخول الإدارة
                </h1>
              </div>

              <form className="space-y-5">
                <div className="text-right">
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-[#24363D]"
                  >
                    اسم المستخدم
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    className="w-full rounded-2xl border border-[#e7ded0] bg-[#faf7f3] px-4 py-4 text-right text-sm text-[#24363D] outline-none transition placeholder:text-[#24363D]/35 focus:border-[#c49a64] focus:bg-white"
                  />
                </div>

                <div className="text-right">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-[#24363D]"
                  >
                    كلمة المرور
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    className="w-full rounded-2xl border border-[#e7ded0] bg-[#faf7f3] px-4 py-4 text-right text-sm text-[#24363D] outline-none transition placeholder:text-[#24363D]/35 focus:border-[#c49a64] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#143b46] py-4 text-base font-bold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#102f38]"
                >
                  تسجيل الدخول
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}