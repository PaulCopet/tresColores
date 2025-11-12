import { getUserById, getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../data/repositories.js';
import type { EventModel, Integrante } from './models.js';
// importamos zod que nos sirve para validaciones
import { z } from 'zod';

console.log('Logic Layer: Services cargado');

// ========== Schemas de Validación ==========

export const GetUserSchema = z.object({ id: z.string().min(1) });

// Schema para validar integrantes
const IntegranteSchema = z.object({
    nombre: z.string().min(1, 'El nombre del integrante es obligatorio'),
    rol: z.string().min(1, 'El rol del integrante es obligatorio'),
    descripcion: z.string().optional().default('')
});

// Schema para crear un evento
export const CreateEventSchema = z.object({
    nombre: z.string().min(1, 'El título del evento es obligatorio'),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe estar en formato YYYY-MM-DD'),
    descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    ubicacion: z.string().min(1, 'La ubicación es obligatoria'),
    integrantes: z.array(IntegranteSchema).min(1, 'Debe agregar al menos un integrante'),
    consecuencias: z.array(z.string()).optional().default([])
});

// Schema para actualizar un evento
export const UpdateEventSchema = z.object({
    id: z.string().min(1),
    nombre: z.string().min(1).optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    descripcion: z.string().min(10).optional(),
    ubicacion: z.string().min(1).optional(),
    integrantes: z.array(IntegranteSchema).optional(),
    consecuencias: z.array(z.string()).optional()
});

// ========== Servicios de Usuario ==========

export async function getUserService(input: unknown) {
    console.log('Logic Layer: Services - Validando input con ValidatorService');
    const { id } = GetUserSchema.parse(input);
    console.log('Logic Layer: Services - Input validado correctamente');
    console.log('Logic Layer: Services llamando a Repositories');
    const user = await getUserById(id);
    console.log('Logic Layer: Services - Datos obtenidos de Repositories');
    return user;
}

// ========== Servicios de Eventos ==========

/**
 * Obtiene todos los eventos históricos
 */
export async function getAllEventsService() {
    console.log('Logic Layer: Services - Obteniendo todos los eventos');
    try {
        const eventos = await getAllEvents();
        console.log('Logic Layer: Services - Eventos obtenidos exitosamente');
        return {
            success: true,
            data: eventos
        };
    } catch (error) {
        console.error('Logic Layer: Services - Error al obtener eventos:', error);
        return {
            success: false,
            message: 'Error al cargar los eventos'
        };
    }
}

/**
 * Obtiene un evento por ID
 */
export async function getEventByIdService(input: unknown) {
    console.log('Logic Layer: Services - Obteniendo evento por ID');
    const { id } = z.object({ id: z.string() }).parse(input);

    try {
        const evento = await getEventById(id);
        if (!evento) {
            return {
                success: false,
                message: 'Evento no encontrado'
            };
        }

        console.log('Logic Layer: Services - Evento encontrado');
        return {
            success: true,
            data: evento
        };
    } catch (error) {
        console.error('Logic Layer: Services - Error al obtener evento:', error);
        return {
            success: false,
            message: 'Error al buscar el evento'
        };
    }
}

/**
 * Crea un nuevo evento histórico
 */
export async function createEventService(input: unknown) {
    console.log('Logic Layer: Services - Validando datos para crear evento');

    try {
        // Validar entrada con Zod
        const validatedData = CreateEventSchema.parse(input);
        console.log('Logic Layer: Services - Datos validados correctamente');

        // Llamar al repositorio para crear el evento
        console.log('Logic Layer: Services - Llamando a Repositories para crear evento');
        const nuevoEvento = await createEvent(validatedData);

        console.log('Logic Layer: Services - Evento creado exitosamente');
        return {
            success: true,
            message: 'Evento creado exitosamente',
            data: nuevoEvento
        };
    } catch (error) {
        console.error('Logic Layer: Services - Error al crear evento:', error);

        // Si es un error de validación de Zod
        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Datos inválidos',
                errors: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al crear el evento'
        };
    }
}

/**
 * Actualiza un evento existente
 */
export async function updateEventService(input: unknown) {
    console.log('Logic Layer: Services - Validando datos para actualizar evento');

    try {
        const validatedData = UpdateEventSchema.parse(input);
        console.log('Logic Layer: Services - Datos validados correctamente');

        const { id, ...updateData } = validatedData;

        console.log('Logic Layer: Services - Llamando a Repositories para actualizar evento');
        const eventoActualizado = await updateEvent(id, updateData);

        if (!eventoActualizado) {
            return {
                success: false,
                message: 'Evento no encontrado'
            };
        }

        console.log('Logic Layer: Services - Evento actualizado exitosamente');
        return {
            success: true,
            message: 'Evento actualizado exitosamente',
            data: eventoActualizado
        };
    } catch (error) {
        console.error('Logic Layer: Services - Error al actualizar evento:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Datos inválidos',
                errors: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            };
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al actualizar el evento'
        };
    }
}

/**
 * Elimina un evento
 */
export async function deleteEventService(input: unknown) {
    console.log('Logic Layer: Services - Eliminando evento');

    try {
        const { id } = z.object({ id: z.string() }).parse(input);

        console.log('Logic Layer: Services - Llamando a Repositories para eliminar evento');
        const eliminado = await deleteEvent(id);

        if (!eliminado) {
            return {
                success: false,
                message: 'Evento no encontrado'
            };
        }

        console.log('Logic Layer: Services - Evento eliminado exitosamente');
        return {
            success: true,
            message: 'Evento eliminado exitosamente'
        };
    } catch (error) {
        console.error('Logic Layer: Services - Error al eliminar evento:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al eliminar el evento'
        };
    }
}
