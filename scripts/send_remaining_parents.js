const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const XLSX = require("xlsx");
const path = require("path");
require("dotenv").config();

const WHATSAPP_BOT_URL = "http://127.0.0.1:3334/send-message";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_ONSITE_API_TOKEN || process.env.WHATSAPP_API_TOKEN || "";
const REPORT_BASE_URL = "https://alrahmakuran.site/onsite/summer/parent-report";
const LOCAL_REPORT_URL = "http://127.0.0.1:3005/onsite/summer/parent-report";

function normalizePhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  // Turkish numbers: remove leading 0, add 90
  if (digits.startsWith("0") && digits.length === 11) digits = "90" + digits.slice(1);
  else if (digits.length === 10 && digits.startsWith("5")) digits = "90" + digits;
  // Reject obviously bad numbers (too long/short)
  if (digits.length < 10 || digits.length > 13) return null;
  return digits;
}

function smartDelay(msgIndex) {
  // Human-like delay patterns to avoid WhatsApp ban
  const base = 3000 + Math.random() * 4000; // 3-7s base
  let extra = 0;
  if (msgIndex > 0 && msgIndex % 5 === 0) {
    extra = 30000 + Math.random() * 30000; // 30-60s batch cooldown every 5 msgs
    console.log(`  [SmartDelay] Batch cooldown after ${msgIndex} messages: ${Math.round((base + extra) / 1000)}s`);
  }
  if (msgIndex > 0 && msgIndex % 15 === 0) {
    extra = 90000 + Math.random() * 60000; // 90-150s long cooldown every 15 msgs
    console.log(`  [SmartDelay] Long cooldown after ${msgIndex} messages: ${Math.round((base + extra) / 1000)}s`);
  }
  return new Promise((resolve) => setTimeout(resolve, base + extra));
}

function addVariation(text) {
  // Add invisible Unicode variation characters to make each message unique
  const chars = ["\u200B", "\u200C", "\u200D", "\uFEFF"];
  const pos = Math.floor(Math.random() * text.length);
  const c = chars[Math.floor(Math.random() * chars.length)];
  return text.slice(0, pos) + c + text.slice(pos);
}

async function sendWhatsApp(phone, message) {
  const res = await fetch(WHATSAPP_BOT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WHATSAPP_API_TOKEN ? { Authorization: `Bearer ${WHATSAPP_API_TOKEN}` } : {}),
    },
    body: JSON.stringify({ phone, message }),
  });
  const data = await res.json();
  return data.success === true;
}

