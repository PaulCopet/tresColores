import fs from "node:fs";
import admin from "firebase-admin";

type GlobalWithAdmin = typeof globalThis & { __adminApp?: admin.app.App };
const g = globalThis as GlobalWithAdmin;

function resolveAdminOptions(): admin.AppOptions {
  // Prioridad: BASE64 -> PATH -> variables sueltas
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (b64) {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    const projectId = json.project_id;
    if (!projectId) throw new Error("El service account en BASE64 no trae project_id.");
    // Aseguramos que Google SDK “vea” el proyecto
    process.env.GOOGLE_CLOUD_PROJECT = projectId;
    return { credential: admin.credential.cert(json), projectId };
  }

  if (path && fs.existsSync(path)) {
    const json = JSON.parse(fs.readFileSync(path, "utf8"));
    const projectId = json.project_id;
    if (!projectId) throw new Error("El JSON en FIREBASE_SERVICE_ACCOUNT_PATH no trae project_id.");
    process.env.GOOGLE_CLOUD_PROJECT = projectId;
    return { credential: admin.credential.cert(json), projectId };
  }

  // Variables sueltas
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    process.env.GOOGLE_CLOUD_PROJECT = projectId;
    return {
      credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
      projectId,
    };
  }

  throw new Error(
    "No hay credenciales. Define FIREBASE_SERVICE_ACCOUNT_BASE64 (recomendado) o FIREBASE_SERVICE_ACCOUNT_PATH, o bien FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY."
  );
}

function getApp() {
  if (g.__adminApp) return g.__adminApp;
  if (admin.apps.length) {
    g.__adminApp = admin.app();
    return g.__adminApp;
  }
  const options = resolveAdminOptions();
  g.__adminApp = admin.initializeApp(options); // <-- pasamos projectId
  console.log("[firebaseAdmin] init project:", options.projectId);
  return g.__adminApp;
}

export function getFirestore() {
  return getApp().firestore();
}
