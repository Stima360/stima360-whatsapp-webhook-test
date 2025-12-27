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
    const p1 = String(req.body?.p1 || "").trim();
    const p2 = String(req.body?.p2 || "").trim();
    const p3 = String(req.body?.p3 || "").trim();
    const p4 = String(req.body?.p4 || "").trim();

    if (!to || !p1 || !p2 || !p3 || !p4) {
      return res.status(400).json({ ok:false, error:"missing to/p1/p2/p3/p4" });
    }

    const templateName = process.env.TEMPLATE_NAME;   // es: "stima_pronta"
    const templateLang = process.env.TEMPLATE_LANG || "it_IT";

    if (!templateName) {
      return res.status(500).json({ ok:false, error:"missing TEMPLATE_NAME env" });
    }

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
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: p1 },
                { type: "text", text: p2 },
                { type: "text", text: p3 },
                { type: "text", text: p4 }
              ]
            }
          ]
        }
      })
    });

    const data = await r.json().catch(() => ({}));
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok, data });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
});
