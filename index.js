import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

// 🔐 ENV VARIABLES use karo (secure way)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// 🔥 Firebase ENV se load
let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
} catch (e) {
  console.error("❌ FIREBASE_KEY parse error:", e);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ Health check (important for Render)
app.get("/", (req, res) => {
  res.send("Bot is running ✅");
});

// 🔹 Webhook verify
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// 🔹 Receive messages
app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const text = msg.text?.body;

    if (text) {
      let parts = text.trim().split(" ");
      let category = parts[0] || "unknown";
      let amount = parseInt(parts[1]) || 0;

      // 🔥 Firebase save
      await db.collection("expenses").add({
        user: from,
        category: category,
        amount: amount,
        date: new Date(),
      });

      let reply = `Saved: ${category} ₹${amount} ✅`;

      // 🔹 WhatsApp reply
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

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.sendStatus(500);
  }
});

// 🔥 PORT fix (Render ke liye important)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot running on ${PORT}`));
