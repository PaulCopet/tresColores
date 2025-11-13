import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';
import type { Comentario } from '../backend/logic/models';

/**
 * Servicio para gestionar comentarios en Firestore
 */
export class ComentariosService {
    private readonly COLLECTION = 'comentarios';

    /**
     * Crear un nuevo comentario
     */
    async crearComentario(comentario: Omit<Comentario, 'id' | 'fechaCreacion'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, this.COLLECTION), {
                ...comentario,
                fechaCreacion: serverTimestamp(),
                estado: 'pendiente',
            });
            return docRef.id;
        } catch (error) {
            console.error('Error al crear comentario:', error);
            throw new Error('No se pudo crear el comentario');
        }
    }

    /**
     * Obtener comentarios de un usuario
     */
    async obtenerComentariosUsuario(usuarioId: string): Promise<Comentario[]> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('usuarioId', '==', usuarioId)
            );

            const querySnapshot = await getDocs(q);
            const comentarios: Comentario[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                comentarios.push({
                    id: doc.id,
                    eventoId: data.eventoId,
                    usuarioId: data.usuarioId,
                    usuarioNombre: data.usuarioNombre,
                    contenido: data.contenido,
                    fechaCreacion: (data.fechaCreacion as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    estado: data.estado,
                    fechaModeracion: data.fechaModeracion ? (data.fechaModeracion as Timestamp).toDate().toISOString() : undefined,
                    moderadoPor: data.moderadoPor,
                });
            });

            return comentarios;
        } catch (error) {
            console.error('Error al obtener comentarios del usuario:', error);
            throw new Error('No se pudieron obtener los comentarios');
        }
    }

    /**
     * Obtener comentarios de un evento (todos los estados para poder filtrar en frontend)
     */
    async obtenerComentariosEvento(eventoId: string): Promise<Comentario[]> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('eventoId', '==', eventoId)
            );

            const querySnapshot = await getDocs(q);
            const comentarios: Comentario[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                comentarios.push({
                    id: doc.id,
                    eventoId: data.eventoId,
                    usuarioId: data.usuarioId,
                    usuarioNombre: data.usuarioNombre,
                    contenido: data.contenido,
                    fechaCreacion: (data.fechaCreacion as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    estado: data.estado,
                    fechaModeracion: data.fechaModeracion ? (data.fechaModeracion as Timestamp).toDate().toISOString() : undefined,
                    moderadoPor: data.moderadoPor,
                });
            });

            return comentarios;
        } catch (error) {
            console.error('Error al obtener comentarios del evento:', error);
            throw new Error('No se pudieron obtener los comentarios');
        }
    }

    /**
     * Obtener todos los comentarios (solo admin)
     */
    async obtenerTodosComentarios(): Promise<Comentario[]> {
        try {
            const querySnapshot = await getDocs(collection(db, this.COLLECTION));
            const comentarios: Comentario[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                comentarios.push({
                    id: doc.id,
                    eventoId: data.eventoId,
                    usuarioId: data.usuarioId,
                    usuarioNombre: data.usuarioNombre,
                    contenido: data.contenido,
                    fechaCreacion: (data.fechaCreacion as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                    estado: data.estado,
                    fechaModeracion: data.fechaModeracion ? (data.fechaModeracion as Timestamp).toDate().toISOString() : undefined,
                    moderadoPor: data.moderadoPor,
                });
            });

            return comentarios;
        } catch (error) {
            console.error('Error al obtener todos los comentarios:', error);
            throw new Error('No se pudieron obtener los comentarios');
        }
    }

    /**
     * Editar un comentario (solo si está rechazado)
     */
    async editarComentario(comentarioId: string, nuevoContenido: string): Promise<void> {
        try {
            const comentarioRef = doc(db, this.COLLECTION, comentarioId);
            await updateDoc(comentarioRef, {
                contenido: nuevoContenido,
                estado: 'pendiente',
                fechaModeracion: null,
                moderadoPor: null,
            });
        } catch (error) {
            console.error('Error al editar comentario:', error);
            throw new Error('No se pudo editar el comentario');
        }
    }

    /**
     * Eliminar un comentario
     */
    async eliminarComentario(comentarioId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, this.COLLECTION, comentarioId));
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            throw new Error('No se pudo eliminar el comentario');
        }
    }

    /**
     * Aprobar un comentario (solo admin)
     */
    async aprobarComentario(comentarioId: string, moderadorId: string): Promise<void> {
        try {
            const comentarioRef = doc(db, this.COLLECTION, comentarioId);
            await updateDoc(comentarioRef, {
                estado: 'aprobado',
                fechaModeracion: serverTimestamp(),
                moderadoPor: moderadorId,
            });
        } catch (error) {
            console.error('Error al aprobar comentario:', error);
            throw new Error('No se pudo aprobar el comentario');
        }
    }

    /**
     * Rechazar un comentario (solo admin)
     */
    async rechazarComentario(comentarioId: string, moderadorId: string): Promise<void> {
        try {
            const comentarioRef = doc(db, this.COLLECTION, comentarioId);
            await updateDoc(comentarioRef, {
                estado: 'rechazado',
                fechaModeracion: serverTimestamp(),
                moderadoPor: moderadorId,
            });
        } catch (error) {
            console.error('Error al rechazar comentario:', error);
            throw new Error('No se pudo rechazar el comentario');
        }
    }
}

export const comentariosService = new ComentariosService();
