import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const defaultCurrency = "USD";

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function parseAmount(value: FormDataEntryValue | null) {
  const amount = Number(String(value || "").replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return new Date();

  const date = new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatMoney(amount: number, currency = defaultCurrency) {
  return `${amount.toFixed(2)} ${currency}`;
}

function getPaymentStatus(required: number, paid: number) {
  if (required <= 0 && paid <= 0) return "لم تحدد الرسوم";
  if (paid <= 0) return "لم يدفع";
  if (paid + 0.001 >= required) return "مدفوع بالكامل";
  return "دفع جزئي";
}

async function requireFinanceAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      studyMode: true,
    },
  });
}

async function saveStudentFinanceAccount(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const studentId = String(formData.get("studentId") || "");
  const totalAmount = parseAmount(formData.get("totalAmount"));
  const discountAmount = parseAmount(formData.get("discountAmount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!studentId) return;

  await prisma.studentFinanceAccount.upsert({
    where: { studentId },
    create: {
      studentId,
      totalAmount,
      discountAmount,
      currency,
      notes,
    },
    update: {
      totalAmount,
      discountAmount,
      currency,
      notes,
    },
  });

  revalidatePath("/finance");
}

async function addStudentPayment(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const studentId = String(formData.get("studentId") || "");
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const method = String(formData.get("method") || "").trim() || null;
  const paidAt = parseDate(formData.get("paidAt"));
  const note = String(formData.get("note") || "").trim() || null;

  if (!studentId || amount <= 0) return;

  await prisma.studentPayment.create({
    data: {
      studentId,
      amount,
      currency,
      method,
      paidAt,
      note,
    },
  });

  revalidatePath("/finance");
}

async function addPlatformExpense(formData: FormData) {
  "use server";

  const admin = await requireFinanceAdmin();
  if (!admin) return;

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "").trim() || "عام";
  const amount = parseAmount(formData.get("amount"));
  const currency = String(formData.get("currency") || defaultCurrency).trim() || defaultCurrency;
  const expenseDate = parseDate(formData.get("expenseDate"));
  const paymentMethod = String(formData.get("paymentMethod") || "").trim() || null;
  const receiptUrl = String(formData.get("receiptUrl") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (!title || amount <= 0) return;

  await prisma.platformExpense.create({
    data: {
      title,
      category,
      amount,
      currency,
      expenseDate,
      paymentMethod,
      receiptUrl,
      note,
    },
  });

  revalidatePath("/finance");
}

export default async function FinancePage() {
  const admin = await requireFinanceAdmin();

  if (!admin) {
    return (
      <main className="min-h-screen bg-[#f6efe3] p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-white p-6 text-[#173d42] shadow-sm">
          <p className="text-lg font-black">هذه الصفحة مخصصة للإدارة فقط.</p>
          <p className="mt-2 text-sm text-[#173d42]/70">سجل الدخول بحساب إداري ثم عد إلى صفحة الحسابات المالية.</p>
          <Link href="/" className="mt-5 inline-flex rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white">
            العودة للرئيسية
          </Link>
        </div>
      </main>
    );
  }

  const [students, expenses] = await Promise.all([
    prisma.student.findMany({
      where: { isActive: true },
      orderBy: [{ studyMode: "asc" }, { fullName: "asc" }],
      include: {
        teacher: { select: { fullName: true } },
        circle: { select: { name: true, track: true } },
        financeAccount: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    }),
    prisma.platformExpense.findMany({
      orderBy: { expenseDate: "desc" },
      take: 20,
    }),
  ]);

  const studentRows = students.map((student) => {
    const total = toNumber(student.financeAccount?.totalAmount);
    const discount = toNumber(student.financeAccount?.discountAmount);
    const required = Math.max(total - discount, 0);
    const paid = student.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const remaining = Math.max(required - paid, 0);
    const currency = student.financeAccount?.currency || student.payments[0]?.currency || defaultCurrency;

    return {
      student,
      total,
      discount,
      required,
      paid,
      remaining,
      currency,
      status: getPaymentStatus(required, paid),
    };
  });

  const expectedIncome = studentRows.reduce((sum, row) => sum + row.required, 0);
  const receivedIncome = studentRows.reduce((sum, row) => sum + row.paid, 0);
  const remainingIncome = studentRows.reduce((sum, row) => sum + row.remaining, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const currentBalance = receivedIncome - totalExpenses;
  const projectedBalance = expectedIncome - totalExpenses;
  const today = new Date().toISOString().slice(0, 10);

  const cards = [
    { label: "الدخل المتوقع من الطلاب", value: expectedIncome, hint: "بعد الخصومات والمنح" },
    { label: "الدخل الفعلي", value: receivedIncome, hint: "المبالغ المسجلة كمدفوعة" },
    { label: "المتبقي على الطلاب", value: remainingIncome, hint: "رسوم لم يتم تحصيلها بعد" },
    { label: "المصروفات المسجلة", value: totalExpenses, hint: "آخر المصروفات المدخلة في النظام" },
    { label: "الرصيد الحالي", value: currentBalance, hint: "الدخل الفعلي ناقص المصروفات" },
    { label: "الرصيد المتوقع", value: projectedBalance, hint: "إذا تم تحصيل كل المتبقي" },
  ];

  return (
    <main className="min-h-screen bg-[#f6efe3] px-4 py-6 text-[#173d42]" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#102f34] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-16 top-6 h-52 w-52 rounded-full bg-[#c39a62]/25" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-white/8" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f1d39d]">
                الحسابات المالية
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                دخل المنصة، المصروفات، والرصيد في مكان واحد.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
                هذه الصفحة هي المرحلة الأولى من النظام المالي: نربط الطالب برسومه ودفعاته، ونسجل مصروفات المنصة، ثم نحسب الفائض أو العجز تلقائياً.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/remote/admin/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#173d42]">
                لوحة الأونلاين
              </Link>
              <Link href="/onsite/admin/dashboard" className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white">
                لوحة الحضوري
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.label} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-[#173d42]/55">{card.label}</p>
              <p className={`mt-3 text-3xl font-black ${card.value < 0 ? "text-red-700" : "text-[#173d42]"}`}>
                {formatMoney(card.value)}
              </p>
              <p className="mt-2 text-xs leading-6 text-[#173d42]/55">{card.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <form action={saveStudentFinanceAccount} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تحديد رسوم الطالب</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">ضع رسوم الفصل أو الخصم أو المنحة لكل طالب.</p>
            <select name="studentId" required className="mt-5 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold">
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} - {student.studyMode === "ONSITE" ? "حضوري" : "أونلاين"}
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input name="totalAmount" type="number" step="0.01" min="0" placeholder="الرسوم" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="discountAmount" type="number" step="0.01" min="0" placeholder="خصم/منحة" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <textarea name="notes" placeholder="ملاحظات مالية" className="mt-3 min-h-24 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#173d42] px-5 py-3 text-sm font-black text-white">
              حفظ رسوم الطالب
            </button>
          </form>

          <form action={addStudentPayment} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تسجيل دفعة طالب</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">كل دفعة تسجل هنا تزيد دخل المنصة الفعلي.</p>
            <select name="studentId" required className="mt-5 w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm font-bold">
              <option value="">اختر الطالب</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName} - {student.studyMode === "ONSITE" ? "حضوري" : "أونلاين"}
                </option>
              ))}
            </select>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input name="amount" type="number" step="0.01" min="0" required placeholder="المبلغ" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="paidAt" type="date" defaultValue={today} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <input name="method" placeholder="طريقة الدفع: نقدي، حوالة..." className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <textarea name="note" placeholder="ملاحظة الدفعة" className="mt-3 min-h-20 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white">
              إضافة الدفعة
            </button>
          </form>

          <form action={addPlatformExpense} className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">تسجيل مصروف</h2>
            <p className="mt-2 text-sm leading-6 text-[#173d42]/60">مثل Zoom، الإعلام، الأنشطة، أو أي مصروف إداري.</p>
            <input name="title" required placeholder="عنوان المصروف" className="mt-5 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input name="category" placeholder="التصنيف" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="amount" type="number" step="0.01" min="0" required placeholder="المبلغ" className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="currency" defaultValue={defaultCurrency} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
              <input name="expenseDate" type="date" defaultValue={today} className="rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            </div>
            <input name="paymentMethod" placeholder="طريقة الدفع" className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <input name="receiptUrl" placeholder="رابط إيصال إن وجد" className="mt-3 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <textarea name="note" placeholder="ملاحظة المصروف" className="mt-3 min-h-20 w-full rounded-2xl border border-[#d9c8ad] px-4 py-3 text-sm" />
            <button className="mt-3 w-full rounded-2xl bg-[#c39a62] px-5 py-3 text-sm font-black text-white">
              إضافة المصروف
            </button>
          </form>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-[#d9c8ad] bg-white shadow-sm">
            <div className="border-b border-[#eadcc6] p-5">
              <h2 className="text-xl font-black">حالة مدفوعات الطلاب</h2>
              <p className="mt-1 text-sm text-[#173d42]/60">الرسوم، المدفوع، والمتبقي لكل طالب.</p>
            </div>
            <div className="max-h-[620px] overflow-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="sticky top-0 bg-[#fffaf2] text-[#173d42]/65">
                  <tr>
                    <th className="p-4">الطالب</th>
                    <th className="p-4">القسم</th>
                    <th className="p-4">الحلقة</th>
                    <th className="p-4">المطلوب</th>
                    <th className="p-4">المدفوع</th>
                    <th className="p-4">المتبقي</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((row) => (
                    <tr key={row.student.id} className="border-t border-[#f0e3cf]">
                      <td className="p-4 font-black">{row.student.fullName}</td>
                      <td className="p-4">{row.student.studyMode === "ONSITE" ? "حضوري" : "أونلاين"}</td>
                      <td className="p-4">{row.student.circle?.name || "-"}</td>
                      <td className="p-4">{formatMoney(row.required, row.currency)}</td>
                      <td className="p-4 text-[#1f6358]">{formatMoney(row.paid, row.currency)}</td>
                      <td className="p-4 text-[#8a6335]">{formatMoney(row.remaining, row.currency)}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-[#f1d39d]/45 px-3 py-1 text-xs font-black">{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d9c8ad] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">آخر المصروفات</h2>
            <div className="mt-4 space-y-3">
              {expenses.length === 0 ? (
                <p className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#173d42]/60">لا توجد مصروفات مسجلة بعد.</p>
              ) : (
                expenses.map((expense) => (
                  <article key={expense.id} className="rounded-2xl border border-[#eadcc6] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{expense.title}</p>
                        <p className="mt-1 text-xs text-[#173d42]/55">
                          {expense.category} - {expense.expenseDate.toISOString().slice(0, 10)}
                        </p>
                      </div>
                      <p className="font-black text-red-700">{formatMoney(toNumber(expense.amount), expense.currency)}</p>
                    </div>
                    {expense.note ? <p className="mt-2 text-xs leading-6 text-[#173d42]/60">{expense.note}</p> : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
