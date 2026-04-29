"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Teacher = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
};

type Circle = {
  id: string;
  name: string;
  track: string | null;
  studyMode: "REMOTE" | "ONSITE";
  zoomUrl: string | null;
  periodLabel: string | null;
  startsAt: string | null;
  endsAt: string | null;
  teacher: Pick<Teacher, "id" | "fullName" | "email"> | null;
  _count: {
    students: number;
  };
};

type Student = {
  id: string;
  studentCode: string | null;
  fullName: string;
  studyMode: "REMOTE" | "ONSITE";
  isActive: boolean;
  teacher: Pick<Teacher, "id" | "fullName" | "email">;
  circle: {
    id: string;
    name: string;
  } | null;
};

function trackLabel(track: string | null) {
  if (track === "HIJAA") return "مسار الهجاء";
  if (track === "RUBAI") return "المسار الرباعي";
  if (track === "FARDI") return "المسار الفردي";
  if (track === "TILAWA") return "مسار التلاوة";
  return "لم يحدد";
}

const PERIOD_DEFAULTS: Record<string, { startsAt: string; endsAt: string }> = {
  "الفترة الصباحية": { startsAt: "09:00", endsAt: "11:00" },
  "الفترة المسائية الأولى": { startsAt: "15:00", endsAt: "18:00" },
  "الفترة المسائية الثانية": { startsAt: "19:00", endsAt: "22:00" },
  "الفترة المسائية الثالثة": { startsAt: "23:00", endsAt: "02:00" },
  "الفترة المسائية الرابعة": { startsAt: "03:00", endsAt: "06:00" },
};

