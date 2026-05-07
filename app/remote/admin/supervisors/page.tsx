import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { hashPassword } from "@/lib/passwords";

async function requireFinanceAdmin() {
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
    },
  });
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase();
}

function checkboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

async function createSupervisor(formData: FormData) {
  "use server";

  const currentAdmin = await requireFinanceAdmin();
  if (!currentAdmin) return;

  const fullName = String(formData.get("fullName") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const canAccessSupervision = checkboxValue(formData.get("canAccessSupervision"));
  const canAccessFinance = checkboxValue(formData.get("canAccessFinance"));

  if (!fullName || !email || !password) return;

  await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashPassword(password),
      whatsapp: whatsapp || null,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
      canAccessSupervision,
      canAccessFinance,
    },
  });

  revalidatePath("/remote/admin/supervisors");
}

async function updateSupervisor(formData: FormData) {
  "use server";

  const currentAdmin = await requireFinanceAdmin();
  if (!currentAdmin) return;

  const adminId = String(formData.get("adminId") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const canAccessSupervision = checkboxValue(formData.get("canAccessSupervision"));
  const canAccessFinance = checkboxValue(formData.get("canAccessFinance"));
  const isActive = checkboxValue(formData.get("isActive"));

  if (!adminId || !fullName || !email) return;

  await prisma.user.update({
    where: {
      id: adminId,
    },
    data: {
      fullName,
      email,
      whatsapp: whatsapp || null,
      ...(password ? { password: hashPassword(password) } : {}),
      canAccessSupervision,
      canAccessFinance,
      isActive,
    },
  });

  revalidatePath("/remote/admin/supervisors");
}

async function deleteSupervisor(formData: FormData) {
  "use server";

  const currentAdmin = await requireFinanceAdmin();
  if (!currentAdmin) return;

  const adminId = String(formData.get("adminId") || "").trim();
  if (!adminId || adminId === currentAdmin.id) return;

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

  await prisma.user.delete({
    where: {
      id: targetAdmin.id,
    },
  });

  revalidatePath("/remote/admin/supervisors");
  revalidatePath("/remote/admin/admins");
}

export default async function RemoteAdminSupervisorsPage() {
  const currentAdmin = await requireFinanceAdmin();

  if (!currentAdmin) {
    return (
      <main className="min-h-screen bg-[#f6efe3] p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-white p-6 text-[#0a3f2a] shadow-sm">
          <p className="text-lg font-black">هذه الصفحة مخصصة للإدارة العليا فقط.</p>
          <Link href="/remote/admin/login" className="mt-5 inline-flex rounded-2xl bg-[#0a3f2a] px-5 py-3 text-sm font-black text-white">
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const supervisors = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      studyMode: "REMOTE",
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      whatsapp: true,
      isActive: true,
      canAccessFinance: true,
      canAccessSupervision: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#f6efe3] px-4 py-6 text-[#0a3f2a]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#102f34] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-[#bd8f2d]/20" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                المشرفون والصلاحيات
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                افصل الإدارة عن الإشراف وحدد من يملك كل صلاحية.
              </h1>
            </div>
            <Link href="/remote/admin/dashboard" className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#0a3f2a]">
              الرجوع إلى الإدارة
            </Link>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.6fr]">
          <form action={createSupervisor} className="rounded-[2rem] border border-[#d8bf83] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">إضافة مشرف أو إداري</h2>
            <div className="mt-5 grid gap-3">
              <input name="fullName" required placeholder="الاسم" className="rounded-2xl border border-[#d8bf83] px-4 py-3 text-sm" />
              <input name="email" type="email" required placeholder="البريد الإلكتروني" className="rounded-2xl border border-[#d8bf83] px-4 py-3 text-sm" />
              <input name="whatsapp" dir="ltr" placeholder={"رقم واتساب التنبيهات مثل +905xxxxxxxxx"} className="rounded-2xl border border-[#d8bf83] px-4 py-3 text-left text-sm" />
              <input name="password" required placeholder="كلمة المرور" className="rounded-2xl border border-[#d8bf83] px-4 py-3 text-sm" />
              <label className="flex items-center gap-3 rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-black">
                <input name="canAccessSupervision" type="checkbox" defaultChecked className="h-4 w-4" />
                صلاحية الإشراف
              </label>
              <label className="flex items-center gap-3 rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-black">
                <input name="canAccessFinance" type="checkbox" className="h-4 w-4" />
                صلاحية المالية
              </label>
              <ConfirmSubmitButton confirmMessage="هل تريد إضافة هذا الحساب؟" className="rounded-2xl bg-[#0a3f2a] px-5 py-3 text-sm font-black text-white">
                حفظ الحساب
              </ConfirmSubmitButton>
            </div>
          </form>

          <section className="rounded-[2rem] border border-[#d8bf83] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">الحسابات الحالية</h2>
              <span className="rounded-full bg-[#fffaf4] px-4 py-2 text-sm font-black text-[#8a661f]">
                {supervisors.length} حساب
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {supervisors.map((admin) => (
                <article key={admin.id} className="rounded-2xl border border-[#e7d7b4] bg-[#fffaf4]/40 p-4">
                  <form action={updateSupervisor} className="grid gap-3">
                    <input type="hidden" name="adminId" value={admin.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="fullName" defaultValue={admin.fullName} className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 text-sm" />
                      <input name="email" type="email" defaultValue={admin.email} className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 text-sm" />
                      <input name="whatsapp" dir="ltr" defaultValue={admin.whatsapp || ""} placeholder={"رقم واتساب التنبيهات +905xxxxxxxxx"} className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 text-left text-sm" />
                      <input name="password" placeholder="كلمة مرور جديدة اختيارية" className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 text-sm md:col-span-2" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black">
                        <input name="canAccessSupervision" type="checkbox" defaultChecked={admin.canAccessSupervision} />
                        الإشراف
                      </label>
                      <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black">
                        <input name="canAccessFinance" type="checkbox" defaultChecked={admin.canAccessFinance} />
                        المالية
                      </label>
                      <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black">
                        <input name="isActive" type="checkbox" defaultChecked={admin.isActive} />
                        الحساب مفعل
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ConfirmSubmitButton confirmMessage="هل تريد حفظ الصلاحيات الجديدة لهذا الحساب؟" className="w-fit rounded-xl bg-[#0f5a35] px-5 py-2 text-xs font-black text-white">
                        حفظ التعديلات
                      </ConfirmSubmitButton>
                      <ConfirmSubmitButton
                        formAction={deleteSupervisor}
                        disabled={admin.id === currentAdmin.id}
                        confirmMessage="هل تريد حذف هذا الحساب نهائيا؟"
                        className="w-fit rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        حذف الحساب
                      </ConfirmSubmitButton>
                    </div>
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
