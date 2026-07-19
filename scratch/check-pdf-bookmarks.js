const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/quran/last_tenth.pdf');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath);
  const text = content.toString('ascii');
  
  // Find Outlines
  // Let's search for objects with /Title
  const titleRegex = /\/Title\s*\(([^)]+)\)/g;
  let match;
  const titles = [];
  while ((match = titleRegex.exec(text)) !== null && titles.length < 50) {
    titles.push(match[1]);
  }
  console.log('PDF Title tags:', titles);

  // Let's search for /Title <...> (hexadecimal title strings)
  const hexTitleRegex = /\/Title\s*<([^>]+)>/g;
  while ((match = hexTitleRegex.exec(text)) !== null && titles.length < 100) {
    // decode UTF-16BE hex string to normal string if possible
    const hex = match[1];
    let decoded = '';
    if (hex.startsWith('FEFF') || hex.startsWith('feff')) {
      for (let i = 4; i < hex.length; i += 4) {
        const charCode = parseInt(hex.substring(i, i + 4), 16);
        decoded += String.fromCharCode(charCode);
      }
    } else {
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
    }
    titles.push(decoded);
  }
  console.log('Decoded Titles:', titles.filter(t => t.trim().length > 0));
} else {
  console.log('File does not exist');
}
