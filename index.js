import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "mytoken";
const ACCESS_TOKEN = "EAAc4EIWF2X0BRPfLHNvTyLxZCQFvjhftWYh8u9XjuphrYeMZB7cheNi5kpN1Y7josiOyv49TFTQ2vZCRJBqfLuAhZAFain0qCaGgwS50dD6D6eigPcrZABYmZBOMcNZADaqmjwcaR3wFAfPPZBOvoZCGZAIq5d7QTMEICtSuTPuFA08v9PXtXDzZCKn3mxoY3cxoQGonCZC5egAXmJPzI3UlyY3C5xY4ZBphb5qxWjkPPvB5aCQ9csTPlLy6lPk0WhDgBaiN6uCS6Me11ll7hwrGRXMrWqH6r";
const PHONE_NUMBER_ID = "1067373776458883";

// 🔥 Secure Firebase (Render ENV se)
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔹 Webhook verify
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
    console.log("Error:", error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log("🚀 Bot running"));
