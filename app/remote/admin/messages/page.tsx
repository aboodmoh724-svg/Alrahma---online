"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TemplateItem = {
  key: string;
  title: string;
  description: string;
  variables: string[];
  defaultBody: string;
  body: string;
};

type ReminderSettings = {
  enabled: boolean;
  time: string;
  timezone: string;
  lastTriggeredOn: string | null;
};

type AutomationRule = {
  key: string;
  title: string;
  trigger: string;
  recipient: string;
  channel: "WHATSAPP" | "IN_APP";
  location: string;
  templateKey?: string;
  enabled: boolean;
  notes?: string;
};

type CustomAutomationRule = {
  id: string;
  title: string;
  trigger: string;
  recipient: string;
  channel: "WHATSAPP" | "IN_APP";
  enabled: boolean;
  notes: string;
};

type AutomationSettings = {
  systemRules: AutomationRule[];
  customRules: CustomAutomationRule[];
};

export default function RemoteAdminMessagesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [notePresets, setNotePresets] = useState<string[]>([]);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    systemRules: [],
    customRules: [],
  });
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    time: "18:00",
    timezone: "Europe/Istanbul",
    lastTriggeredOn: null,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingNotePresets, setSavingNotePresets] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/message-settings", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر تحميل إعدادات الرسائل");
      }

      setTemplates(data.templates || []);
      setReminderSettings(data.reminderSettings);
      setNotePresets(Array.isArray(data.notePresets) ? data.notePresets : []);
      setAutomationSettings(
        data.automationSettings || {
          systemRules: [],
          customRules: [],
        }
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "تعذر تحميل إعدادات الرسائل"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateTemplateBody = (key: string, body: string) => {
    setTemplates((current) =>
      current.map((template) =>
        template.key === key
          ? {
              ...template,
              body,
            }
          : template
      )
    );
  };

  const saveTemplate = async (template: TemplateItem) => {
    try {
      setSavingKey(template.key);
      setFeedback(null);

      const response = await fetch("/api/admin/message-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateKey: template.key,
          body: template.body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حفظ القالب");
      }

      await loadSettings();
      setFeedback(`تم حفظ قالب: ${template.title}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "تعذر حفظ القالب");
    } finally {
      setSavingKey(null);
    }
  };

  const restoreDefault = async (template: TemplateItem) => {
    updateTemplateBody(template.key, template.defaultBody);
    await saveTemplate({ ...template, body: template.defaultBody });
  };

  const deleteSavedTemplate = async (template: TemplateItem) => {
    const confirmed = window.confirm(`هل تريد حذف النص المحفوظ لقالب: ${template.title}؟ سيعود القالب إلى النص الافتراضي.`);
    if (!confirmed) return;

    try {
      setDeletingKey(template.key);
      setFeedback(null);

      const response = await fetch("/api/admin/message-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleteTemplateKey: template.key,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حذف النص المحفوظ");
      }

      await loadSettings();
      setFeedback(`تم حذف النص المحفوظ لقالب: ${template.title}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "تعذر حذف النص المحفوظ");
    } finally {
      setDeletingKey(null);
    }
  };

  const saveReminderSettings = async () => {
    try {
      setSavingReminder(true);
      setFeedback(null);

      const response = await fetch("/api/admin/message-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reminderSettings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حفظ إعدادات التذكير");
      }

      await loadSettings();
      setFeedback("تم حفظ إعدادات التذكير التلقائي.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "تعذر حفظ إعدادات التذكير"
      );
    } finally {
      setSavingReminder(false);
    }
  };

  const updateSystemAutomation = (key: string, enabled: boolean) => {
    setAutomationSettings((current) => ({
      ...current,
      systemRules: current.systemRules.map((rule) =>
        rule.key === key ? { ...rule, enabled } : rule
      ),
    }));

    if (key === "TEACHER_MISSING_REPORT_REMINDER_WHATSAPP") {
      setReminderSettings((current) => ({
        ...current,
        enabled,
      }));
    }
  };

  const updateCustomAutomation = (
    id: string,
    field: keyof CustomAutomationRule,
    value: string | boolean
  ) => {
    setAutomationSettings((current) => ({
      ...current,
      customRules: current.customRules.map((rule) =>
        rule.id === id ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const addCustomAutomation = () => {
    setAutomationSettings((current) => ({
      ...current,
      customRules: [
        ...current.customRules,
        {
          id: `custom-${Date.now()}`,
          title: "",
          trigger: "",
          recipient: "",
          channel: "WHATSAPP",
          enabled: true,
          notes: "",
        },
      ],
    }));
  };

  const removeCustomAutomation = (id: string) => {
    setAutomationSettings((current) => ({
      ...current,
      customRules: current.customRules.filter((rule) => rule.id !== id),
    }));
  };

  const saveAutomationSettings = async () => {
    try {
      setSavingAutomation(true);
      setFeedback(null);

      const response = await fetch("/api/admin/message-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          automationSettings: {
            overrides: Object.fromEntries(
              automationSettings.systemRules.map((rule) => [rule.key, rule.enabled])
            ),
            customRules: automationSettings.customRules,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حفظ إعدادات الرسائل التلقائية");
      }

      await loadSettings();
      setFeedback("تم حفظ إعدادات الرسائل التلقائية.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "تعذر حفظ إعدادات الرسائل التلقائية");
    } finally {
      setSavingAutomation(false);
    }
  };

  const updateNotePreset = (index: number, value: string) => {
    setNotePresets((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  };

  const addNotePreset = () => {
    setNotePresets((current) => [...current, ""]);
  };

  const removeNotePreset = (index: number) => {
    setNotePresets((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveNotePresets = async () => {
    try {
      setSavingNotePresets(true);
      setFeedback(null);

      const response = await fetch("/api/admin/message-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notePresets,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذر حفظ الملاحظات الجاهزة");
      }

      await loadSettings();
      setFeedback("تم حفظ الملاحظات الجاهزة لتقارير الأونلاين.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "تعذر حفظ الملاحظات الجاهزة");
    } finally {
      setSavingNotePresets(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">إدارة الرسائل</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">
              قوالب الرسائل والتذكير التلقائي
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              من هنا تستطيع تعديل قالب رسالة المعلم، وقالب التقرير، ورسائل التسجيل،
              وتحديد وقت التذكير التلقائي للمعلمين إذا لم تكتمل تقاريرهم.
            </p>
          </div>
          <Link
            href="/remote/admin/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإدارة
          </Link>
        </div>

        {feedback ? (
          <div className="rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#1c2d31] ring-1 ring-[#d9c8ad]">
            {feedback}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/70 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل إعدادات الرسائل...
          </div>
        ) : (
          <>
            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1c2d31]">
                    سجل الرسائل والتنبيهات التلقائية
                  </h2>
                  <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                    هذه الخانات توضح متى يرسل النظام تلقائيا، ولمن، ومن أي موضع. إغلاق أي خانة يوقف الإرسال الآلي المرتبط بها.
                  </p>
                  <p className="mt-2 rounded-2xl bg-[#fffaf2] px-4 py-3 text-xs font-bold leading-6 text-[#8a6335] ring-1 ring-[#eadcc6]">
                    تنبيه مهم: الخانات النظامية فقط مرتبطة فعليًا بإرسال تلقائي داخل الكود. أما الخانات التي تضيفها الإدارة هنا فهي للتوثيق والمتابعة والتخطيط، ولا ترسل تلقائيًا حتى يتم ربطها بحدث واضح داخل النظام.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addCustomAutomation}
                    className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#1c2d31] transition hover:bg-[#fffaf2]"
                  >
                    إضافة خانة
                  </button>
                  <button
                    type="button"
                    onClick={saveAutomationSettings}
                    disabled={savingAutomation}
                    className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                  >
                    {savingAutomation ? "جارٍ الحفظ..." : "حفظ التفعيل"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {automationSettings.systemRules.map((rule) => (
                  <article
                    key={rule.key}
                    className="rounded-[1.5rem] bg-[#fffaf2] p-4 ring-1 ring-[#eadcc6]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[#173d42]">{rule.title}</h3>
                        <p className="mt-1 text-xs font-bold text-[#8a6335]">
                          {rule.channel === "WHATSAPP" ? "واتساب" : "تنبيه داخل اللوحة"} - {rule.location}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-[#1c2d31] ring-1 ring-[#d9c8ad]">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(event) => updateSystemAutomation(rule.key, event.target.checked)}
                          className="h-4 w-4 accent-[#1f6358]"
                        />
                        {rule.enabled ? "مفعل" : "مغلق"}
                      </label>
                    </div>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-[#1c2d31]/72">
                      <p><span className="font-black text-[#1c2d31]">متى: </span>{rule.trigger}</p>
                      <p><span className="font-black text-[#1c2d31]">لمن: </span>{rule.recipient}</p>
                      {rule.templateKey ? (
                        <p><span className="font-black text-[#1c2d31]">القالب: </span>{rule.templateKey}</p>
                      ) : null}
                      {rule.notes ? <p className="text-[#8a6335]">{rule.notes}</p> : null}
                    </div>
                  </article>
                ))}
              </div>

              {automationSettings.customRules.length > 0 ? (
                <div className="mt-5 space-y-3">
                  <h3 className="text-lg font-black text-[#1c2d31]">خانات مضافة من الإدارة</h3>
                  <p className="text-sm leading-7 text-[#1c2d31]/60">
                    حفظ هذه الخانات يجعلها ظاهرة في السجل فقط. لكي تصبح رسالة تلقائية فعليًا يجب تحويلها إلى قاعدة نظامية مبرمجة تحدد الحدث، والمستلم، والقالب، ووقت الإرسال.
                  </p>
                  {automationSettings.customRules.map((rule) => (
                    <div key={rule.id} className="rounded-[1.5rem] bg-[#f4fbf8] p-4 ring-1 ring-[#cfe3d9]">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={rule.title}
                          onChange={(event) => updateCustomAutomation(rule.id, "title", event.target.value)}
                          placeholder="اسم الرسالة أو التنبيه"
                          className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                        />
                        <input
                          value={rule.recipient}
                          onChange={(event) => updateCustomAutomation(rule.id, "recipient", event.target.value)}
                          placeholder="لمن ترسل"
                          className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                        />
                        <input
                          value={rule.trigger}
                          onChange={(event) => updateCustomAutomation(rule.id, "trigger", event.target.value)}
                          placeholder="متى ترسل"
                          className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                        />
                        <select
                          value={rule.channel}
                          onChange={(event) => updateCustomAutomation(rule.id, "channel", event.target.value)}
                          className="rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                        >
                          <option value="WHATSAPP">واتساب</option>
                          <option value="IN_APP">تنبيه داخل اللوحة</option>
                        </select>
                        <textarea
                          value={rule.notes}
                          onChange={(event) => updateCustomAutomation(rule.id, "notes", event.target.value)}
                          placeholder="ملاحظات أو تفاصيل إضافية"
                          className="min-h-24 rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none md:col-span-2"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm font-black text-[#1c2d31]">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(event) => updateCustomAutomation(rule.id, "enabled", event.target.checked)}
                            className="h-4 w-4 accent-[#1f6358]"
                          />
                          مفعل
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCustomAutomation(rule.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="mb-4">
                <h2 className="text-xl font-black text-[#1c2d31]">
                  التذكير التلقائي للمعلمين
                </h2>
                <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                  سيفحص النظام تلقائيًا بعد الوقت المحدد المعلمين الذين لم تكتمل تقاريرهم
                  اليومية، ثم يرسل لهم رسالة تذكير على واتساب.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31]">
                  <span className="mb-3 block">تفعيل التذكير</span>
                  <input
                    type="checkbox"
                    checked={reminderSettings.enabled}
                    onChange={(event) =>
                      setReminderSettings((current) => ({
                        ...current,
                        enabled: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-[#1f6358]"
                  />
                </label>

                <label className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31]">
                  <span className="mb-3 block">وقت الإرسال</span>
                  <input
                    type="time"
                    value={reminderSettings.time}
                    onChange={(event) =>
                      setReminderSettings((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#d9c8ad] bg-white px-3 py-2 outline-none focus:border-[#1f6358]"
                  />
                </label>

                <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm font-black text-[#1c2d31]">
                  <span className="mb-3 block">آخر تشغيل</span>
                  <p className="font-bold text-[#1c2d31]/70">
                    {reminderSettings.lastTriggeredOn || "لم يعمل بعد"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={saveReminderSettings}
                disabled={savingReminder}
                className="mt-4 rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
              >
                {savingReminder ? "جارٍ حفظ الإعدادات..." : "حفظ إعدادات التذكير"}
              </button>
            </section>

            <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#1c2d31]">
                    الملاحظات الجاهزة لتقارير الأونلاين
                  </h2>
                  <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                    هذه القائمة تظهر للمعلم داخل نموذج التقرير. يمكنك تعديل النصوص أو إضافة ملاحظات جديدة أو حذف ما لا تحتاجه.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addNotePreset}
                  className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#1c2d31] transition hover:bg-[#fffaf2]"
                >
                  إضافة ملاحظة
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {notePresets.length === 0 ? (
                  <div className="rounded-2xl bg-[#fffaf2] p-4 text-sm text-[#1c2d31]/60">
                    لا توجد ملاحظات جاهزة حاليا. أضف أول ملاحظة من الزر أعلاه.
                  </div>
                ) : (
                  notePresets.map((preset, index) => (
                    <div
                      key={`note-preset-${index}`}
                      className="flex flex-col gap-3 rounded-2xl bg-[#fffaf2] p-4 md:flex-row md:items-center"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#8a6335] ring-1 ring-[#d9c8ad]">
                        {index + 1}
                      </div>
                      <input
                        value={preset}
                        onChange={(event) => updateNotePreset(index, event.target.value)}
                        placeholder="اكتب الملاحظة الجاهزة هنا"
                        className="w-full rounded-xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
                      />
                      <button
                        type="button"
                        onClick={() => removeNotePreset(index)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={saveNotePresets}
                disabled={savingNotePresets}
                className="mt-4 rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
              >
                {savingNotePresets ? "جارٍ حفظ الملاحظات..." : "حفظ الملاحظات الجاهزة"}
              </button>
            </section>

            <section className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.key}
                  className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-[#1c2d31]">
                        {template.title}
                      </h2>
                      <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                        {template.description}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#fffaf2] px-4 py-3 text-xs font-bold leading-6 text-[#1c2d31]/70">
                      المتغيرات:
                      <div className="mt-1">
                        {template.variables.map((item) => `{{${item}}}`).join(" - ")}
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={template.body}
                    onChange={(event) => updateTemplateBody(template.key, event.target.value)}
                    rows={12}
                    className="mt-4 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm leading-7 text-[#1c2d31] outline-none focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => saveTemplate(template)}
                      disabled={savingKey === template.key}
                      className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
                    >
                      {savingKey === template.key ? "جارٍ الحفظ..." : "حفظ القالب"}
                    </button>
                    <button
                      type="button"
                      onClick={() => restoreDefault(template)}
                      className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#1c2d31] transition hover:bg-[#fffaf2]"
                    >
                      استرجاع النص الافتراضي
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedTemplate(template)}
                      disabled={deletingKey === template.key}
                      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingKey === template.key ? "جارٍ الحذف..." : "حذف النص المحفوظ"}
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
