"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  joinInternationalPhone,
  normalizePhoneDigits,
  splitInternationalPhone,
} from "@/lib/phone-number";
import { PHONE_COUNTRIES } from "@/lib/phone-countries";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  studyMode?: "REMOTE" | "ONSITE_SYRIA";
  isActive?: boolean;
};

type Circle = {
  id: string;
  name: string;
  studyMode: "REMOTE" | "ONSITE_SYRIA";
  teacher: Teacher | null;
};

type Student = {
  id: string;
  studentCode: string | null;
  fullName: string;
  parentWhatsapp?: string | null;
  parentEmail?: string | null;
  studyMode: "REMOTE" | "ONSITE_SYRIA";
  isActive: boolean;
  createdAt: string;
  teacher: Teacher;
  circle: Circle | null;
};

function formatPhoneGroups(value: string) {
  const digits = normalizePhoneDigits(value);
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function formatSavedPhone(value: string | null | undefined) {
  const parts = splitInternationalPhone(value || "", "963");
  const localNumber = formatPhoneGroups(parts.localNumber);
  return localNumber ? `+${parts.countryCode} ${localNumber}` : "";
}

function ParentPhoneInput({
  value,
  studentName,
  onSave,
  className = "",
}: {
  value: string;
  studentName: string;
  onSave: (value: string | null) => Promise<boolean>;
  className?: string;
}) {
  const initialParts = splitInternationalPhone(value, "963");
  const [countryCode, setCountryCode] = useState(initialParts.countryCode || "963");
  const [localNumber, setLocalNumber] = useState(formatPhoneGroups(initialParts.localNumber));
  const [saving, setSaving] = useState(false);
  const savedDisplay = formatSavedPhone(value);
  const normalizedDraft = localNumber.trim()
    ? joinInternationalPhone(countryCode, localNumber)
    : "";
  const normalizedSaved = normalizePhoneDigits(value);
  const changed = normalizedDraft !== normalizedSaved;

  useEffect(() => {
    const parts = splitInternationalPhone(value, "963");
    setCountryCode(parts.countryCode || "963");
    setLocalNumber(formatPhoneGroups(parts.localNumber));
  }, [value]);

  const commit = async () => {
    if (saving) return;

    try {
      setSaving(true);
      const localDigits = normalizePhoneDigits(localNumber);
      if (!localDigits) {
        alert("أدخل رقم ولي الأمر قبل الحفظ");
        return;
      }
      if (countryCode === "963" && localDigits.replace(/^0/, "").length !== 9) {
        alert("رقم سوريا يجب أن يكون 9 أرقام بعد +963، مثال: 944 123 456");
        return;
      }
      const normalized = joinInternationalPhone(countryCode, localNumber);
      const ok = await onSave(normalized || null);
      if (ok) {
        const parts = splitInternationalPhone(normalized, countryCode);
        setCountryCode(parts.countryCode || countryCode);
        setLocalNumber(formatPhoneGroups(parts.localNumber));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border border-[#d8bf83] bg-[#fffaf4] p-3 shadow-sm ring-1 ring-[#f0e2c8] ${className}`}
    >
      <div className="grid gap-2 sm:grid-cols-[8.5rem_1fr]" dir="ltr">
        <select
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          className="h-11 rounded-xl border border-[#eadcc4] bg-white px-2 text-left text-sm font-black text-[#0f5a35] outline-none transition focus:border-[#0f5a35]"
          aria-label="رمز الدولة"
        >
          {PHONE_COUNTRIES.map((country) => (
            <option key={`${country.iso}-${country.code}`} value={country.code}>
              +{country.code} {country.iso}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(event) => setLocalNumber(formatPhoneGroups(event.target.value))}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (!text) return;
            event.preventDefault();
            const pastedParts = splitInternationalPhone(text, countryCode);
            setCountryCode(pastedParts.countryCode || countryCode);
            setLocalNumber(formatPhoneGroups(pastedParts.localNumber));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commit();
            }
          }}
          placeholder={countryCode === "963" ? "944 123 456" : "رقم ولي الأمر"}
          aria-label={`رقم ولي أمر ${studentName}`}
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#eadcc4] bg-white px-3 text-left font-mono text-base font-black text-[#1c2d31] outline-none transition placeholder:text-[#1c2d31]/30 focus:border-[#0f5a35]"
        />
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 truncate text-xs font-bold text-[#1c2d31]/55">
          {savedDisplay ? `محفوظ: ${savedDisplay}` : "لا يوجد رقم محفوظ"}
        </span>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => void commit()}
          disabled={saving}
          className="rounded-xl bg-[#0f5a35] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:bg-[#0f5a35]/35"
        >
          {saving ? "جاري الحفظ..." : changed ? "حفظ رقم الطالب" : "حفظ رقم الطالب"}
        </button>
      </div>
    </div>
  );
}

function ParentContactSummary({
  student,
  onEditPhone,
}: {
  student: Student;
  onEditPhone: () => void;
}) {
  const phoneDisplay = formatSavedPhone(student.parentWhatsapp || "");

  return (
    <div className="rounded-2xl border border-[#d8bf83] bg-[#fffaf4] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[#1c2d31]/55">
            رقم ولي الأمر
          </p>
          <p className="mt-1 font-mono text-sm font-black text-[#0f5a35]" dir="ltr">
            {phoneDisplay || "لا يوجد رقم محفوظ"}
          </p>
        </div>
        <button
          type="button"
          onClick={onEditPhone}
          className="rounded-xl border border-[#0f5a35]/20 bg-white px-3 py-2 text-xs font-black text-[#0f5a35] transition hover:bg-[#edf6ee]"
        >
          تعديل الرقم
        </button>
      </div>
      <div className="mt-2 border-t border-[#eadcc4] pt-2">
        <p className="text-[11px] font-black text-[#1c2d31]/55">
          إيميل ولي الأمر
        </p>
        <p className="mt-1 truncate text-xs font-bold text-[#1c2d31]/70" dir="ltr">
          {student.parentEmail || "لا يوجد إيميل محفوظ"}
        </p>
      </div>
    </div>
  );
}

export default function OnsiteAdminStudentsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [editingPhoneStudent, setEditingPhoneStudent] = useState<Student | null>(
    null
  );

  const [formData, setFormData] = useState({
    fullName: "",
    teacherId: "",
    circleId: "",
    parentCountryCode: "963",
    parentLocalNumber: "",
    studyMode: "ONSITE_SYRIA",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [teachersRes, studentsRes, circlesRes] = await Promise.all([
        fetch("/api/teachers?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
        fetch("/api/students?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
        fetch("/api/circles?studyMode=ONSITE_SYRIA", { cache: "no-store" }),
      ]);

      const teachersData = await teachersRes.json();
      const studentsData = await studentsRes.json();
      const circlesData = await circlesRes.json();

      const teachersList = Array.isArray(teachersData.teachers)
        ? (teachersData.teachers as Teacher[])
        : [];
      const studentsList = Array.isArray(studentsData.students)
        ? (studentsData.students as Student[])
        : [];
      const circlesList = Array.isArray(circlesData.circles)
        ? (circlesData.circles as Circle[])
        : [];

      setTeachers(
        teachersList.filter((t) => t.studyMode === "ONSITE_SYRIA" && t.isActive !== false)
      );
      setStudents(
        studentsList.filter((s) => s.studyMode === "ONSITE_SYRIA" && s.isActive)
      );
      setCircles(circlesList.filter((c) => c.studyMode === "ONSITE_SYRIA"));
    } catch (error) {
      console.error("FETCH ONSITE_SYRIA STUDENTS PAGE DATA ERROR =>", error);
      setTeachers([]);
      setStudents([]);
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const findOnlyTeacherCircle = (teacherId: string) => {
    const teacherCircles = circles.filter(
      (circle) => circle.teacher?.id === teacherId
    );

    return teacherCircles.length === 1 ? teacherCircles[0] : null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "circleId"
        ? {
            teacherId:
              circles.find((circle) => circle.id === value)?.teacher?.id ||
              prev.teacherId,
          }
        : {}),
      ...(name === "teacherId"
        ? {
            circleId: findOnlyTeacherCircle(value)?.id || prev.circleId,
          }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const localDigits = normalizePhoneDigits(formData.parentLocalNumber);
      if (
        formData.parentCountryCode === "963" &&
        localDigits &&
        localDigits.replace(/^0/, "").length !== 9
      ) {
        alert("رقم سوريا يجب أن يكون 9 أرقام بعد +963، مثال: 944 123 456");
        return;
      }
      const parentWhatsapp = formData.parentLocalNumber.trim()
        ? joinInternationalPhone(formData.parentCountryCode, formData.parentLocalNumber)
        : "";

      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          parentWhatsapp,
          studyMode: "ONSITE_SYRIA",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "حدث خطأ أثناء إضافة الطالب");
        return;
      }

      alert("تمت إضافة الطالب بنجاح");

      setFormData({
        fullName: "",
        teacherId: "",
        circleId: "",
        parentCountryCode: "963",
        parentLocalNumber: "",
        studyMode: "ONSITE_SYRIA",
      });

      await fetchData();
    } catch (error) {
      console.error("CREATE ONSITE_SYRIA STUDENT SUBMIT ERROR =>", error);
      alert("حدث خطأ أثناء إضافة الطالب");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStudent = async (
    studentId: string,
    patch: Partial<Pick<Student, "parentWhatsapp" | "parentEmail">> & {
      teacherId?: string;
      circleId?: string | null;
    }
  ) => {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "تعذر تحديث بيانات الطالب");
      return false;
    }

    return true;
  };

  const deleteStudent = async (student: Student) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الطالب ${student.fullName}؟\n\nسيتم إخفاؤه من قوائم الحضوري، ويمكن استرجاعه لاحقًا من قاعدة البيانات عند الحاجة.`
    );

    if (!confirmed) return;

    try {
      setDeletingStudentId(student.id);

      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر حذف الطالب");
        return;
      }

      alert("تم حذف الطالب بنجاح");
      await fetchData();
    } catch (error) {
      console.error("DELETE ONSITE_SYRIA STUDENT ERROR =>", error);
      alert("حدث خطأ أثناء حذف الطالب");
    } finally {
      setDeletingStudentId(null);
    }
  };

  const unassignedCount = useMemo(
    () => students.filter((s) => !s.circle?.id).length,
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) => {
      const haystack = [
        student.fullName,
        student.studentCode || "",
        student.parentWhatsapp || "",
        student.parentEmail || "",
        student.teacher?.fullName || "",
        student.circle?.name || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [searchTerm, students]);

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1c2d31] md:text-3xl">
              إدارة الطلاب (حضوري)
            </h1>
            <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
              إضافة الطلاب، نقلهم للحلقات، ومراجعة بيانات ولي الأمر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fffaf4] px-4 py-2 text-sm font-black text-[#8a661f] ring-1 ring-[#d8bf83]">
              بلا حلقة: {unassignedCount}
            </span>
            <Link
              href="/syria/admin/dashboard"
              className="rounded-2xl bg-[#0a3f2a] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#0f5a35]"
            >
              الرجوع للوحة الإدارة
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <h2 className="mb-4 text-lg font-black text-[#1c2d31]">
              إضافة طالب جديد
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto] md:items-end"
            >
              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="أدخل اسم الطالب"
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  الحلقة
                </label>
                <select
                  name="circleId"
                  value={formData.circleId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                >
                  <option value="">بدون حلقة</option>
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>
                      {circle.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                  عند اختيار حلقة، يتم تعيين المعلم تلقائيًا من معلم الحلقة.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  المعلم
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 outline-none focus:border-[#0f5a35]"
                  required={!formData.circleId}
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#1c2d31]">
                  رقم ولي الأمر
                </label>
                <div className="grid gap-2 sm:grid-cols-[7.5rem_1fr]" dir="ltr">
                  <select
                    value={formData.parentCountryCode}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        parentCountryCode: event.target.value,
                      }))
                    }
                    className="rounded-2xl border border-[#d8bf83] bg-white px-2 py-3 text-left text-sm font-black text-[#0f5a35] outline-none focus:border-[#0f5a35]"
                    aria-label="رمز الدولة"
                  >
                    {PHONE_COUNTRIES.map((country) => (
                      <option key={`${country.iso}-${country.code}`} value={country.code}>
                        +{country.code} {country.iso}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formData.parentLocalNumber}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        parentLocalNumber: formatPhoneGroups(event.target.value),
                      }))
                    }
                    placeholder={
                      formData.parentCountryCode === "963"
                        ? "944 123 456"
                        : "اختياري"
                    }
                    className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-left font-mono font-black outline-none focus:border-[#0f5a35]"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#0f5a35] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0a3f2a] disabled:cursor-not-allowed disabled:opacity-60 md:min-w-36"
                >
                  {submitting ? "جاري الإضافة..." : "إضافة الطالب"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d8bf83]">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1c2d31]">قائمة الطلاب</h2>
                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                  هذه الصفحة للتشغيل السريع: نقل الطالب بين الحلقات وتحديث بيانات ولي الأمر.
                </p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث باسم الطالب أو رقمه أو الحلقة أو ولي الأمر..."
                  className="w-full rounded-2xl border border-[#d8bf83] bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#1c2d31] outline-none transition focus:border-[#0f5a35] focus:bg-white"
                />
                <p className="text-xs font-bold text-[#1c2d31]/55">
                  {filteredStudents.length} من {students.length} طالب
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
                جاري التحميل...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8bf83] p-6 text-center text-sm text-[#1c2d31]/55">
                لا توجد نتائج مطابقة للبحث.
              </div>
            ) : (
              <>
              <div className="grid gap-3 md:hidden">
                {filteredStudents.map((student) => (
                  <article
                    key={student.id}
                    className="rounded-3xl border border-[#d8bf83] bg-[#fffdf8] p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black text-[#1c2d31]">
                          {student.fullName}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                          تحديث الحلقة والمعلم وبيانات ولي الأمر
                        </p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-[#edf6ee] px-3 py-2 font-mono text-sm font-black text-[#0f5a35] ring-1 ring-[#cfe4d4]">
                        {student.studentCode || "-"}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      <label className="grid gap-2">
                        <span className="text-xs font-black text-[#1c2d31]/70">
                          المعلم
                        </span>
                        <select
                          value={student.teacher?.id || ""}
                          onChange={async (event) => {
                            const ok = await updateStudent(student.id, {
                              teacherId: event.target.value,
                            });
                            if (ok) await fetchData();
                          }}
                          className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                        >
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.fullName}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2">
                        <span className="text-xs font-black text-[#1c2d31]/70">
                          الحلقة
                        </span>
                        <select
                          value={student.circle?.id || ""}
                          onChange={async (event) => {
                            const ok = await updateStudent(student.id, {
                              circleId: event.target.value || null,
                            });
                            if (ok) await fetchData();
                          }}
                          className="w-full rounded-2xl border border-[#d8bf83] bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#0f5a35]"
                        >
                          <option value="">بدون حلقة</option>
                          {circles.map((circle) => (
                            <option key={circle.id} value={circle.id}>
                              {circle.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <ParentContactSummary
                        student={student}
                        onEditPhone={() => setEditingPhoneStudent(student)}
                      />

                      <button
                        type="button"
                        disabled={deletingStudentId === student.id}
                        onClick={() => deleteStudent(student)}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingStudentId === student.id ? "جار الحذف..." : "حذف الطالب"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[920px] overflow-hidden rounded-2xl">
                  <thead>
                    <tr className="bg-[#fffaf4] text-right text-sm text-[#1c2d31]/70">
                      <th className="px-4 py-3 font-black">رقم الطالب</th>
                      <th className="px-4 py-3 font-black">اسم الطالب</th>
                      <th className="px-4 py-3 font-black">المعلم</th>
                      <th className="px-4 py-3 font-black">الحلقة</th>
                      <th className="w-[18rem] px-4 py-3 font-black">ولي الأمر</th>
                      <th className="w-24 px-4 py-3 font-black">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-[#d8bf83]/30 text-sm"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex min-w-16 justify-center rounded-xl bg-[#edf6ee] px-3 py-2 font-mono text-sm font-black text-[#0f5a35] ring-1 ring-[#cfe4d4]">
                            {student.studentCode || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black text-[#1c2d31]">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          <select
                            value={student.teacher?.id || ""}
                            onChange={async (event) => {
                              const ok = await updateStudent(student.id, {
                                teacherId: event.target.value,
                              });
                              if (ok) await fetchData();
                            }}
                            className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 outline-none focus:border-[#0f5a35]"
                          >
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.fullName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[#1c2d31]/70">
                          <select
                            value={student.circle?.id || ""}
                            onChange={async (event) => {
                              const ok = await updateStudent(student.id, {
                                circleId: event.target.value || null,
                              });
                              if (ok) await fetchData();
                            }}
                            className="rounded-xl border border-[#d8bf83] bg-white px-3 py-2 outline-none focus:border-[#0f5a35]"
                          >
                            <option value="">بدون حلقة</option>
                            {circles.map((circle) => (
                              <option key={circle.id} value={circle.id}>
                                {circle.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="w-[18rem] px-4 py-3 align-top text-xs font-bold text-[#1c2d31]/70">
                          <ParentContactSummary
                            student={student}
                            onEditPhone={() => setEditingPhoneStudent(student)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={deletingStudentId === student.id}
                            onClick={() => deleteStudent(student)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingStudentId === student.id
                              ? "جار الحذف..."
                              : "حذف"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>
        </div>
      </div>

      {editingPhoneStudent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c2d31]/45 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl ring-1 ring-[#d8bf83]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#1c2d31]">
                  تعديل رقم ولي الأمر
                </h2>
                <p className="mt-1 text-sm font-bold text-[#1c2d31]/55">
                  {editingPhoneStudent.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhoneStudent(null)}
                className="rounded-xl border border-[#d8bf83] bg-[#fffaf4] px-3 py-2 text-sm font-black text-[#1c2d31]"
              >
                إغلاق
              </button>
            </div>

            <ParentPhoneInput
              value={editingPhoneStudent.parentWhatsapp || ""}
              studentName={editingPhoneStudent.fullName}
              onSave={async (next) => {
                const ok = await updateStudent(editingPhoneStudent.id, {
                  parentWhatsapp: next,
                });
                if (ok) {
                  await fetchData();
                  setEditingPhoneStudent(null);
                }
                return ok;
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

