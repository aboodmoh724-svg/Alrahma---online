# Alrahma WhatsApp Web.js Server

خدمة مستقلة صغيرة تعمل كجسر بين موقع منصة الرحمة وواتساب عبر `whatsapp-web.js`.

الخدمة توفر:

- تسجيل دخول عبر QR.
- حفظ session داخل مجلد `.wwebjs_auth`.
- endpoint لإرسال الرسائل: `POST /send-message`.
- token اختياري للحماية.
- response واضح عند النجاح أو الخطأ.

## التشغيل محلياً

من داخل مجلد الخدمة:

```powershell
cd C:\Users\amohm\alrahma-reports\whatsapp-webjs-server
copy .env.example .env
npm install
npm start
```

سيظهر QR في التيرمنال. افتح واتساب من الجوال:

`Linked devices` ثم `Link a device` ثم امسح QR.

بعد ظهور:

```text
WhatsApp client is ready.
```

اختبر الإرسال:

```powershell
$body = @{
  to = "905xxxxxxxxx"
  message = "رسالة اختبار من منصة الرحمة"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3333/send-message" -ContentType "application/json" -Body $body
```

## ربطه مع الموقع

في متغيرات بيئة موقع Next.js ضع:

```env
WHATSAPP_WEBJS_API_URL="http://YOUR_SERVER:3333/send-message"
```

إذا وضعت `API_TOKEN` في سيرفر واتساب، ضع نفس القيمة في موقع Next.js:

```env
WHATSAPP_WEBJS_API_TOKEN="your-secret-token"
```

مهم: إذا كان الموقع منشوراً على Vercel، لا يصلح استخدام:

```env
WHATSAPP_WEBJS_API_URL="http://127.0.0.1:3333/send-message"
```

لأن `127.0.0.1` بالنسبة إلى Vercel يعني سيرفر Vercel، وليس جهازك. يجب أن يكون الرابط عاماً، مثل VPS أو ngrok.

## تشغيله على VPS

على Ubuntu VPS:

```bash
sudo apt update
sudo apt install -y nodejs npm chromium-browser
cd /opt
sudo mkdir alrahma-whatsapp
sudo chown $USER:$USER alrahma-whatsapp
cd alrahma-whatsapp
```

ارفع ملفات هذا المجلد إلى:

```text
/opt/alrahma-whatsapp
```

ثم:

```bash
npm install
cp .env.example .env
nano .env
```

ضع مثلاً:

```env
PORT=3333
API_TOKEN=ضع_توكن_سري_هنا
ALLOWED_ORIGIN=https://alrahma-reports.vercel.app
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

شغله أول مرة حتى تمسح QR:

```bash
npm start
```

بعد نجاح الربط، يفضل تشغيله بـ `pm2`:

```bash
sudo npm install -g pm2
pm2 start server.js --name alrahma-whatsapp
pm2 save
pm2 startup
```

افتح البورت في الجدار الناري إذا لزم:

```bash
sudo ufw allow 3333/tcp
```

ثم اجعل متغير الموقع:

```env
WHATSAPP_WEBJS_API_URL="http://YOUR_VPS_IP:3333/send-message"
WHATSAPP_WEBJS_API_TOKEN="نفس_API_TOKEN"
```

الأفضل لاحقاً وضعه خلف Nginx و HTTPS.

## استخدام ngrok مؤقتاً

إذا السيرفر يعمل محلياً على جهازك:

```powershell
cd C:\Users\amohm\alrahma-reports\whatsapp-webjs-server
npm start
```

في نافذة ثانية:

```powershell
ngrok http 3333
```

سيعطيك رابطاً مثل:

```text
https://abc-123.ngrok-free.app
```

ضع في Vercel:

```env
WHATSAPP_WEBJS_API_URL="https://abc-123.ngrok-free.app/send-message"
WHATSAPP_WEBJS_API_TOKEN="نفس_API_TOKEN_إن_وجد"
```

ملاحظة: رابط ngrok المجاني يتغير غالباً عند إعادة تشغيله، لذلك هو مناسب للتجربة فقط.

## شكل الطلب

```json
{
  "to": "905xxxxxxxxx",
  "message": "نص الرسالة"
}
```

مع token:

```http
Authorization: Bearer your-secret-token
```

## شكل الرد

نجاح:

```json
{
  "success": true,
  "to": "905xxxxxxxxx",
  "messageId": "...",
  "timestamp": "2026-04-23T..."
}
```

خطأ:

```json
{
  "success": false,
  "error": "WhatsApp client is not ready. Scan QR first or wait for reconnect."
}
```
