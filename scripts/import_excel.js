const XLSX = require('xlsx');

const filePath = 'C:\\Users\\amohm\\Downloads\\بيانات الطلاب والحلقات.xls';
const workbook = XLSX.readFile(filePath);

console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n=== SHEET: ${sheetName} ===`);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Total rows:', rows.length);
  rows.forEach((r, idx) => {
    if (r && r.length > 0) {
      console.log(`Row ${idx + 1}:`, JSON.stringify(r));
    }
  });
});
