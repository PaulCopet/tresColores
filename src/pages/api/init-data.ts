import { firebaseManager } from '../../backend/data/firebaseManager';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        await firebaseManager.initializeData();
        res.status(200).json({ success: true, message: 'Datos inicializados correctamente' });
    } catch (error) {
        console.error('Error al inicializar datos:', error);
        res.status(500).json({ success: false, message: 'Error al inicializar datos' });
    }
}