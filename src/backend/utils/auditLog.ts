import { adminDb } from '../data/firebaseAdmin.js';

export async function auditLog(event: string, payload: unknown) {
    try {
        await adminDb.collection('audit_logs').add({
            event,
            payload,
            ts: new Date().toISOString(),
        });
    } catch (e) {
        console.warn('[auditLog] failed', e);
    }
}
