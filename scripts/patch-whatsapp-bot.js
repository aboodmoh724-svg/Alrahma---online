const fs = require("fs");
const path = require("path");

const dirs = [
  "/root/whatsapp-bot",
  "/root/whatsapp-bot-onsite",
  "/root/whatsapp-bot-syria",
];

for (const dir of dirs) {
  const filePath = path.join(dir, "index.js");
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  let code = fs.readFileSync(filePath, "utf8");

  if (!code.includes("MessageMedia")) {
    code = code.replace(
      'const { Client, LocalAuth } = require("whatsapp-web.js");',
      'const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");'
    );
  }

  const oldRoutePart = `const message = String(req.body.message || "").trim();`;

  if (code.includes(oldRoutePart)) {
    code = code.replace(
      `const message = String(req.body.message || "").trim();`,
      `const messageText = String(req.body.message || req.body.body || "").trim();
    const documentUrl = String(req.body.documentUrl || "").trim();
    const fileName = String(req.body.fileName || "document.pdf").trim();
    const caption = String(req.body.caption || messageText || "").trim();`
    );

    code = code.replace(
      `    if (!message) {
      res.status(400).json({
        success: false,
        error: "Missing message.",
      });
      return;
    }`,
      `    if (!messageText && !documentUrl) {
      res.status(400).json({
        success: false,
        error: "Missing message or documentUrl.",
      });
      return;
    }`
    );

    code = code.replace(
      `const result = await client.sendMessage(chatId, message);`,
      `let result;
    if (documentUrl) {
      const media = await MessageMedia.fromUrl(documentUrl, { unsafeMime: true, filename: fileName });
      result = await client.sendMessage(chatId, media, { caption: caption || undefined });
    } else {
      result = await client.sendMessage(chatId, messageText);
    }`
    );

    fs.writeFileSync(filePath, code, "utf8");
    console.log(`Successfully patched ${filePath}`);
  } else {
    console.log(`Already patched or snippet mismatch in ${filePath}`);
  }
}
