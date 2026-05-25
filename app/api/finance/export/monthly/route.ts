import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const defaultCurrency = "USD";

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeMonthKey(value: unknown) {
  const monthKey = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : getCurrentMonthKey();
}

function getMonthRange(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return getMonthRange(getCurrentMonthKey());
  }

  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
  };
}

function getMonthDateKeys(monthKey: string) {
  const { start, end } = getMonthRange(monthKey);
  const todayKey = new Date().toISOString().slice(0, 10);
  const dateKeys: string[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    if (dateKey > todayKey) break;
    dateKeys.push(dateKey);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dateKeys;
}

function safeSheetName(name: string) {
  return name.slice(0, 31);
}

function expenseRecurrenceLabel(value: string) {
  if (value === "MONTHLY") return "شهري";
  if (value === "YEARLY") return "سنوي";
  return "مرة واحدة";
}

function isRecurringExpenseTemplate(expense: { recurrence: string; isActive: boolean }) {
  return expense.isActive && expense.recurrence !== "ONE_TIME";
}

function daysInUtcMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function expenseDueDateForMonth(expense: {
  recurrence: string;
  expenseDate: Date;
  nextDueDate: Date | null;
  dueDay: number | null;
}, monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const baseDate = expense.nextDueDate || expense.expenseDate;

  if (expense.recurrence === "MONTHLY") {
    const day = Math.min(Math.max(expense.dueDay || baseDate.getUTCDate() || 1, 1), daysInUtcMonth(year, month));
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  }

  if (expense.recurrence === "YEARLY") {
    const dueMonth = baseDate.getUTCMonth() + 1;
    if (dueMonth !== month) return null;
    const day = Math.min(baseDate.getUTCDate(), daysInUtcMonth(year, month));
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  }

  const expenseMonthKey = expense.expenseDate.toISOString().slice(0, 7);
  return expenseMonthKey === monthKey ? expense.expenseDate : null;
}

function applySheetLayout(worksheet: XLSX.WorkSheet, rows: Record<string, unknown>[]) {
  const firstRow = rows[0];
  if (!firstRow) return;

  const headers = Object.keys(firstRow);
  worksheet["!cols"] = headers.map((header) => {
    const maxContentLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[header] ?? "").length)
    );

    return { wch: Math.min(Math.max(maxContentLength + 4, 14), 42) };
  });

  if (worksheet["!ref"]) {
    worksheet["!autofilter"] = { ref: worksheet["!ref"] };
  }
}

function appendJsonSheet(workbook: XLSX.WorkBook, name: string, rows: Record<string, unknown>[]) {
  const data = rows.length > 0 ? rows : [{ "ملاحظة": "لا توجد بيانات" }];
  const worksheet = XLSX.utils.json_to_sheet(data);
  applySheetLayout(worksheet, data);
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(name));
}

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
      fullName: true,
      email: true,
    },
  });
}

async function logFinanceAction(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.financeAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId || null,
      summary: input.summary,
      details: input.details || undefined,
    },
  });
}

