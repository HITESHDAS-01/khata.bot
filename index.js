import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "mytoken";
const ACCESS_TOKEN = "EAAc4EIWF2X0BRL8KuSmDiv9Nd6OKp0ICw9Ei5slOzpgBYujh3EGkIDTvY6FdiLVCc57fa3TyTSZBFI4NuZBHO8yC9ZADD3OM7TUaJ4xBIJRlRGGbZCUOcNPligvwL5qiTdumpSDStK0lqnhTQpCT3s7t4RYFXZB5ZBsC3OlStunsgBECw8Pi40SommQqAPXXppZBmnlrarpIjehZAyaAJymchIgp87CsTXjESzs62mzZAl9MPqqEEGSV24TE4YWxlZAHQZC0gH0sonQFW5m0cIeZB9OmtPUC";
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
