// index.js - Firebase + WhatsApp Bot (Render Compatible)
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import admin from "firebase-admin";

const app = express();
app.use(bodyParser.json());

// 🔐 ENV VARIABLES
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// 🔥 Firebase Initialization - ONLY via ENV (NO FILE READ)
let serviceAccount;

try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error("FIREBASE_KEY environment variable is missing");
  }
  
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("FIREBASE_KEY missing required fields");
  }
  
  console.log("✅ Firebase config loaded for project:", serviceAccount.project_id);
  
} catch (e) {
  console.error("❌ CRITICAL: Firebase init failed:", e.message);
  process.exit(1); // 🛑 Stop app if credentials invalid
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
console.log("🔥 Firebase Admin initialized");

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Bot is running ✅");
});

// 🔹 Webhook verify (GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 🔹 Receive messages (POST)
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

      // 🔥 Save to Firestore
      await db.collection("expenses").add({
        user: from,
        category: category,
        amount: amount,
        date: new Date(),
      });

      let reply = `Saved: ${category} ₹${amount} ✅`;

      // 🔹 Send WhatsApp reply
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

// 🔥 PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot running on port ${PORT}`));