async function verifyLink(studentCode) {
  try {
    const res = await fetch(`${LOCAL_REPORT_URL}/${studentCode}`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Load exam grades
    const gradesFile = path.join(__dirname, "../data/summer-exam-grades.json");
    const fs = require("fs");
    const gradeData = JSON.parse(fs.readFileSync(gradesFile, "utf8"));
    const gradeMap = new Map(gradeData.students.map((s) => [s.studentId, s]));

    // 2. Read Excel for full student list
    const filePath = path.join(__dirname, "../docs/بيانات الطلاب والدرجات.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    // 3. Get all active summer students from DB
    const dbStudents = await prisma.student.findMany({
      where: { studyMode: "ONSITE_SUMMER", isActive: true },
      select: {
        id: true, fullName: true, studentCode: true, parentWhatsapp: true,
        circle: { select: { name: true } },
      },
    });

    // 4. Match Excel → DB
    const allStudents = [];
    for (const row of excelRows) {
      const nameInExcel = String(row["اسم الطالب"] || "").trim();
      if (!nameInExcel) continue;
      let matched = dbStudents.find(
        (s) => s.fullName.trim() === nameInExcel || s.fullName.includes(nameInExcel) || nameInExcel.includes(s.fullName)
      );
      if (!matched) {
        const parts = nameInExcel.split(" ");
        if (parts.length >= 2) {
          matched = dbStudents.find(
            (s) => s.fullName.includes(parts[0]) && s.fullName.includes(parts[parts.length - 1])
          );
        }
      }
      if (matched) allStudents.push(matched);
    }

    // 5. Check already sent
    const alreadySent = await prisma.whatsAppOutgoingMessage.findMany({
      where: {
        source: "SUMMER_PROGRESS_REPORT",
        createdAt: { gte: new Date("2026-08-03T00:00:00Z") },
      },
      select: { studentId: true },
    });
    const sentIds = new Set(alreadySent.map((m) => m.studentId).filter(Boolean));

    const remaining = allStudents.filter((s) => !sentIds.has(s.id));

    console.log(`\n=== SMART BROADCAST: ${remaining.length} remaining parents ===\n`);

    let sent = 0;
    let failed = 0;
    let skippedBadPhone = 0;
    let skippedBrokenLink = 0;
    const errors = [];

    for (let i = 0; i < remaining.length; i++) {
      const student = remaining[i];
      const evalData = gradeMap.get(student.id);
      const phone = normalizePhone(student.parentWhatsapp);
      const code = student.studentCode || student.id;

      console.log(`[${i + 1}/${remaining.length}] ${student.fullName} (${code})`);

      // Skip bad phone numbers
      if (!phone) {
        skippedBadPhone++;
        console.log(`  ⚠ SKIP: invalid phone "${student.parentWhatsapp}"`);
        errors.push(`رقم غير صحيح: ${student.fullName} (${student.parentWhatsapp})`);
        continue;
      }

      // Pre-verify link
      const linkOk = await verifyLink(code);
      if (!linkOk) {
        skippedBrokenLink++;
        console.log(`  ⚠ SKIP: broken link for ${code}`);
        errors.push(`رابط مكسور: ${student.fullName} (${code})`);
        continue;
      }

      const reportUrl = `${REPORT_BASE_URL}/${code}`;
      const finalScore = evalData ? evalData.finalScore : "";

      let msg = [
        "السلام عليكم ورحمة الله وبركاته 🌿",
        "",
        "يسر إدارة *تحفيظ الرحمة للقرآن الكريم* أن تشارككم تقرير إنجاز ابنكم في الدورة الصيفية 2026 - الفترة الأولى.",
        "",
        `📖 الطالب: *${student.fullName}*`,
        `الحلقة: ${student.circle?.name || "—"}`,
        ...(finalScore ? [`النتيجة النهائية: *${finalScore}%*`] : []),
        "",
        "نسأل الله أن يبارك فيه وأن يجعله من أهل القرآن وخاصته.",
        "",
        "يمكنكم مشاهدة التقرير التفاعلي من هنا:",
        reportUrl,
        "",
        "مع تحيات إدارة تحفيظ الرحمة",
      ].join("\n");

      msg = addVariation(msg);

      const success = await sendWhatsApp(phone, msg);

      if (success) {
        sent++;
        console.log(`  ✅ SENT to ${phone}`);

        // Record in DB
        await prisma.whatsAppOutgoingMessage.create({
          data: {
            channel: "ONSITE_SUMMER",
            toNumber: phone,
            body: msg,
            source: "SUMMER_PROGRESS_REPORT",
            category: "GENERAL",
            studentId: student.id,
          },
        });
      } else {
        failed++;
        console.log(`  ❌ FAILED to ${phone}`);
        errors.push(`فشل الإرسال: ${student.fullName} (${phone})`);
      }

      // Smart delay
      if (i < remaining.length - 1) {
        await smartDelay(sent);
      }
    }

    console.log("\n=== BROADCAST COMPLETE ===");
    console.log(`✅ Sent: ${sent}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠ Skipped (bad phone): ${skippedBadPhone}`);
    console.log(`⚠ Skipped (broken link): ${skippedBrokenLink}`);
    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((e) => console.log(`  - ${e}`));
    }

  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
