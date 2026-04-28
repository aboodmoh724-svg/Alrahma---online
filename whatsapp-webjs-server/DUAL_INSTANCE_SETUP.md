# Dual WhatsApp Setup

Use the same `server.js` twice on the same VPS, once for `REMOTE` and once for `ONSITE`.

## Remote instance

Example environment:

```env
PORT=3333
API_TOKEN=your-shared-or-remote-token
ALLOWED_ORIGIN=https://alrahma-reports.vercel.app
WHATSAPP_SERVICE_NAME=alrahma-remote
WHATSAPP_CLIENT_ID=alrahma-remote
WHATSAPP_AUTH_DATA_PATH=.wwebjs_auth_remote
```

## Onsite instance

Example environment:

```env
PORT=3334
API_TOKEN=your-shared-or-onsite-token
ALLOWED_ORIGIN=https://alrahma-reports.vercel.app
WHATSAPP_SERVICE_NAME=alrahma-onsite
WHATSAPP_CLIENT_ID=alrahma-onsite
WHATSAPP_AUTH_DATA_PATH=.wwebjs_auth_onsite
```

## Project env vars

Add these env vars to the main app:

```env
WHATSAPP_WEBJS_API_URL_REMOTE=http://YOUR_SERVER_IP:3333/send-message
WHATSAPP_WEBJS_API_TOKEN_REMOTE=your-shared-or-remote-token

WHATSAPP_WEBJS_API_URL_ONSITE=http://YOUR_SERVER_IP:3334/send-message
WHATSAPP_WEBJS_API_TOKEN_ONSITE=your-shared-or-onsite-token
```

Optional fallback:

```env
WHATSAPP_WEBJS_API_URL=http://YOUR_SERVER_IP:3333/send-message
WHATSAPP_WEBJS_API_TOKEN=your-shared-or-remote-token
```

## Result

- `REMOTE` messages go to the remote WhatsApp instance
- `ONSITE` messages go to the onsite WhatsApp instance
- both run on the same server with separate sessions
