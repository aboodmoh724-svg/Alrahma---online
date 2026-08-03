const { generateStudentProgressReportMedia } = require("../lib/student-progress-report-pdf");

async function run() {
  console.log("Generating PDF and PNG for student 7501...");
  const pdfRes = await generateStudentProgressReportMedia("7501", "pdf");
  console.log("PDF Result:", pdfRes);

  const pngRes = await generateStudentProgressReportMedia("7501", "png");
  console.log("PNG Result:", pngRes);
}

run();
