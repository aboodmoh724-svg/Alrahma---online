require("dotenv").config();

const cors = require("cors");
const express = require("express");
const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const port = Number(process.env.PORT || 3333);
const apiToken = String(process.env.API_TOKEN || "").trim();
const allowedOrigin = String(process.env.ALLOWED_ORIGIN || "*").trim() || "*";

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
    clientId: "alrahma-main",
    dataPath: ".wwebjs_auth",
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

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "alrahma-whatsapp-webjs-server",
    ready: clientReady,
    lastQrAt,
    lastReadyAt,
  });
});

app.get("/status", (_req, res) => {
  res.json({
    success: true,
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

    const to = normalizePhone(req.body.to || req.body.phone || req.body.number);
    const message = String(req.body.message || req.body.body || "").trim();

    if (!to) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing 'to' phone number.",
      });
      return;
    }

    if (!message) {
      res.status(400).json({
        success: false,
        error: "Missing 'message'.",
      });
      return;
    }

    const chatId = `${to}@c.us`;
    const result = await client.sendMessage(chatId, message);

    res.json({
      success: true,
      to,
      messageId: result.id?._serialized || null,
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
