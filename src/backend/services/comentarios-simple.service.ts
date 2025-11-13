import fs from 'fs';
import path from 'path';
import type { Comentario } from '../logic/models';

const COMENTARIOS_FILE = path.join(process.cwd(), 'src/data/comentarios.json');

// Función para leer comentarios del archivo JSON
function leerComentarios(): Comentario[] {
    try {
        if (!fs.existsSync(COMENTARIOS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(COMENTARIOS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer comentarios:', error);
        return [];
    }
}

// Función para escribir comentarios al archivo JSON
function escribirComentarios(comentarios: Comentario[]): void {
    try {
        fs.writeFileSync(COMENTARIOS_FILE, JSON.stringify(comentarios, null, 2));
    } catch (error) {
        console.error('Error al escribir comentarios:', error);
        throw new Error('No se pudieron guardar los comentarios');
    }
}

// Generar ID único
function generarId(): string {
    return `comentario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const comentariosService = {
    // Crear comentario
    async crearComentario(comentario: Omit<Comentario, 'id' | 'fechaCreacion'>): Promise<string> {
        const comentarios = leerComentarios();
        const nuevoComentario: Comentario = {
            ...comentario,
            id: generarId(),
            fechaCreacion: new Date().toISOString(),
            estado: 'pendiente',
        };

        comentarios.push(nuevoComentario);
        escribirComentarios(comentarios);
        return nuevoComentario.id;
    },

    // Obtener comentarios de un evento
    async obtenerComentariosEvento(eventoId: string): Promise<Comentario[]> {
        const comentarios = leerComentarios();
        return comentarios.filter(c => c.eventoId === eventoId);
    },

    // Obtener comentarios de un usuario
    async obtenerComentariosUsuario(usuarioId: string): Promise<Comentario[]> {
        const comentarios = leerComentarios();
        return comentarios.filter(c => c.usuarioId === usuarioId);
    },

    // Obtener todos los comentarios
    async obtenerTodosComentarios(): Promise<Comentario[]> {
        return leerComentarios();
    },

    // Editar comentario
    async editarComentario(comentarioId: string, nuevoContenido: string): Promise<void> {
        const comentarios = leerComentarios();
        const index = comentarios.findIndex(c => c.id === comentarioId);

        if (index === -1) {
            throw new Error('Comentario no encontrado');
        }

        comentarios[index].contenido = nuevoContenido;
        comentarios[index].estado = 'pendiente';
        comentarios[index].fechaModeracion = undefined;
        comentarios[index].moderadoPor = undefined;

        escribirComentarios(comentarios);
    },

    // Eliminar comentario
    async eliminarComentario(comentarioId: string): Promise<void> {
        const comentarios = leerComentarios();
        const comentariosFiltrados = comentarios.filter(c => c.id !== comentarioId);
        escribirComentarios(comentariosFiltrados);
    },

    // Aprobar comentario
    async aprobarComentario(comentarioId: string, moderadorId: string): Promise<void> {
        const comentarios = leerComentarios();
        const index = comentarios.findIndex(c => c.id === comentarioId);

        if (index === -1) {
            throw new Error('Comentario no encontrado');
        }

        comentarios[index].estado = 'aprobado';
        comentarios[index].fechaModeracion = new Date().toISOString();
        comentarios[index].moderadoPor = moderadorId;

        escribirComentarios(comentarios);
    },

    // Rechazar comentario
    async rechazarComentario(comentarioId: string, moderadorId: string): Promise<void> {
        const comentarios = leerComentarios();
        const index = comentarios.findIndex(c => c.id === comentarioId);

        if (index === -1) {
            throw new Error('Comentario no encontrado');
        }

        comentarios[index].estado = 'rechazado';
        comentarios[index].fechaModeracion = new Date().toISOString();
        comentarios[index].moderadoPor = moderadorId;

        escribirComentarios(comentarios);
    }
};