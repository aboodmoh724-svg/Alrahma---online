const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        search(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (['.tsx', '.ts', '.js', '.html'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes('cloud')) {
          console.log(`Found in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes('cloud')) {
              console.log(`  Line ${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

search('app');
search('components');
search('lib');
