import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

async function requireRemoteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      canAccessFinance: true,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      canAccessFinance: true,
    },
  });
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase();
}

function checkboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

async function createRemoteAdmin(formData: FormData) {
  "use server";

  const currentAdmin = await requireRemoteAdmin();
  if (!currentAdmin) return;

  const fullName = String(formData.get("fullName") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "").trim();
  const canAccessFinance = checkboxValue(formData.get("canAccessFinance"));

  if (!fullName || !email || !password) return;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) return;

  await prisma.user.create({
    data: {
      fullName,
      email,
      password,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
      canAccessFinance,
    },
  });

  revalidatePath("/remote/admin/admins");
}

async function updateRemoteAdmin(formData: FormData) {
  "use server";

  const currentAdmin = await requireRemoteAdmin();
  if (!currentAdmin) return;

  const adminId = String(formData.get("adminId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "").trim();
  const canAccessFinance = checkboxValue(formData.get("canAccessFinance"));
  const isActive = checkboxValue(formData.get("isActive"));

  if (!adminId || !fullName || !email) return;

  const targetAdmin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: "ADMIN",
      studyMode: "REMOTE",
    },
    select: {
      id: true,
    },
  });

  if (!targetAdmin) return;
  if (targetAdmin.id === currentAdmin.id && !isActive) return;

  const emailOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (emailOwner && emailOwner.id !== targetAdmin.id) return;

  await prisma.user.update({
    where: { id: targetAdmin.id },
    data: {
      fullName,
      email,
      ...(password ? { password } : {}),
      canAccessFinance,
      isActive,
    },
  });

  revalidatePath("/remote/admin/admins");
}

export default async function RemoteAdminsPage() {
  const currentAdmin = await requireRemoteAdmin();

  if (!currentAdmin) {
    return (
      <main className="min-h-screen bg-[#f6efe3] p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-white p-6 text-[#173d42] shadow-sm">
          <p className="text-lg font-black">هذه الصفحة مخصصة لإدارة الأونلاين فقط.</p>
          <Link href="/remote/admin/login" className="mt-5 inline-flex rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white">
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      studyMode: "REMOTE",
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      password: true,
      isActive: true,
      canAccessFinance: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#f6efe3] px-4 py-6 text-[#173d42]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#102f34] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-[#c39a62]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                الإداريون والصلاحيات
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                أضف الإداريين وحدد من يرى الحسابات المالية.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
                من هنا لا تحتاج لإضافة الإداري من Supabase. النظام سينشئ المعرّف تلقائياً، ويمكنك إعطاء صلاحية المالية أو سحبها من الحساب.
              </p>
            </div>
            <Link href="/remote/admin/dashboard" className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#173d42]">
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.6fr]">
          <form action={createRemoteAdmin} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">إضافة إداري جديد</h2>
            <p className="mt-2 text-sm leading-7 text-[#173d42]/60">
              سيضاف الإداري لقسم التعليم عن بعد فقط. كلمة المرور حالياً نصية مثل نظام الدخول الحالي.
            </p>
            <div className="mt-5 grid gap-3">
              <input name="fullName" required placeholder="اسم الإداري" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="email" type="email" required placeholder="البريد الإلكتروني" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="password" required placeholder="كلمة المرور" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <label className="flex items-center gap-3 rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm font-black">
                <input name="canAccessFinance" type="checkbox" className="h-4 w-4" />
                السماح بدخول الحسابات المالية
              </label>
              <ConfirmSubmitButton
                confirmMessage="هل تريد إضافة هذا الإداري؟"
                className="rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white"
              >
                إضافة الإداري
              </ConfirmSubmitButton>
            </div>
          </form>

          <section className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black">إداريو الأونلاين</h2>
                <p className="mt-2 text-sm text-[#173d42]/60">تعديل البيانات والصلاحيات من هنا مباشرة.</p>
              </div>
              <span className="rounded-full bg-[#fffaf2] px-4 py-2 text-sm font-black text-[#8a6335]">
                {admins.length} حساب
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {admins.map((admin) => (
                <article key={admin.id} className="rounded-2xl border border-[#eadcc6] bg-[#fffaf2]/40 p-4">
                  <form action={updateRemoteAdmin} className="grid gap-3">
                    <input type="hidden" name="adminId" value={admin.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1 text-xs font-black text-[#173d42]/60">
                        الاسم
                        <input name="fullName" defaultValue={admin.fullName} className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm text-[#173d42]" />
                      </label>
                      <label className="grid gap-1 text-xs font-black text-[#173d42]/60">
                        البريد
                        <input name="email" type="email" defaultValue={admin.email} className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm text-[#173d42]" />
                      </label>
                      <label className="grid gap-1 text-xs font-black text-[#173d42]/60">
                        كلمة مرور جديدة اختيارية
                        <input name="password" placeholder="اتركها فارغة إن لم ترد تغييرها" className="rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 text-sm text-[#173d42]" />
                      </label>
                      <p className="rounded-xl bg-white px-3 py-2 text-xs leading-6 text-[#173d42]/60">
                        أضيف في: {admin.createdAt.toISOString().slice(0, 10)}
                        {admin.id === currentAdmin.id ? " - حسابك الحالي" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black">
                        <input name="canAccessFinance" type="checkbox" defaultChecked={admin.canAccessFinance} />
                        صلاحية الحسابات المالية
                      </label>
                      <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black">
                        <input name="isActive" type="checkbox" defaultChecked={admin.isActive} disabled={admin.id === currentAdmin.id} />
                        الحساب مفعّل
                      </label>
                      {admin.id === currentAdmin.id ? <input type="hidden" name="isActive" value="true" /> : null}
                      <span className={`rounded-full px-4 py-2 text-xs font-black ${admin.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                        {admin.isActive ? "مفعّل" : "معطّل"}
                      </span>
                      <span className={`rounded-full px-4 py-2 text-xs font-black ${admin.canAccessFinance ? "bg-[#173d42] text-white" : "bg-stone-100 text-stone-600"}`}>
                        {admin.canAccessFinance ? "يرى المالية" : "لا يرى المالية"}
                      </span>
                    </div>
                    <ConfirmSubmitButton
                      confirmMessage="هل تريد حفظ تعديل بيانات وصلاحيات هذا الإداري؟"
                      className="w-fit rounded-xl bg-[#1f6358] px-5 py-2 text-xs font-black text-white"
                    >
                      حفظ التعديلات
                    </ConfirmSubmitButton>
                  </form>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