export default function RemoteSupervisionTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCircle, setCreatingCircle] = useState(false);
  const [search, setSearch] = useState("");
  const [circleForm, setCircleForm] = useState({
    name: "",
    teacherId: "",
    track: "",
    zoomUrl: "",
    periodLabel: "",
    startsAt: "",
    endsAt: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teachersRes, circlesRes, studentsRes] = await Promise.all([
          fetch("/api/teachers?studyMode=REMOTE", { cache: "no-store" }),
          fetch("/api/circles?studyMode=REMOTE", { cache: "no-store" }),
          fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
        ]);

        const teachersData = await teachersRes.json();
        const circlesData = await circlesRes.json();
        const studentsData = await studentsRes.json();

        setTeachers(
          Array.isArray(teachersData.teachers)
            ? teachersData.teachers.filter(
                (teacher: Teacher) => teacher.studyMode === "REMOTE" && teacher.isActive
              )
            : []
        );
        setCircles(
          Array.isArray(circlesData.circles)
            ? circlesData.circles.filter((circle: Circle) => circle.studyMode === "REMOTE")
            : []
        );
        setStudents(
          Array.isArray(studentsData.students)
            ? studentsData.students.filter(
                (student: Student) => student.studyMode === "REMOTE" && student.isActive !== false
              )
            : []
        );
      } catch (error) {
        console.error("FETCH SUPERVISION TEACHERS ERROR =>", error);
        setTeachers([]);
        setCircles([]);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTeachers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return teachers;

    return teachers.filter((teacher) =>
      [
        teacher.fullName,
        teacher.email,
        teacher.whatsapp || "",
        ...circles
          .filter((circle) => circle.teacher?.id === teacher.id)
          .map((circle) => circle.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [circles, search, teachers]);

  const studentsByCircle = useMemo(() => {
    const grouped = new Map<string, Student[]>();

    for (const student of students) {
      if (!student.circle?.id) continue;
      grouped.set(student.circle.id, [...(grouped.get(student.circle.id) || []), student]);
    }

    return grouped;
  }, [students]);

  const circlesWithoutTeacher = circles.filter((circle) => !circle.teacher?.id);

  const createCircle = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setCreatingCircle(true);
      const response = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...circleForm, studyMode: "REMOTE" }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "تعذر فتح الحلقة");
        return;
      }

      setCircleForm({ name: "", teacherId: "", track: "", zoomUrl: "", periodLabel: "", startsAt: "", endsAt: "" });
      const [circlesRes, studentsRes] = await Promise.all([
        fetch("/api/circles?studyMode=REMOTE", { cache: "no-store" }),
        fetch("/api/students?studyMode=REMOTE", { cache: "no-store" }),
      ]);
      const [circlesData, studentsData] = await Promise.all([
        circlesRes.json(),
        studentsRes.json(),
      ]);
      setCircles(
        Array.isArray(circlesData.circles)
          ? circlesData.circles.filter((circle: Circle) => circle.studyMode === "REMOTE")
          : []
      );
      setStudents(
        Array.isArray(studentsData.students)
          ? studentsData.students.filter(
              (student: Student) => student.studyMode === "REMOTE" && student.isActive !== false
            )
          : []
      );
    } catch (error) {
      console.error("CREATE SUPERVISION CIRCLE ERROR =>", error);
      alert("حدث خطأ أثناء فتح الحلقة");
    } finally {
      setCreatingCircle(false);
    }
  };

  const selectPeriod = (periodLabel: string) => {
    const defaults = PERIOD_DEFAULTS[periodLabel];

    setCircleForm((prev) => ({
      ...prev,
      periodLabel,
      ...(defaults ? defaults : {}),
    }));
  };

  return (
    <main className="rahma-shell min-h-screen px-4 py-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-[#9b7039]">لوحة الإشراف</p>
            <h1 className="text-4xl font-black text-[#1c2d31]">المعلمون والحلقات</h1>
            <p className="mt-2 text-sm leading-7 text-[#1c2d31]/60">
              عرض تشغيلي للمعلمين وما يستلمونه من حلقات وطلاب. إضافة المعلمين والحلقات تبقى من الواجهة الإدارية.
            </p>
          </div>
          <Link
            href="/remote/supervision/dashboard"
            className="rounded-2xl border border-[#d9c8ad] bg-white px-5 py-3 text-center text-sm font-black text-[#1c2d31]"
          >
            الرجوع للوحة الإشراف
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">المعلمون</p>
            <p className="mt-2 text-4xl font-black text-[#173d42]">{teachers.length}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الحلقات</p>
            <p className="mt-2 text-4xl font-black text-[#1f6358]">{circles.length}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">الطلاب</p>
            <p className="mt-2 text-4xl font-black text-[#c39a62]">{students.length}</p>
          </div>
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
            <p className="text-sm font-bold text-[#1c2d31]/55">حلقات بلا معلم</p>
            <p className="mt-2 text-4xl font-black text-[#8a6335]">{circlesWithoutTeacher.length}</p>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]">
          <div className="relative">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم المعلم أو الحلقة"
              className="w-full rounded-2xl border border-[#d9c8ad] bg-white px-4 py-4 pl-12 text-right text-sm text-[#1c2d31] outline-none transition focus:border-[#1f6358] focus:ring-4 focus:ring-[#1f6358]/10"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-[#173d42] text-sm font-black text-white"
                aria-label="مسح البحث"
              >
                ×
              </button>
            ) : null}
          </div>
        </section>

        <form
          onSubmit={createCircle}
          className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#1c2d31]">فتح حلقة جديدة</h2>
              <p className="mt-1 text-sm leading-7 text-[#1c2d31]/60">
                يفتح المشرف الحلقة ويختار المعلم المناسب، ثم يتم توزيع الطلاب عليها من صفحة الطلاب.
              </p>
            </div>
            <button
              type="submit"
              disabled={creatingCircle}
              className="rounded-2xl bg-[#1f6358] px-6 py-3 text-sm font-black text-white transition hover:bg-[#173d42] disabled:opacity-60"
            >
              {creatingCircle ? "جار فتح الحلقة..." : "فتح الحلقة"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={circleForm.name}
              onChange={(event) =>
                setCircleForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="اسم الحلقة"
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
              required
            />
            <select
              value={circleForm.teacherId}
              onChange={(event) =>
                setCircleForm((prev) => ({ ...prev, teacherId: event.target.value }))
              }
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
            >
              <option value="">اختر المعلم</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
            <select
              value={circleForm.track}
              onChange={(event) =>
                setCircleForm((prev) => ({ ...prev, track: event.target.value }))
              }
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
            >
              <option value="">اختر المسار</option>
              <option value="HIJAA">مسار الهجاء</option>
              <option value="RUBAI">المسار الرباعي</option>
              <option value="FARDI">المسار الفردي</option>
              <option value="TILAWA">مسار التلاوة</option>
            </select>
            <input
              type="url"
              value={circleForm.zoomUrl}
              onChange={(event) =>
                setCircleForm((prev) => ({ ...prev, zoomUrl: event.target.value }))
              }
              placeholder="رابط الحلقة"
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
              dir="ltr"
            />
            <select
              value={circleForm.periodLabel}
              onChange={(event) => selectPeriod(event.target.value)}
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
            >
              <option value="">اختر الفترة</option>
              <option value="الفترة الصباحية">الفترة الصباحية</option>
              <option value="الفترة المسائية الأولى">الفترة المسائية الأولى</option>
              <option value="الفترة المسائية الثانية">الفترة المسائية الثانية</option>
              <option value="الفترة المسائية الثالثة">الفترة المسائية الثالثة</option>
              <option value="الفترة المسائية الرابعة">الفترة المسائية الرابعة</option>
            </select>
            <input
              type="time"
              value={circleForm.startsAt}
              onChange={(event) =>
                setCircleForm((prev) => ({ ...prev, startsAt: event.target.value }))
              }
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
              aria-label="وقت بداية الحلقة"
            />
            <input
              type="time"
              value={circleForm.endsAt}
              onChange={(event) =>
                setCircleForm((prev) => ({ ...prev, endsAt: event.target.value }))
              }
              className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] px-4 py-3 text-sm outline-none focus:border-[#1f6358]"
              aria-label="وقت نهاية الحلقة"
            />
          </div>
        </form>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/70 p-8 text-center text-sm text-[#1c2d31]/60">
            جاري تحميل بيانات المعلمين...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d9c8ad] bg-white/70 p-8 text-center text-sm text-[#1c2d31]/60">
            لا توجد نتائج مطابقة.
          </div>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2">
            {filteredTeachers.map((teacher) => {
              const teacherCircles = circles.filter((circle) => circle.teacher?.id === teacher.id);
              const teacherStudentsCount = teacherCircles.reduce(
                (total, circle) => total + (studentsByCircle.get(circle.id)?.length || 0),
                0
              );

              return (
                <article
                  key={teacher.id}
                  className="rounded-[2rem] bg-white/88 p-5 shadow-sm ring-1 ring-[#d9c8ad]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#1c2d31]">{teacher.fullName}</h2>
                      <p className="mt-1 text-sm text-[#1c2d31]/60">{teacher.email}</p>
                      {teacher.whatsapp ? (
                        <p className="mt-1 text-sm text-[#1c2d31]/60" dir="ltr">
                          {teacher.whatsapp}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2 text-xs font-black">
                      <span className="rounded-full bg-[#eef7f5] px-3 py-2 text-[#1f6358]">
                        {teacherCircles.length} حلقة
                      </span>
                      <span className="rounded-full bg-[#fffaf2] px-3 py-2 text-[#9b7039]">
                        {teacherStudentsCount} طالب
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {teacherCircles.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#d9c8ad] p-4 text-sm text-[#1c2d31]/60">
                        لا توجد حلقات مسندة لهذا المعلم.
                      </div>
                    ) : (
                      teacherCircles.map((circle) => {
                        const circleStudents = studentsByCircle.get(circle.id) || [];

                        return (
                          <div key={circle.id} className="rounded-2xl border border-[#d9c8ad] bg-[#fffaf2] p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <h3 className="font-black text-[#1c2d31]">{circle.name}</h3>
                                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                                  {trackLabel(circle.track)}
                                  {circle.periodLabel ? ` - ${circle.periodLabel}` : ""}
                                  {circle.startsAt || circle.endsAt ? ` - ${circle.startsAt || "--:--"} إلى ${circle.endsAt || "--:--"}` : ""}
                                </p>
                                <p className="mt-1 text-xs font-bold text-[#1c2d31]/55">
                                  {circleStudents.length} طالب
                                </p>
                              </div>
                              {circle.zoomUrl ? (
                                <a
                                  href={circle.zoomUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl bg-[#1f6358] px-4 py-2 text-center text-xs font-black text-white shadow-sm"
                                >
                                  دخول الحلقة
                                </a>
                              ) : (
                                <span className="rounded-xl bg-white px-4 py-2 text-xs font-black text-[#1c2d31]/55 ring-1 ring-[#d9c8ad]">
                                  لا يوجد رابط
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {circleStudents.length === 0 ? (
                                <span className="text-xs text-[#1c2d31]/55">لا يوجد طلاب في هذه الحلقة.</span>
                              ) : (
                                circleStudents.map((student) => (
                                  <span
                                    key={student.id}
                                    className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1c2d31] ring-1 ring-[#d9c8ad]"
                                  >
                                    {student.fullName}
                                    {student.studentCode ? ` - ${student.studentCode}` : ""}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
