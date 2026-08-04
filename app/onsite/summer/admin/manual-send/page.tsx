import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loadExamGrades } from "@/lib/summer-evaluation";

export default async function ManualSendPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("alrahma_user_id")?.value;
  if (!userId) redirect("/onsite/summer/admin/login");

  const admin = await prisma.user.findFirst({
    where: { id: userId, role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (!admin) redirect("/onsite/summer/admin/login");

  // Load exam grades
  const gradeData = loadExamGrades();
  const gradeMap = new Map(gradeData.students.map((s) => [s.studentId, s]));

  // Get all summer students
  const students = await prisma.student.findMany({
    where: { studyMode: "ONSITE_SUMMER", isActive: true, id: { in: Array.from(gradeMap.keys()) } },
    select: {
      id: true, fullName: true, studentCode: true, parentWhatsapp: true,
      circle: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  // Check already sent
  const alreadySent = await prisma.whatsAppOutgoingMessage.findMany({
    where: {
      source: "SUMMER_PROGRESS_REPORT",
      createdAt: { gte: new Date("2026-08-03T00:00:00Z") },
    },
    select: { studentId: true },
  });
  const sentIds = new Set(alreadySent.map((m) => m.studentId).filter(Boolean));

  // Build data for each student
  const allData = students.map((s) => {
    const evalData = gradeMap.get(s.id);
    const code = s.studentCode || s.id;
    const reportUrl = `https://alrahmakuran.site/onsite/summer/parent-report/${code}`;
    const sent = sentIds.has(s.id);

    // Normalize phone
    let phone = String(s.parentWhatsapp || "").replace(/\D/g, "");
    if (phone.startsWith("0") && phone.length === 11) phone = "90" + phone.slice(1);
    else if (phone.length === 10 && phone.startsWith("5")) phone = "90" + phone;
    const validPhone = phone.length >= 10 && phone.length <= 13;

    const msg = [
      "السلام عليكم ورحمة الله وبركاته",
      "",
      "يسر إدارة *تحفيظ الرحمة للقرآن الكريم* أن تشارككم تقرير إنجاز ابنكم في الدورة الصيفية 2026 - الفترة الأولى.",
      "",
      `الطالب: *${s.fullName}*`,
      `الحلقة: ${s.circle?.name || "—"}`,
      ...(evalData ? [`النتيجة النهائية: *${evalData.finalScore}%*`] : []),
      "",
      "نسأل الله أن يبارك فيه وأن يجعله من أهل القرآن وخاصته.",
      "",
      "يمكنكم مشاهدة التقرير التفاعلي من هنا:",
      reportUrl,
      "",
      "مع تحيات إدارة تحفيظ الرحمة",
    ].join("\n");

    const waLink = validPhone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : null;

    return { ...s, evalData, code, reportUrl, sent, phone, validPhone, waLink, finalScore: evalData?.finalScore };
  });

  const remaining = allData.filter((s) => !s.sent);
  const alreadySentList = allData.filter((s) => s.sent);

  return (
    <div dir="rtl" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0C5C5E 0%, #0a4a4c 100%)", color: "#fff", padding: "24px 32px" }}>
        <h1 style={{ margin: 0, fontSize: "22px" }}>📨 إرسال تقارير الإنجاز يدوياً عبر واتساب</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.85, fontSize: "14px" }}>
          اضغط على زر الإرسال بجانب كل طالب — سيفتح واتساب مع الرسالة الجاهزة، فقط اضغط إرسال ✈️
        </p>
        <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px 16px" }}>
            <span style={{ fontSize: "22px", fontWeight: "bold" }}>{remaining.length}</span>
            <span style={{ fontSize: "13px", marginRight: "6px" }}>متبقي</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px 16px" }}>
            <span style={{ fontSize: "22px", fontWeight: "bold" }}>{alreadySentList.length}</span>
            <span style={{ fontSize: "13px", marginRight: "6px" }}>تم إرساله</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "8px 16px" }}>
            <span style={{ fontSize: "22px", fontWeight: "bold" }}>{allData.length}</span>
            <span style={{ fontSize: "13px", marginRight: "6px" }}>إجمالي</span>
          </div>
        </div>
      </div>

      {/* Remaining Students */}
      <div style={{ padding: "24px 32px", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ color: "#0C5C5E", fontSize: "18px", marginBottom: "16px" }}>
          🔴 لم يُرسل لهم بعد ({remaining.length})
        </h2>

        {remaining.map((s, i) => (
          <div key={s.id} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px",
            padding: "16px 20px", marginBottom: "12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ background: "#f3f4f6", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", color: "#6b7280" }}>
                  {i + 1}
                </span>
                <strong style={{ fontSize: "16px", color: "#1f2937" }}>{s.fullName}</strong>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>({s.code})</span>
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <span>📱 {s.phone}</span>
                <span>📊 {s.finalScore ? `${s.finalScore}%` : "—"}</span>
                <span>{s.circle?.name || ""}</span>
              </div>
              {!s.validPhone && (
                <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px", fontWeight: "bold" }}>
                  ⚠️ رقم غير صحيح — تحتاج تعديله يدوياً
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <a href={s.reportUrl} target="_blank" rel="noopener noreferrer" style={{
                background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                borderRadius: "8px", padding: "8px 12px", textDecoration: "none", fontSize: "13px",
              }}>
                🔗 التقرير
              </a>
              {s.waLink ? (
                <a href={s.waLink} target="_blank" rel="noopener noreferrer" style={{
                  background: "#25D366", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "8px 16px", textDecoration: "none",
                  fontSize: "14px", fontWeight: "bold",
                  boxShadow: "0 2px 6px rgba(37,211,102,0.3)",
                }}>
                  إرسال واتساب ✈️
                </a>
              ) : (
                <span style={{ color: "#dc2626", fontSize: "13px" }}>رقم خاطئ</span>
              )}
            </div>
          </div>
        ))}

        {/* Already Sent */}
        {alreadySentList.length > 0 && (
          <>
            <h2 style={{ color: "#16a34a", fontSize: "18px", marginTop: "32px", marginBottom: "16px" }}>
              ✅ تم الإرسال ({alreadySentList.length})
            </h2>
            {alreadySentList.map((s, i) => (
              <div key={s.id} style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px",
                padding: "12px 20px", marginBottom: "8px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                opacity: 0.7,
              }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#16a34a", marginLeft: "8px" }}>✅</span>
                  <strong style={{ fontSize: "14px", color: "#1f2937" }}>{s.fullName}</strong>
                  <span style={{ fontSize: "12px", color: "#9ca3af", marginRight: "8px" }}>({s.code})</span>
                </div>
                <a href={s.reportUrl} target="_blank" rel="noopener noreferrer" style={{
                  color: "#16a34a", fontSize: "12px", textDecoration: "none",
                }}>
                  🔗 التقرير
                </a>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
