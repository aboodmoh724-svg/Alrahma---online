const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../تقارير التحفيظ سنة 2026 - الورقة1.csv');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log('Total lines:', lines.length);
  console.log('Header line:', lines[0]);
  console.log('First 5 data lines:');
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    console.log(`Line ${i}:`, lines[i]);
  }
} else {
  console.log('File does not exist at:', filePath);
}
