import * as fs from 'fs';
import * as path from 'path';

const filePath = 'C:/Users/amohm/.gemini/antigravity/brain/d1ed6b66-ea5d-4cf2-bdb1-544d31a9ea0d/analysis_results.md';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('حجازي') || l.includes('حمامو')) {
      console.log(`Line ${idx + 1}: ${l}`);
    }
  });
} else {
  console.log('File does not exist');
}
