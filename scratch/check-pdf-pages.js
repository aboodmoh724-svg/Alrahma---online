const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/quran/last_tenth.pdf');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath);
  // Find "/Count" in the PDF to get page count
  const countRegex = /\/Count\s+(\d+)/g;
  let match;
  const counts = [];
  while ((match = countRegex.exec(content.toString('ascii', 0, 500000))) !== null) {
    counts.push(parseInt(match[1]));
  }
  console.log('Found /Count tags:', counts);
  
  // Let's also check the first 2000 chars of the PDF to see if there's any header info
  console.log('PDF Header:', content.slice(0, 1000).toString('ascii'));
} else {
  console.log('File does not exist');
}
