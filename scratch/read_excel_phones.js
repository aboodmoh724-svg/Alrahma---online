const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "../docs/بيانات الطلاب والدرجات.xlsx");
const workbook = XLSX.readFile(filePath);

console.log("Sheet Names:", workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n=================== SHEET: ${sheetName} ===================`);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`Total Rows: ${rows.length}`);
  if (rows.length > 0) {
    console.log("Columns:", Object.keys(rows[0]));
    console.log("First 5 rows:", JSON.stringify(rows.slice(0, 5), null, 2));
  }
});
