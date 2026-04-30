"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  fullName: string;
  studentCode: string | null;
  parentWhatsapp: string | null;
  teacher: { fullName: string } | null;
  circle: { name: string } | null;
};

type Teacher = {
  id: string;
  fullName: string;
  whatsapp: string | null;
};

type RecipientMode = "SELECTED_PARENTS" | "ALL_PARENTS" | "SELECTED_TEACHERS" | "ALL_TEACHERS";

const templates = [
  {
    key: "struggle",
    title: "متابعة تعثر",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود إشعاركم بأن الطالب {{studentName}} يحتاج إلى متابعة إضافية في المراجعة والحفظ.\n\nنرجو تخصيص وقت يومي قصير لمتابعته، وسيبقى المشرف والمعلم قريبين من حالته بإذن الله.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "absence",
    title: "غياب متكرر",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nنود التنبيه إلى تكرر غياب الطالب {{studentName}} عن الحلقة.\n\nنرجو الحرص على انتظامه في الموعد المحدد، فاستمرار الحضور يعين الطالب على الثبات والإنجاز.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "teacher",
    title: "رسالة للمعلمين",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nالإخوة المعلمون الكرام، نرجو التنبه إلى الآتي:\n{{message}}\n\nبارك الله في جهودكم وجعلها في ميزان حسناتكم.",
  },
  {
    key: "supervision",
    title: "تعميم إشرافي",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\nتنبيه إشرافي من منصة الرحمة:\n{{message}}\n\nنسأل الله أن يبارك في أبنائنا ووقتكم.\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
  {
    key: "general",
    title: "رسالة عامة",
    body:
      "السلام عليكم ورحمة الله وبركاته\n\n{{message}}\n\nإدارة منصة الرحمة لتعليم القرآن الكريم",
  },
];

function applyTemplate(template: string, values: { studentName: string; message: string }) {
  return template
    .replaceAll("{{studentName}}", values.studentName || "ابنكم")
    .replaceAll("{{message}}", values.message || "نرجو منكم متابعة الملاحظة المرسلة من الإشراف.");
}

export default function RemoteSupervisionMessagesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("SELECTED_PARENTS");
  const [studentQuery, setStudentQuery] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0].key);
  const [message, setMessage] = useState(templates[0].body);
  const [sending, setSending] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedTemplateKey) || templates[0],
    [selectedTemplateKey]
  );
  const selectedStudents = students.filter((student) => selectedStudentIds.includes(student.id));
  const selectedTeachers = teachers.filter((teacher) => selectedTeacherIds.includes(teacher.id));
  const primaryStudentName = selectedStudents[0]?.fullName || "";

  const filteredStudents = students.filter((student) => {
    const text = [student.fullName, student.studentCode, student.parentWhatsapp, student.teacher?.fullName, student.circle?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(studentQuery.trim().toLowerCase());
  });
  const filteredTeachers = teachers.filter((teacher) => {
    const text = [teacher.fullName, teacher.whatsapp].filter(Boolean).join(" ").toLowerCase();

    return text.includes(teacherQuery.trim().toLowerCase());
  });

  const recipientCount =
    recipientMode === "ALL_PARENTS"
      ? students.filter((student) => student.parentWhatsapp).length
      : recipientMode === "ALL_TEACHERS"
        ? teachers.filter((teacher) => teacher.whatsapp).length
        : recipientMode === "SELECTED_TEACHERS"
          ? selectedTeachers.filter((teacher) => teacher.whatsapp).length
          : selectedStudents.filter((student) => student.parentWhatsapp).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsResponse, teachersResponse] = await Promise.all([
          fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
          fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
        ]);
        const [studentsData, teachersData] = await Promise.all([
          studentsResponse.json(),
          teachersResponse.json(),
        ]);

        setStudents(Array.isArray(studentsData.students) ? studentsData.students : []);
        setTeachers(Array.isArray(teachersData.teachers) ? teachersData.teachers : []);
      } catch (error) {
        console.error("FETCH SUPERVISION MESSAGE RECIPIENTS ERROR =>", error);
        setStudents([]);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fillSelectedTemplate = (templateKey: string) => {
    const template = templates.find((item) => item.key === templateKey) || templates[0];
    setSelectedTemplateKey(template.key);
    setMessage(applyTemplate(template.body, { studentName: primaryStudentName, message: customMessage }));
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    );
  };

  const sendMessage = async () => {
    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: recipientMode,
          selectedParentIds: selectedStudentIds,
          selectedTeacherIds,
          message,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر إرسال الرسالة");
        return;
      }

      alert(`تم الإرسال إلى ${data.sentCount || 0} من أصل ${data.recipientsCount || 0}`);
    } catch (error) {
      console.error("SEND SUPERVISION MESSAGE ERROR =>", error);
      alert("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">رسائل أولياء الأمور والمعلمين</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              اختر الطالب أو المعلم من النظام، ثم عدل القالب وأرسل الرسالة دون إدخال الأرقام يدويًا.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع إلى لوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <div className="space-y-4 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <div className="grid gap-2">
              {[
                { value: "SELECTED_PARENTS", label: "أولياء أمور محددون" },
                { value: "ALL_PARENTS", label: "جميع أولياء الأمور" },
                { value: "SELECTED_TEACHERS", label: "معلمون محددون" },
                { value: "ALL_TEACHERS", label: "جميع المعلمين" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setRecipientMode(mode.value as RecipientMode)}
                  className={`rounded-2xl px-4 py-3 text-right text-sm font-black ${
                    recipientMode === mode.value
                      ? "bg-[#173d42] text-white"
                      : "bg-[#fffaf2] text-[#173d42] ring-1 ring-[#e5d7bd]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {recipientMode.includes("PARENTS") ? (
              <div className="space-y-3">
                <input
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="ابحث باسم الطالب أو رقمه أو ولي الأمر"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="max-h-[420px] space-y-2 overflow-y-auto pl-1">
                  {loading ? (
                    <p className="rounded-2xl bg-[#fffaf2] p-4 text-center text-sm text-[#1c2d31]/60">جاري التحميل...</p>
                  ) : filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      disabled={recipientMode === "ALL_PARENTS"}
                      className={`w-full rounded-2xl p-3 text-right ring-1 ring-[#d9c8ad] ${
                        selectedStudentIds.includes(student.id)
                          ? "bg-[#1f6358] text-white"
                          : "bg-[#fffaf2] text-[#1c2d31]"
                      } disabled:opacity-60`}
                    >
                      <p className="font-black">{student.fullName}</p>
                      <p className="mt-1 text-xs opacity-75">
                        {student.parentWhatsapp || "لا يوجد رقم"} - {student.circle?.name || "بلا حلقة"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={teacherQuery}
                  onChange={(event) => setTeacherQuery(event.target.value)}
                  placeholder="ابحث باسم المعلم أو رقمه"
                  className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
                />
                <div className="max-h-[420px] space-y-2 overflow-y-auto pl-1">
                  {loading ? (
                    <p className="rounded-2xl bg-[#fffaf2] p-4 text-center text-sm text-[#1c2d31]/60">جاري التحميل...</p>
                  ) : filteredTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      type="button"
                      onClick={() => toggleTeacher(teacher.id)}
                      disabled={recipientMode === "ALL_TEACHERS"}
                      className={`w-full rounded-2xl p-3 text-right ring-1 ring-[#d9c8ad] ${
                        selectedTeacherIds.includes(teacher.id)
                          ? "bg-[#1f6358] text-white"
                          : "bg-[#fffaf2] text-[#1c2d31]"
                      } disabled:opacity-60`}
                    >
                      <p className="font-black">{teacher.fullName}</p>
                      <p className="mt-1 text-xs opacity-75">{teacher.whatsapp || "لا يوجد رقم"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-[#173d42] p-4 text-white">
              <p className="text-sm font-bold text-white/70">عدد المستلمين الجاهزين</p>
              <p className="mt-2 text-4xl font-black">{recipientCount}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <label className="block text-sm font-black text-[#1c2d31]">
              ملاحظة مختصرة للقالب
              <textarea
                value={customMessage}
                onChange={(event) => setCustomMessage(event.target.value)}
                rows={3}
                placeholder="تستخدم داخل قالب التعميم أو الرسالة العامة"
                className="mt-2 w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-3 text-sm outline-none"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => fillSelectedTemplate(template.key)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    selectedTemplate.key === template.key
                      ? "bg-[#173d42] text-white"
                      : "bg-[#fffaf2] text-[#173d42] ring-1 ring-[#e5d7bd]"
                  }`}
                >
                  {template.title}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={14}
              className="w-full rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm leading-7 outline-none"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => fillSelectedTemplate(selectedTemplate.key)}
                className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-sm font-black text-[#173d42]"
              >
                تحديث القالب بالبيانات
              </button>
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || recipientCount === 0 || !message.trim()}
                className="rounded-2xl bg-[#1f6358] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {sending ? "جارٍ الإرسال..." : "إرسال واتساب"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
