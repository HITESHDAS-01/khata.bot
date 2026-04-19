import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "mytoken";
const ACCESS_TOKEN = "EAAc4EIWF2X0BRL8KuSmDiv9Nd6OKp0ICw9Ei5slOzpgBYujh3EGkIDTvY6FdiLVCc57fa3TyTSZBFI4NuZBHO8yC9ZADD3OM7TUaJ4xBIJRlRGGbZCUOcNPligvwL5qiTdumpSDStK0lqnhTQpCT3s7t4RYFXZB5ZBsC3OlStunsgBECw8Pi40SommQqAPXXppZBmnlrarpIjehZAyaAJymchIgp87CsTXjESzs62mzZAl9MPqqEEGSV24TE4YWxlZAHQZC0gH0sonQFW5m0cIeZB9OmtPUC";
const PHONE_NUMBER_ID = "1067373776458883";

// 🔥 JSON file read karo (safe method)
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

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
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const text = msg.text?.body;

    if (text) {
      let parts = text.split(" ");
      let category = parts[0] || "unknown";
      let amount = parts[1] || "0";

      // 🔥 Firebase save
      await db.collection("expenses").add({
        user: from,
        category: category,
        amount: Number(amount),
        date: new Date(),
      });

      let reply = `Saved: ${category} ₹${amount} ✅`;

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
