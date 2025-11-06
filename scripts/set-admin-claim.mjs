import admin from 'firebase-admin';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function fromBase64OrClassic() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  const projectId = requireEnv('FIREBASE_PROJECT_ID');
  const clientEmail = requireEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

async function main() {
  const email = process.argv[2];
  const role = process.argv[3] || 'admin';
  if (!email) throw new Error('Usage: node scripts/set-admin-claim.mjs user@email role(admin|usuario)');
  const sa = fromBase64OrClassic();
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  const auth = admin.auth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role });
  console.log(`Set role=${role} for ${email}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