export async function GET(request: NextRequest) {
  const admin = await requireFinanceAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const monthKey = normalizeMonthKey(request.nextUrl.searchParams.get("month"));
  const monthRange = getMonthRange(monthKey);
  const monthDateKeys = getMonthDateKeys(monthKey);
  const monthStartKey = monthDateKeys[0] || `${monthKey}-01`;
  const monthEndKey = monthDateKeys[monthDateKeys.length - 1] || `${monthKey}-31`;

  const [students, expenses, teachers, allTeacherPayouts, auditLogs] = await Promise.all([
    prisma.student.findMany({
      where: { isActive: true, studyMode: "REMOTE" },
      orderBy: { fullName: "asc" },
      include: {
        teacher: { select: { fullName: true } },
        circle: { select: { name: true, track: true } },
        financeAccount: true,
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    }),
    prisma.platformExpense.findMany({
      orderBy: { expenseDate: "desc" },
    }),
    prisma.user.findMany({
      where: {
        role: "TEACHER",
        studyMode: "REMOTE",
        isActive: true,
      },
      orderBy: { fullName: "asc" },
      include: {
        circles: {
          where: { studyMode: "REMOTE" },
          select: { name: true, track: true },
        },
        compensationRule: true,
        teacherPayouts: {
          where: { periodMonth: monthKey },
          orderBy: { paidAt: "desc" },
        },
        teacherAttendances: {
          where: {
            dateKey: {
              gte: monthStartKey,
              lte: monthEndKey,
            },
          },
          orderBy: { dateKey: "asc" },
        },
        reports: {
          where: {
            createdAt: {
              gte: monthRange.start,
              lt: monthRange.end,
            },
            student: {
              studyMode: "REMOTE",
            },
          },
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.teacherPayout.findMany({
      orderBy: { paidAt: "desc" },
    }),
    prisma.financeAuditLog.findMany({
      where: {
        createdAt: {
          gte: monthRange.start,
          lt: monthRange.end,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { fullName: true, email: true } },
      },
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
      "اسم الطالب": student.fullName,
      "الحلقة": student.circle?.name || "",
      "المسار": student.circle?.track || "",
      "المعلم": student.teacher.fullName,
      "الرسوم": total,
      "الخصم": discount,
      "المطلوب": required,
      "المدفوع": paid,
      "المتبقي": remaining,
      "العملة": currency,
      "ملاحظات مالية": student.financeAccount?.notes || "",
    };
  });

  const studentPaymentRows = students.flatMap((student) =>
    student.payments
      .filter((payment) => payment.paidAt >= monthRange.start && payment.paidAt < monthRange.end)
      .map((payment) => ({
        "اسم الطالب": student.fullName,
        "التاريخ": payment.paidAt.toISOString().slice(0, 10),
        "المبلغ": toNumber(payment.amount),
        "العملة": payment.currency,
        "طريقة الدفع": payment.method || "",
        "ملاحظة": payment.note || "",
      }))
  );

  const paidPlatformExpenses = expenses.filter((expense) => !isRecurringExpenseTemplate(expense));
  const monthlyPlatformExpenses = paidPlatformExpenses.filter(
    (expense) => expense.expenseDate >= monthRange.start && expense.expenseDate < monthRange.end
  );
  const expenseRows = monthlyPlatformExpenses.map((expense) => ({
    "العنوان": expense.title,
    "التصنيف": expense.category,
    "التاريخ": expense.expenseDate.toISOString().slice(0, 10),
    "المبلغ": toNumber(expense.amount),
    "العملة": expense.currency,
    "طريقة الدفع": expense.paymentMethod || "",
    "رابط الإيصال": expense.receiptUrl || "",
    "ملاحظة": expense.note || "",
  }));
  const expenseObligationRows = expenses
    .filter((expense) => expense.isActive)
    .map((expense) => {
      const dueDate = expenseDueDateForMonth(expense, monthKey);
      return dueDate
        ? {
            "العنوان": expense.title,
            "التصنيف": expense.category,
            "نوع التكرار": expenseRecurrenceLabel(expense.recurrence),
            "تاريخ الاستحقاق": dueDate.toISOString().slice(0, 10),
            "المبلغ": toNumber(expense.amount),
            "العملة": expense.currency,
            "طريقة الدفع": expense.paymentMethod || "",
            "ملاحظة": expense.note || "",
          }
        : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const teacherRows = teachers.map((teacher) => {
    const monthlyAmount = toNumber(teacher.compensationRule?.monthlyAmount);
    const expectedMonthlyWorkDays = toNumber(teacher.compensationRule?.expectedMonthlyWorkDays) || 20;
    const paid = teacher.teacherPayouts.reduce((sum, payout) => sum + toNumber(payout.amount), 0);
    const reportDateSet = new Set(teacher.reports.map((report) => report.createdAt.toISOString().slice(0, 10)));
    const attendanceByDate = new Map(teacher.teacherAttendances.map((attendance) => [attendance.dateKey, attendance]));
    const presentDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "PRESENT").length;
    const excusedDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "EXCUSED").length;
    const absentDays = teacher.teacherAttendances.filter((attendance) => attendance.status === "ABSENT").length;
    const suggestedDays = monthDateKeys.filter((dateKey) => reportDateSet.has(dateKey) && !attendanceByDate.has(dateKey)).length;
    const payableDays = presentDays + excusedDays;
    const workRatio = expectedMonthlyWorkDays > 0 ? Math.min(payableDays / expectedMonthlyWorkDays, 1) : 0;
    const estimatedDue = monthlyAmount * workRatio;
    const remaining = Math.max(estimatedDue - paid, 0);
    const currency = teacher.compensationRule?.currency || teacher.teacherPayouts[0]?.currency || defaultCurrency;

    return {
      "اسم المعلم": teacher.fullName,
      "الحلقات": teacher.circles.map((circle) => circle.name).join(", "),
      "المكافأة الشهرية": monthlyAmount,
      "أيام العمل المتوقعة": expectedMonthlyWorkDays,
      "أيام الحضور": presentDays,
      "أيام العذر": excusedDays,
      "أيام الغياب": absentDays,
      "أيام مقترحة غير معتمدة": suggestedDays,
      "أيام قابلة للدفع": payableDays,
      "نسبة العمل": `${Math.round(workRatio * 100)}%`,
      "المستحق": estimatedDue,
      "المدفوع": paid,
      "المتبقي": remaining,
      "العملة": currency,
      "ملاحظات": teacher.compensationRule?.notes || "",
    };
  });

  const teacherPayoutRows = teachers.flatMap((teacher) =>
    teacher.teacherPayouts.map((payout) => ({
      "اسم المعلم": teacher.fullName,
      "الشهر": payout.periodMonth,
      "التاريخ": payout.paidAt.toISOString().slice(0, 10),
      "المبلغ": toNumber(payout.amount),
      "العملة": payout.currency,
      "طريقة الدفع": payout.method || "",
      "ملاحظة": payout.note || "",
    }))
  );

  const expectedIncome = studentRows.reduce((sum, row) => sum + Number(row["المطلوب"]), 0);
  const receivedIncome = studentRows.reduce((sum, row) => sum + Number(row["المدفوع"]), 0);
  const monthlyReceivedIncome = studentPaymentRows.reduce((sum, row) => sum + Number(row["المبلغ"]), 0);
  const remainingIncome = studentRows.reduce((sum, row) => sum + Number(row["المتبقي"]), 0);
  const platformExpensesTotal = expenseRows.reduce((sum, row) => sum + Number(row["المبلغ"]), 0);
  const allPlatformExpensesTotal = paidPlatformExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const teacherPayoutsTotal = teacherPayoutRows.reduce((sum, row) => sum + Number(row["المبلغ"]), 0);
  const allTeacherPayoutsTotal = allTeacherPayouts.reduce((sum, payout) => sum + toNumber(payout.amount), 0);
  const teacherDueTotal = teacherRows.reduce((sum, row) => sum + Number(row["المستحق"]), 0);
  const teacherRemainingTotal = teacherRows.reduce((sum, row) => sum + Number(row["المتبقي"]), 0);
  const totalExpenses = platformExpensesTotal + teacherPayoutsTotal;
  const monthlyBalance = monthlyReceivedIncome - totalExpenses;
  const allExpensesTotal = allPlatformExpensesTotal + allTeacherPayoutsTotal;
  const currentBalance = receivedIncome - allExpensesTotal;

  const summaryRows = [
    { "النطاق": "بيانات التقرير", "البند": "الشهر", "القيمة": monthKey },
    { "النطاق": "بيانات التقرير", "البند": "تاريخ التصدير", "القيمة": new Date().toISOString().slice(0, 19).replace("T", " ") },
    { "النطاق": "بيانات التقرير", "البند": "صدر بواسطة", "القيمة": admin.fullName || admin.email },
    { "النطاق": "إحصاءات", "البند": "عدد الطلاب", "القيمة": students.length },
    { "النطاق": "إحصاءات", "البند": "عدد المعلمين", "القيمة": teachers.length },
    { "النطاق": "الشهر المختار", "البند": "دخل الشهر", "القيمة": monthlyReceivedIncome },
    { "النطاق": "الشهر المختار", "البند": "مصروفات المنصة المدفوعة", "القيمة": platformExpensesTotal },
    { "النطاق": "الشهر المختار", "البند": "مكافآت معلمين مدفوعة", "القيمة": teacherPayoutsTotal },
    { "النطاق": "الشهر المختار", "البند": "إجمالي مصروفات الشهر", "القيمة": totalExpenses },
    { "النطاق": "الشهر المختار", "البند": "رصيد الشهر", "القيمة": monthlyBalance },
    { "النطاق": "إجمالي عام", "البند": "الدخل المتوقع من الطلاب", "القيمة": expectedIncome },
    { "النطاق": "إجمالي عام", "البند": "الدخل الفعلي", "القيمة": receivedIncome },
    { "النطاق": "إجمالي عام", "البند": "المتبقي على الطلاب", "القيمة": remainingIncome },
    { "النطاق": "إجمالي عام", "البند": "كل مصروفات المنصة المدفوعة", "القيمة": allPlatformExpensesTotal },
    { "النطاق": "إجمالي عام", "البند": "كل مكافآت المعلمين المدفوعة", "القيمة": allTeacherPayoutsTotal },
    { "النطاق": "إجمالي عام", "البند": "إجمالي المصروفات المدفوعة", "القيمة": allExpensesTotal },
    { "النطاق": "إجمالي عام", "البند": "الرصيد الإجمالي العام", "القيمة": currentBalance },
    { "النطاق": "التزامات", "البند": "مستحقات المعلمين لهذا الشهر", "القيمة": teacherDueTotal },
    { "النطاق": "التزامات", "البند": "متبقي مكافآت المعلمين لهذا الشهر", "القيمة": teacherRemainingTotal },
    { "النطاق": "التزامات", "البند": "الرصيد العام بعد مستحقات المعلمين", "القيمة": currentBalance - teacherRemainingTotal },
  ];

  const auditRows = auditLogs.map((log) => ({
    "الوقت": log.createdAt.toISOString().slice(0, 19).replace("T", " "),
    "المستخدم": log.actor?.fullName || log.actor?.email || "غير معروف",
    "العملية": log.action,
    "النوع": log.entity,
    "الوصف": log.summary,
  }));

  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: `تقرير منصة الرحمة المالي - ${monthKey}`,
    Subject: "تقرير مالي شهري",
    Author: admin.fullName || admin.email || "منصة الرحمة",
    CreatedDate: new Date(),
  };
  workbook.Workbook = {
    Views: [{ RTL: true }],
  };
  const sheets = [
    ["الملخص", summaryRows],
    ["الطلاب", studentRows],
    ["دفعات الطلاب", studentPaymentRows],
    ["مصروفات الشهر", expenseRows],
    ["التزامات المنصة", expenseObligationRows],
    ["المعلمون", teacherRows],
    ["دفعات المعلمين", teacherPayoutRows],
    ["سجل العمليات", auditRows],
  ] as const;

  for (const [name, rows] of sheets) {
    appendJsonSheet(workbook, name, rows);
  }

  await logFinanceAction({
    actorId: admin.id,
    action: "EXPORT_MONTHLY_FINANCE_REPORT",
    entity: "FinanceExport",
    entityId: monthKey,
    summary: `تصدير تقرير مالي لشهر ${monthKey}`,
    details: {
      monthKey,
      students: students.length,
      teachers: teachers.length,
      expenses: monthlyPlatformExpenses.length,
      expenseObligations: expenseObligationRows.length,
      allPaidPlatformExpenses: paidPlatformExpenses.length,
      studentPayments: studentPaymentRows.length,
      teacherPayouts: teacherPayoutRows.length,
      allTeacherPayouts: allTeacherPayouts.length,
    },
  });

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const body = new Uint8Array(buffer);
  const fileName = `alrahma-finance-${monthKey}.xlsx`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
