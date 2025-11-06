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

export interface EventModel {
    id: string;
    fecha: string;
    nombre: string;
    descripcion: string;
    integrantes: Integrante[];
    ubicacion: string;
    consecuencias: string[];
}

// Alias para mantener compatibilidad con código existente
export type Historia = EventModel;
