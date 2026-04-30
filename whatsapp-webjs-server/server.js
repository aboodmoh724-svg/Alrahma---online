require("dotenv").config();

const cors = require("cors");
const express = require("express");
const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");

const app = express();
const port = Number(process.env.PORT || 3333);
const apiToken = String(process.env.API_TOKEN || "").trim();
const allowedOrigin = String(process.env.ALLOWED_ORIGIN || "*").trim() || "*";
const serviceName = String(process.env.WHATSAPP_SERVICE_NAME || "alrahma-whatsapp-webjs-server").trim();
const clientId = String(process.env.WHATSAPP_CLIENT_ID || "alrahma-main").trim();
const authDataPath = String(process.env.WHATSAPP_AUTH_DATA_PATH || ".wwebjs_auth").trim();
const incomingWebhookUrl = String(process.env.APP_INCOMING_WHATSAPP_WEBHOOK_URL || "").trim();
const incomingWebhookToken = String(process.env.APP_INCOMING_WHATSAPP_WEBHOOK_TOKEN || "").trim();
const whatsappChannel = String(process.env.WHATSAPP_CHANNEL || "REMOTE").trim().toUpperCase() === "ONSITE"
  ? "ONSITE"
  : "REMOTE";

let clientReady = false;
let lastQrAt = null;
let lastReadyAt = null;

const windowsChromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

const chromePath =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  windowsChromePaths.find((candidatePath) => fs.existsSync(candidatePath));

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
  })
);

const client = new Client({
  authStrategy: new LocalAuth({
    clientId,
    dataPath: authDataPath,
  }),
  puppeteer: {
    headless: false,
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");

  if (digits.length < 8) {
    return null;
  }

  return digits;
}

function requireToken(req, res, next) {
  if (!apiToken) {
    next();
    return;
  }

  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (token !== apiToken) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
    return;
  }

  next();
}

client.on("qr", (qr) => {
  clientReady = false;
  lastQrAt = new Date();

  console.log("\nScan this QR code with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  clientReady = true;
  lastReadyAt = new Date();
  console.log("WhatsApp client is ready.");
});

client.on("authenticated", () => {
  console.log("WhatsApp authenticated. Session saved.");
});

client.on("auth_failure", (message) => {
  clientReady = false;
  console.error("WhatsApp authentication failed:", message);
});

client.on("disconnected", (reason) => {
  clientReady = false;
  console.warn("WhatsApp disconnected:", reason);
});

async function forwardIncomingMessage(message) {
  if (!incomingWebhookUrl || message.fromMe || String(message.from || "").includes("@g.us")) {
    return;
  }

  let contactNumber = "";
  try {
    const contact = await message.getContact();
    contactNumber = normalizePhone(contact?.number || "");
  } catch (error) {
    console.error("INCOMING CONTACT LOOKUP ERROR:", error);
  }

  const payload = {
    messageId: message.id?._serialized || null,
    from: contactNumber ? `${contactNumber}@c.us` : message.from,
    fromId: message.from,
    body: message.body || "",
    timestamp: message.timestamp || null,
    channel: whatsappChannel,
    hasMedia: Boolean(message.hasMedia),
  };

  try {
    const response = await fetch(incomingWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(incomingWebhookToken ? { Authorization: `Bearer ${incomingWebhookToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("INCOMING WEBHOOK ERROR:", response.status, text);
    }
  } catch (error) {
    console.error("FORWARD INCOMING MESSAGE ERROR:", error);
  }
}

client.on("message", forwardIncomingMessage);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: serviceName,
    clientId,
    channel: whatsappChannel,
    incomingWebhookEnabled: Boolean(incomingWebhookUrl),
    ready: clientReady,
    lastQrAt,
    lastReadyAt,
  });
});

app.get("/status", (_req, res) => {
  res.json({
    success: true,
    service: serviceName,
    clientId,
    channel: whatsappChannel,
    incomingWebhookEnabled: Boolean(incomingWebhookUrl),
    ready: clientReady,
    lastQrAt,
    lastReadyAt,
  });
});

app.post("/send-message", requireToken, async (req, res) => {
  try {
    if (!clientReady) {
      res.status(503).json({
        success: false,
        error: "WhatsApp client is not ready. Scan QR first or wait for reconnect.",
      });
      return;
    }

    const directChatId = String(req.body.chatId || "").trim();
    const to = normalizePhone(req.body.to || req.body.phone || req.body.number);
    const message = String(req.body.message || req.body.body || "").trim();
    const documentUrl = String(req.body.documentUrl || "").trim();
    const fileName = String(req.body.fileName || "").trim();
    const caption = String(req.body.caption || message || "").trim();

    if (!to && !directChatId) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing 'to' phone number/chatId.",
      });
      return;
    }

    if (!message && !documentUrl) {
      res.status(400).json({
        success: false,
        error: "Missing 'message' or 'documentUrl'.",
      });
      return;
    }

    const chatId = directChatId || `${to}@c.us`;
    let result;

    if (documentUrl) {
      const media = await MessageMedia.fromUrl(documentUrl, {
        unsafeMime: true,
        filename: fileName || undefined,
      });

      result = await client.sendMessage(chatId, media, {
        sendMediaAsDocument: true,
        caption: caption || undefined,
      });
    } else {
      result = await client.sendMessage(chatId, message);
    }

    res.json({
      success: true,
      to: to || null,
      chatId,
      messageId: result.id?._serialized || null,
      sentDocument: Boolean(documentUrl),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send WhatsApp message.",
    });
  }
});

async function start() {
  app.listen(port, () => {
    console.log(`WhatsApp bridge listening on http://localhost:${port}`);
    console.log(`Service name: ${serviceName}`);
    console.log(`Client ID: ${clientId}`);
    console.log(`Auth path: ${authDataPath}`);
    console.log("Waiting for WhatsApp client...");
  });

  await client.initialize();
}

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await client.destroy();
  process.exit(0);
});

start().catch((error) => {
  console.error("STARTUP ERROR:", error);
  process.exit(1);
});
