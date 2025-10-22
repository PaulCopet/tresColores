import { adminDb } from './firebaseAdmin.js';

export const firebaseManager = {
  users: () => adminDb.collection('users'),
  audit: () => adminDb.collection('audit_logs'),
};
