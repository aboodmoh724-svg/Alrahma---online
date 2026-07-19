import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

async function main() {
  const jsonPath = path.join(__dirname, 'pending-images.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Pending JSON file not found at: ${jsonPath}`);
    return;
  }

  const reports = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Starting screenshot generation for ${reports.length} reports...`);

  const outputDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 2000, deviceScaleFactor: 2 }); // Scale factor 2 for crisp High-DPI screenshot

  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    const url = `https://alrahmakuran.site/onsite/admin/annual-reports/${r.id}/card`;
    const filename = r.reportImageFilename || `${r.id}.png`;
    const destPath = path.join(outputDir, filename);

    console.log(`[${i + 1}/${reports.length}] Rendering ${r.studentName} (${r.id})...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Inject CSS to hide admin print buttons and navigation panel
      await page.addStyleTag({ content: '.no-print { display: none !important; }' });

      // Wait a moment for webfonts (El Messiri, Amiri, IBM Plex Sans Arabic) to render completely
      await new Promise(resolve => setTimeout(resolve, 2500));

      const card = await page.$('.print-card');
      if (card) {
        await card.screenshot({ path: destPath });
        console.log(`  Saved screenshot to ${destPath} (${fs.statSync(destPath).size} bytes)`);
      } else {
        console.error(`  ❌ Error: Element .print-card not found on page for ${r.studentName}`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to render ${r.studentName}:`, err);
    }
  }

  await browser.close();
  console.log('\nFinished all screenshot generation!');
}

main().catch(console.error);
