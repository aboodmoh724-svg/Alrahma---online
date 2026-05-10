import "dotenv/config";
import { prisma } from "../lib/prisma";
import { normalizeInternationalPhone } from "../lib/phone-number";

type Fix = {
  model: string;
  id: string;
  name: string;
  field: string;
  before: string;
  after: string;
};

function clean(value: string | null | undefined) {
  const normalized = normalizeInternationalPhone(value || "");
  return normalized || null;
}

function collectFix(
  fixes: Fix[],
  model: string,
  id: string,
  name: string,
  field: string,
  before: string | null | undefined
) {
  const after = clean(before);
  const trimmedBefore = String(before || "").trim();

  if (!trimmedBefore || !after || trimmedBefore === after) return;

  fixes.push({
    model,
    id,
    name,
    field,
    before: trimmedBefore,
    after,
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const fixes: Fix[] = [];

  const [users, students, studentDetails, registrationRequests, parentCodes, conversations, incomingMessages, outgoingMessages] =
    await Promise.all([
      prisma.user.findMany({
        where: { whatsapp: { not: null } },
        select: { id: true, fullName: true, whatsapp: true },
      }),
      prisma.student.findMany({
        where: { parentWhatsapp: { not: null } },
        select: { id: true, fullName: true, parentWhatsapp: true },
      }),
      prisma.studentDetail.findMany({
        select: {
          id: true,
          matchedName: true,
          fatherPhone: true,
          motherPhone: true,
          guardianPhone: true,
        },
      }),
      prisma.registrationRequest.findMany({
        select: { id: true, studentName: true, parentWhatsapp: true },
      }),
      prisma.parentPortalCode.findMany({
        select: { id: true, phone: true },
      }),
      prisma.educationConversation.findMany({
        where: { parentPhone: { not: null } },
        select: { id: true, parentPhone: true },
      }),
      prisma.whatsAppIncomingMessage.findMany({
        select: { id: true, fromNumber: true },
      }),
      prisma.whatsAppOutgoingMessage.findMany({
        select: { id: true, toNumber: true },
      }),
    ]);

  for (const user of users) {
    collectFix(fixes, "User", user.id, user.fullName, "whatsapp", user.whatsapp);
  }

  for (const student of students) {
    collectFix(fixes, "Student", student.id, student.fullName, "parentWhatsapp", student.parentWhatsapp);
  }

  for (const detail of studentDetails) {
    collectFix(fixes, "StudentDetail", detail.id, detail.matchedName, "fatherPhone", detail.fatherPhone);
    collectFix(fixes, "StudentDetail", detail.id, detail.matchedName, "motherPhone", detail.motherPhone);
    collectFix(fixes, "StudentDetail", detail.id, detail.matchedName, "guardianPhone", detail.guardianPhone);
  }

  for (const request of registrationRequests) {
    collectFix(fixes, "RegistrationRequest", request.id, request.studentName, "parentWhatsapp", request.parentWhatsapp);
  }

  for (const code of parentCodes) {
    collectFix(fixes, "ParentPortalCode", code.id, code.id, "phone", code.phone);
  }

  for (const conversation of conversations) {
    collectFix(fixes, "EducationConversation", conversation.id, conversation.id, "parentPhone", conversation.parentPhone);
  }

  for (const message of incomingMessages) {
    collectFix(fixes, "WhatsAppIncomingMessage", message.id, message.id, "fromNumber", message.fromNumber);
  }

  for (const message of outgoingMessages) {
    collectFix(fixes, "WhatsAppOutgoingMessage", message.id, message.id, "toNumber", message.toNumber);
  }

  console.log(`Phone fixes found: ${fixes.length}`);
  for (const fix of fixes.slice(0, 80)) {
    console.log(`${fix.model}.${fix.field} ${fix.name}: ${fix.before} -> ${fix.after}`);
  }
  if (fixes.length > 80) {
    console.log(`...and ${fixes.length - 80} more`);
  }

  if (dryRun || fixes.length === 0) {
    console.log(dryRun ? "Dry run only. No rows were updated." : "No rows need updating.");
    return;
  }

  for (const fix of fixes) {
    if (fix.model === "User") {
      await prisma.user.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "Student") {
      await prisma.student.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "StudentDetail") {
      await prisma.studentDetail.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "RegistrationRequest") {
      await prisma.registrationRequest.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "ParentPortalCode") {
      await prisma.parentPortalCode.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "EducationConversation") {
      await prisma.educationConversation.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "WhatsAppIncomingMessage") {
      await prisma.whatsAppIncomingMessage.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    } else if (fix.model === "WhatsAppOutgoingMessage") {
      await prisma.whatsAppOutgoingMessage.update({ where: { id: fix.id }, data: { [fix.field]: fix.after } });
    }
  }

  console.log(`Updated rows: ${fixes.length}`);
}

main()
  .catch((error) => {
    console.error("NORMALIZE PHONE NUMBERS ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
