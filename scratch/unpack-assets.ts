import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

async function main() {
  const htmlPath = path.join(__dirname, '../تقرير الرحمة - Canva.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Find manifest JSON block
  const manifestMatch = htmlContent.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
  if (!manifestMatch) {
    console.error('No manifest found!');
    return;
  }

  const manifest = JSON.parse(manifestMatch[1].trim());
  const outputDir = path.join(__dirname, 'unpacked');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  console.log(`Unpacking ${Object.keys(manifest).length} assets...`);

  for (const [uuid, entry] of Object.entries<any>(manifest)) {
    const buffer = Buffer.from(entry.data, 'base64');
    let finalBuffer = buffer;

    if (entry.compressed) {
      try {
        finalBuffer = zlib.gunzipSync(buffer);
      } catch (err) {
        console.error(`Failed to decompress ${uuid}:`, err);
        continue;
      }
    }

    const ext = entry.mime.split('/')[1] || 'bin';
    const filePath = path.join(outputDir, `${uuid}.${ext}`);
    fs.writeFileSync(filePath, finalBuffer);
    console.log(`Saved ${filePath} (${finalBuffer.length} bytes, MIME: ${entry.mime})`);
  }
}

main().catch(console.error);
