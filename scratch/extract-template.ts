import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const htmlPath = path.join(__dirname, '../تقرير الرحمة - Canva.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Find template JSON block
  const templateMatch = htmlContent.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/);
  if (!templateMatch) {
    console.error('No template found!');
    return;
  }

  const templateJson = JSON.parse(templateMatch[1].trim());
  
  // Save template to template.html
  const outputPath = path.join(__dirname, 'template.html');
  fs.writeFileSync(outputPath, templateJson);
  console.log(`Saved template HTML to ${outputPath} (${templateJson.length} bytes)`);
}

main().catch(console.error);
