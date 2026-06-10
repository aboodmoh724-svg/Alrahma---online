import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams?: Promise<{
    minuteId?: string;
  }>;
};

function parseLines(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function jsonList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInput(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(date: Date | null | undefined) {
  if (!date) return "غير محدد";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function buildWhatsAppText(input: {
  title: string;
  meetingType: string;
  location: string;
  meetingDate: Date | null;
  hijriDate: string;
  startTime: string;
  endTime: string;
  participants: string[];
  agendaItems: string[];
  decisions: string[];
  notes: string[];
  preparedBy: string;
  reviewedBy: string;
}) {
  const section = (title: string, items: string[]) =>
    items.length
      ? `\n${title}\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n`
      : "";

  return [
    "محضر اجتماع - التعليم عن بعد",
    "",
    `العنوان: ${input.title}`,
    `النوع: ${input.meetingType || "غير محدد"}`,
    `المكان: ${input.location || "غير محدد"}`,
    `التاريخ: ${formatDisplayDate(input.meetingDate)}${input.hijriDate ? ` - ${input.hijriDate}` : ""}`,
    `الوقت: ${input.startTime || "-"} إلى ${input.endTime || "-"}`,
    section("المشاركون:", input.participants),
    section("محاور الاجتماع:", input.agendaItems),
    section("القرارات والتوصيات:", input.decisions),
    section("ملاحظات:", input.notes),
    `معد المحضر: ${input.preparedBy || "-"}`,
    `مدقق المحضر: ${input.reviewedBy || "-"}`,
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

async function getCurrentRemoteAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;

  if (!userId) return null;

  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
      studyMode: "REMOTE",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

async function saveMeetingMinute(formData: FormData) {
  "use server";

  const admin = await getCurrentRemoteAdmin();
  if (!admin) return;

  const minuteId = String(formData.get("minuteId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const meetingType = String(formData.get("meetingType") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const meetingDate = parseOptionalDate(formData.get("meetingDate"));
  const hijriDate = String(formData.get("hijriDate") || "").trim();
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const preparedAt = parseOptionalDate(formData.get("preparedAt"));
  const preparedBy = String(formData.get("preparedBy") || "").trim();
  const reviewedBy = String(formData.get("reviewedBy") || "").trim();
  const participants = parseLines(formData.get("participants"));
  const agendaItems = parseLines(formData.get("agendaItems"));
  const decisions = parseLines(formData.get("decisions"));
  const notes = parseLines(formData.get("notes"));

  if (!title) return;

  const whatsappText = buildWhatsAppText({
    title,
    meetingType,
    location,
    meetingDate,
    hijriDate,
    startTime,
    endTime,
    participants,
    agendaItems,
    decisions,
    notes,
    preparedBy,
    reviewedBy,
  });

  const data = {
    studyMode: "REMOTE" as const,
    title,
    meetingType: meetingType || null,
    location: location || null,
    meetingDate,
    hijriDate: hijriDate || null,
    startTime: startTime || null,
    endTime: endTime || null,
    preparedAt,
    preparedBy: preparedBy || null,
    reviewedBy: reviewedBy || null,
    participants: participants as Prisma.InputJsonValue,
    agendaItems: agendaItems as Prisma.InputJsonValue,
    decisions: decisions as Prisma.InputJsonValue,
    notes: notes as Prisma.InputJsonValue,
    whatsappText,
    createdById: admin.id,
  };

  if (minuteId) {
    await prisma.meetingMinute.updateMany({
      where: {
        id: minuteId,
        studyMode: "REMOTE",
      },
      data,
    });
  } else {
    await prisma.meetingMinute.create({
      data,
    });
  }

  revalidatePath("/remote/admin/meeting-minutes");
  redirect("/remote/admin/meeting-minutes");
}

async function deleteMeetingMinute(formData: FormData) {
  "use server";

  const admin = await getCurrentRemoteAdmin();
  if (!admin) return;

  const minuteId = String(formData.get("minuteId") || "").trim();
  if (!minuteId) return;

  await prisma.meetingMinute.deleteMany({
    where: {
      id: minuteId,
      studyMode: "REMOTE",
    },
  });

  revalidatePath("/remote/admin/meeting-minutes");
  redirect("/remote/admin/meeting-minutes");
}

export default async function RemoteMeetingMinutesPage({ searchParams }: PageProps) {
  const admin = await getCurrentRemoteAdmin();
  if (!admin) redirect("/remote/admin/login");

  const params = await searchParams;
  const selectedMinuteId = params?.minuteId || "";

  const minutes = await prisma.meetingMinute.findMany({
    where: {
      studyMode: "REMOTE",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  const selectedMinute =
    minutes.find((minute) => minute.id === selectedMinuteId) || minutes[0] || null;
  const editMinute = selectedMinuteId
    ? minutes.find((minute) => minute.id === selectedMinuteId) || null
    : null;

  const formDefaults = {
    id: editMinute?.id || "",
    title: editMinute?.title || "",
    meetingType: editMinute?.meetingType || "فصلي",
    location: editMinute?.location || "عن طريق الزوم",
    meetingDate: formatDateInput(editMinute?.meetingDate),
    hijriDate: editMinute?.hijriDate || "",
    startTime: editMinute?.startTime || "",
    endTime: editMinute?.endTime || "",
    preparedAt: formatDateInput(editMinute?.preparedAt),
    preparedBy: editMinute?.preparedBy || admin.fullName,
    reviewedBy: editMinute?.reviewedBy || "",
    participants: jsonList(editMinute?.participants).join("\n"),
    agendaItems: jsonList(editMinute?.agendaItems).join("\n"),
    decisions: jsonList(editMinute?.decisions).join("\n"),
    notes: jsonList(editMinute?.notes).join("\n"),
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0a3f2a] p-6 text-white shadow-xl md:p-8">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#bd8f2d]/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black text-[#f2d18a]">
                محاضر الاجتماعات
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">
                محضر رسمي للتعليم عن بعد.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72">
                أنشئ محضر الاجتماع، راجعه بتصميم واضح، ثم استخدم نص الواتساب الجاهز للإرسال.
              </p>
            </div>
            <Link
              href="/remote/admin/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#0a3f2a] transition hover:bg-[#fffaf4]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[26rem_1fr]">
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83] xl:sticky xl:top-6 xl:self-start">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1c2d31]">
                  {editMinute ? "تعديل محضر" : "محضر جديد"}
                </h2>
                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                  اكتب كل عنصر في سطر مستقل داخل القوائم.
                </p>
              </div>
              {editMinute ? (
                <Link
                  href="/remote/admin/meeting-minutes"
                  className="rounded-xl bg-[#fffaf4] px-3 py-2 text-xs font-black text-[#0a3f2a] ring-1 ring-[#d8bf83]"
                >
                  جديد
                </Link>
              ) : null}
            </div>

            <form action={saveMeetingMinute} className="space-y-4">
              <input type="hidden" name="minuteId" value={formDefaults.id} />
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#1c2d31]">عنوان الاجتماع</span>
                <input
                  name="title"
                  defaultValue={formDefaults.title}
                  required
                  className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  placeholder="مثال: اجتماع كادر التعليم عن بعد"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">نوع الاجتماع</span>
                  <select
                    name="meetingType"
                    defaultValue={formDefaults.meetingType}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  >
                    <option value="دوري">دوري</option>
                    <option value="فصلي">فصلي</option>
                    <option value="سنوي">سنوي</option>
                    <option value="طارئ">طارئ</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">مكان الاجتماع</span>
                  <input
                    name="location"
                    defaultValue={formDefaults.location}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">التاريخ الميلادي</span>
                  <input
                    type="date"
                    name="meetingDate"
                    defaultValue={formDefaults.meetingDate}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">التاريخ الهجري</span>
                  <input
                    name="hijriDate"
                    defaultValue={formDefaults.hijriDate}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                    placeholder="مثال: 21 صفر 1445هـ"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">وقت البداية</span>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={formDefaults.startTime}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">وقت الانتهاء</span>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={formDefaults.endTime}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>
              </div>

              {[
                ["participants", "المشاركون", formDefaults.participants],
                ["agendaItems", "محاور الاجتماع", formDefaults.agendaItems],
                ["decisions", "القرارات والتوصيات", formDefaults.decisions],
                ["notes", "ملاحظات", formDefaults.notes],
              ].map(([name, label, value]) => (
                <label key={name} className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">{label}</span>
                  <textarea
                    name={name}
                    defaultValue={value}
                    rows={name === "decisions" ? 4 : 3}
                    className="resize-y rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-[#0f5a35]"
                  />
                </label>
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">معد المحضر</span>
                  <input
                    name="preparedBy"
                    defaultValue={formDefaults.preparedBy}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#1c2d31]">مدقق المحضر</span>
                  <input
                    name="reviewedBy"
                    defaultValue={formDefaults.reviewedBy}
                    className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-black text-[#1c2d31]">تاريخ إعداد المحضر</span>
                <input
                  type="date"
                  name="preparedAt"
                  defaultValue={formDefaults.preparedAt}
                  className="rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a]"
              >
                {editMinute ? "حفظ التعديل" : "حفظ المحضر"}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1c2d31]">المحاضر المحفوظة</h2>
                  <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                    آخر 50 محضر في التعليم عن بعد.
                  </p>
                </div>
                <span className="rounded-full bg-[#edf6ee] px-4 py-2 text-sm font-black text-[#0f5a35]">
                  {minutes.length} محضر
                </span>
              </div>

              {minutes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8bf83] p-8 text-center text-sm text-[#1c2d31]/55">
                  لا توجد محاضر محفوظة حتى الآن.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {minutes.map((minute) => (
                    <Link
                      key={minute.id}
                      href={`/remote/admin/meeting-minutes?minuteId=${minute.id}`}
                      className={`rounded-[1.4rem] p-4 ring-1 transition ${
                        selectedMinute?.id === minute.id
                          ? "bg-[#0a3f2a] text-white ring-[#0a3f2a]"
                          : "bg-[#fffaf4] text-[#1c2d31] ring-[#eadcc4] hover:bg-white"
                      }`}
                    >
                      <h3 className="font-black leading-7">{minute.title}</h3>
                      <p className="mt-2 text-xs font-bold opacity-70">
                        {minute.meetingType || "غير محدد"} - {formatDisplayDate(minute.meetingDate)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {selectedMinute ? (
              <>
                <article className="overflow-hidden rounded-[2.2rem] bg-[#fbf6ed] shadow-sm ring-1 ring-[#d8bf83]">
                  <div className="border-b border-[#d8bf83] bg-[#f8efe2] p-6 text-center">
                    <p className="text-sm font-black text-[#bd8f2d]">تحفيظ الرحمة للقرآن الكريم</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight text-[#1c2d31]">
                      محضر اجتماع
                    </h2>
                    <p className="mt-2 text-sm font-bold text-[#1c2d31]/60">
                      قسم التعليم عن بعد
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="rounded-[1.7rem] bg-[#0a3f2a] p-6 text-white">
                      <p className="text-sm font-black text-[#f2d18a]">عنوان الاجتماع</p>
                      <h3 className="mt-2 text-2xl font-black leading-10">
                        {selectedMinute.title}
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      {[
                        ["نوع الاجتماع", selectedMinute.meetingType || "-"],
                        ["مكان الاجتماع", selectedMinute.location || "-"],
                        ["التاريخ", `${formatDisplayDate(selectedMinute.meetingDate)}${selectedMinute.hijriDate ? ` - ${selectedMinute.hijriDate}` : ""}`],
                        ["الوقت", `${selectedMinute.startTime || "-"} إلى ${selectedMinute.endTime || "-"}`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-[#eadcc4]">
                          <p className="text-xs font-black text-[#1c2d31]/50">{label}</p>
                          <p className="mt-2 text-sm font-black leading-7 text-[#1c2d31]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                      <section className="rounded-[1.7rem] bg-white p-5 ring-1 ring-[#eadcc4]">
                        <h4 className="text-lg font-black text-[#1c2d31]">المشاركون</h4>
                        <div className="mt-4 grid gap-2">
                          {jsonList(selectedMinute.participants).length === 0 ? (
                            <p className="text-sm text-[#1c2d31]/55">لم يحدد</p>
                          ) : (
                            jsonList(selectedMinute.participants).map((name, index) => (
                              <div
                                key={`${name}-${index}`}
                                className="rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm font-black text-[#1c2d31] ring-1 ring-[#eadcc4]"
                              >
                                {index + 1}. {name}
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                      <section className="space-y-4">
                        {[
                          ["محاور الاجتماع", jsonList(selectedMinute.agendaItems)],
                          ["القرارات والتوصيات", jsonList(selectedMinute.decisions)],
                          ["ملاحظات", jsonList(selectedMinute.notes)],
                        ].map(([title, items]) => (
                          <div key={String(title)} className="rounded-[1.7rem] bg-white p-5 ring-1 ring-[#eadcc4]">
                            <h4 className="text-lg font-black text-[#1c2d31]">{String(title)}</h4>
                            {(items as string[]).length === 0 ? (
                              <p className="mt-3 text-sm text-[#1c2d31]/55">لا يوجد</p>
                            ) : (
                              <ol className="mt-3 space-y-2 text-sm font-bold leading-8 text-[#1c2d31]/75">
                                {(items as string[]).map((item, index) => (
                                  <li key={`${item}-${index}`}>
                                    <span className="font-black text-[#0a3f2a]">{index + 1}.</span> {item}
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        ))}
                      </section>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {[
                        ["تاريخ إعداد المحضر", formatDisplayDate(selectedMinute.preparedAt)],
                        ["معد المحضر", selectedMinute.preparedBy || "-"],
                        ["مدقق المحضر", selectedMinute.reviewedBy || "-"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-[#f8efe2] p-4 ring-1 ring-[#d8bf83]">
                          <p className="text-xs font-black text-[#1c2d31]/50">{label}</p>
                          <p className="mt-2 text-sm font-black text-[#1c2d31]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
                    <h3 className="text-xl font-black text-[#1c2d31]">نص واتساب جاهز</h3>
                    <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#fffaf4] p-4 text-sm font-bold leading-8 text-[#1c2d31] ring-1 ring-[#eadcc4]">
                      {selectedMinute.whatsappText || ""}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/remote/admin/meeting-minutes?minuteId=${selectedMinute.id}`}
                      className="rounded-2xl bg-[#0f5a35] px-5 py-3 text-center text-sm font-black text-white"
                    >
                      تعديل هذا المحضر
                    </Link>
                    <form action={deleteMeetingMinute}>
                      <input type="hidden" name="minuteId" value={selectedMinute.id} />
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700 ring-1 ring-red-200"
                      >
                        حذف المحضر
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
