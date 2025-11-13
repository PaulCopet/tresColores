export type User = {
    id: string;
    email?: string;
};

export interface UsuarioModel {
    id: string;
    nombre: string;
    correo: string;
    contraseña: string;
    rol: 'admin' | 'usuario';
    fechaRegistro: string;
}

export interface Integrante {
    nombre: string;
    rol: string;
    descripcion: string;
}

export interface Comentario {
    id: string;
    eventoId: string;
    usuarioId: string;
    usuarioNombre: string;
    contenido: string;
    fechaCreacion: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fechaModeracion?: string;
    moderadoPor?: string;
}

export interface EventModel {
    id: string;
    fecha: string;
    nombre: string;
    descripcion: string;
    integrantes: Integrante[];
    ubicacion: string;
    consecuencias: string[];
    comentarios?: Comentario[];
}

// Alias para mantener compatibilidad con código existente
export type Historia = EventModel;
