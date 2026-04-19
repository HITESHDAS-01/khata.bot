// 🔥 Firebase Initialization with STRICT error handling
let serviceAccount;

try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error("FIREBASE_KEY environment variable is missing");
  }
  
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  
  // ✅ Required fields check
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("FIREBASE_KEY missing required fields: project_id, private_key, client_email");
  }
  
  console.log("✅ Firebase config loaded for project:", serviceAccount.project_id);
  
} catch (e) {
  console.error("❌ CRITICAL: Firebase initialization failed:", e.message);
  console.error("💡 Render Dashboard → Environment → FIREBASE_KEY check karein");
  process.exit(1); // 🛑 App ko yahi rok do, invalid credentials se aage na badhe
}

// ✅ Initialize Firebase only if serviceAccount is valid
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
console.log("🔥 Firebase Admin initialized successfully");
