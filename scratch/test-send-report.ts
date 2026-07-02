import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from "../lib/prisma";
import { sendWhatsAppDocument, normalizeWhatsAppNumber } from "../lib/whatsapp";
import { annualReportCaption, annualReportPublicUrl } from "../lib/annual-reports";

async function main() {
  const targetPhone = "+905525397886";
  const normalizedPhone = normalizeWhatsAppNumber(targetPhone, "90");
  
  if (!normalizedPhone) {
    console.error(`Invalid phone number: ${targetPhone}`);
    return;
  }

  // Find the report for "أسيد أبوحشيش"
  const report = await prisma.annualReport.findFirst({
    where: {
      studentName: {
        contains: "أسيد أبوحشيش"
      }
    }
  });

  if (!report) {
    console.error("Could not find a report for أسيد أبوحشيش");
    return;
  }

  console.log(`Found report for ${report.studentName}`);
  console.log(`ImagePath in DB: ${report.reportImagePath}`);

  const documentUrl = annualReportPublicUrl(report.reportImagePath);
  if (!documentUrl) {
    console.error("Report has no valid public document URL!");
    return;
  }

  const caption = annualReportCaption({
    studentName: report.studentName,
    academicYear: report.academicYear
  });

  console.log(`Sending WhatsApp Document to: ${normalizedPhone}`);
  console.log(`Document URL: ${documentUrl}`);
  console.log(`Caption:\n${caption}\n`);

  try {
    const result = await sendWhatsAppDocument({
      to: normalizedPhone,
      documentUrl,
      fileName: report.reportImageFilename || `${report.studentKey}.png`,
      caption,
      channel: "ONSITE"
    });

    console.log("Send result:", result);
    console.log("🚀 Test send triggered successfully!");
  } catch (err) {
    console.error("❌ Error sending document:", err);
  }
}

main().then(() => prisma.$disconnect()).catch(console.error);
