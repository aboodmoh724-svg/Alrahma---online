require("dotenv").config();

const cors = require("cors");
const express = require("express");
const QRCode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();
const port = Number(process.env.PORT || 3001);
const apiToken = String(process.env.API_TOKEN || "").trim();
const allowedOrigin = String(process.env.ALLOWED_ORIGIN || "*").trim() || "*";
const serviceName = String(process.env.WHATSAPP_SERVICE_NAME || "alrahma-whatsapp-server").trim();
const clientId = String(process.env.WHATSAPP_CLIENT_ID || "alrahma-main").trim();
const authDataPath = String(process.env.WHATSAPP_AUTH_DATA_PATH || ".wwebjs_auth").trim();

let ready = false;
let currentQr = null;

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
  })
);

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
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

const client = new Client({
  authStrategy: new LocalAuth({
    clientId,
    dataPath: authDataPath,
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  ready = false;
  currentQr = qr;
  qrcodeTerminal.generate(qr, { small: true });
  console.log("QR refreshed. Open /qr.png to scan.");
});

client.on("ready", () => {
  ready = true;
  currentQr = null;
  console.log("WhatsApp client is ready.");
});

client.on("authenticated", () => {
  console.log("WhatsApp authenticated. Session preserved.");
});

client.on("auth_failure", (message) => {
  ready = false;
  console.error("WhatsApp auth failure:", message);
});

client.on("disconnected", (reason) => {
  ready = false;
  console.warn("WhatsApp disconnected:", reason);
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: serviceName,
    clientId,
    ready,
  });
});

app.get("/qr.png", async (_req, res) => {
  try {
    if (!currentQr) {
      res.status(404).json({
        success: false,
        error: "QR is not available right now.",
      });
      return;
    }

    const buffer = await QRCode.toBuffer(currentQr, {
      type: "png",
      width: 420,
      margin: 2,
    });

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("QR PNG ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to render QR image.",
    });
  }
});

app.post("/send-message", requireToken, async (req, res) => {
  try {
    if (!ready) {
      res.status(503).json({
        success: false,
        error: "WhatsApp client is not ready.",
      });
      return;
    }

    const phone = normalizePhone(req.body.phone);
    const message = String(req.body.message || "").trim();

    if (!phone) {
      res.status(400).json({
        success: false,
        error: "Invalid or missing phone.",
      });
      return;
    }

    if (!message) {
      res.status(400).json({
        success: false,
        error: "Missing message.",
      });
      return;
    }

    const chatId = `${phone}@c.us`;
    const result = await client.sendMessage(chatId, message);

    res.json({
      success: true,
      phone,
      messageId: result.id?._serialized || null,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message.",
    });
  }
});

async function start() {
  app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
    console.log(`clientId: ${clientId}`);
    console.log(`authPath: ${authDataPath}`);
  });

  await client.initialize();
}

process.on("SIGINT", async () => {
  await client.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await client.destroy();
  process.exit(0);
});

start().catch((error) => {
  console.error("STARTUP ERROR:", error);
  process.exit(1);
});
