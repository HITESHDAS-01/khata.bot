import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "mytoken";

// 🔑 Yahan apna NEW token daalo
const ACCESS_TOKEN = "EAAc4EIWF2X0BRLl2ZBWrpgO6oLzVtKr1oo7CZB8Dqouxm6CdYyJtWIr9KiJKJRU30cCC22RwPQuUnZCbHOa26tYU9yIPpBTCsQhk9Dxelk8l456ZCJhlmjCuKZCmkWxMZB31hcX0ERiV1fxOA6yQNGQZAgRZC8OsIS9P3yCldY1UKyUICcAfUNRUPDyKZBp2HZBx6HpXCZC24ISEIWmNsZCWs2nmlBq30H1sQWQKNR4KJ0sna4EVZAEIjvLv0C2rC2ZAqFDu7P1qlHkbCUCOnWsZApHRMx31A59";

// 📱 Yahan already tumhara ID hai
const PHONE_NUMBER_ID = "1067373776458883";

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!msg) return res.sendStatus(200);

  const from = msg.from;
  const text = msg.text?.body;

  if (text) {
    let parts = text.split(" ");
    let category = parts[0];
    let amount = parts[1];

    let reply = `Saved: ${category} ₹${amount}`;

    await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply },
      }),
    });
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Server running"));
