const fs = require('fs');
const path = require('path');

function findLoginPages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        findLoginPages(fullPath);
      }
    } else if (file === 'page.tsx' && dir.endsWith('login')) {
      console.log(`Login page found: ${fullPath}`);
    }
  }
}

findLoginPages('app');
