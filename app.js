const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  console.log('\nWebhook received:\n');
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.post("/send", async (req, res) => {
  try {
    const to = String(req.body?.to || "").replace(/\D/g, "");
    const text = String(req.body?.text || "").trim();
    if (!to || !text) return res.status(400).json({ ok:false, error:"missing to/text" });

    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text }
      })
    });

    const data = await r.json().catch(() => ({}));
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok, data });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
});
