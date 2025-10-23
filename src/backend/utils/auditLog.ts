import { adminDb } from '../data/firebaseAdmin.js';

console.log('Utility Layer: AuditLog cargado');

export async function auditLog(event: string, payload: unknown) {
    console.log('Utility Layer: AuditLog registrando evento:', event);
    try {
        console.log('Utility Layer: AuditLog conectando con Firestore');
        await adminDb.collection('audit_logs').add({
            event,
            payload,
            ts: new Date().toISOString(),
        });
        console.log('Utility Layer: AuditLog - Evento registrado en Firestore correctamente');
    } catch (e) {
        console.warn('Utility Layer: AuditLog - Error al registrar en Firestore:', e);
    }
}
