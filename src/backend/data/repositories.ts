import type { User, EventModel } from '../logic/models.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('Data Layer: Repositories cargado');

const DATA_FILE = join(process.cwd(), 'src', 'data', 'historias-colombia.json');

type StorageShape = 'array' | 'object';

function readEventosFile(): { eventos: EventModel[]; shape: StorageShape } {
    const fileContent = readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent) as unknown;

    if (Array.isArray(parsed)) {
        return { eventos: parsed as EventModel[], shape: 'array' };
    }

    const maybeObj = parsed as { historias?: unknown };
    if (Array.isArray(maybeObj?.historias)) {
        return { eventos: maybeObj.historias as EventModel[], shape: 'object' };
    }

    console.warn('Data Layer: Repositories - Formato de archivo no reconocido, retornando arreglo vacío.');
    return { eventos: [], shape: 'array' };
}

function writeEventosFile(eventos: EventModel[], shape: StorageShape) {
    if (shape === 'object') {
        writeFileSync(DATA_FILE, JSON.stringify({ historias: eventos }, null, 2), 'utf-8');
    } else {
        writeFileSync(DATA_FILE, JSON.stringify(eventos, null, 2), 'utf-8');
    }
}

export async function getUserById(id: string): Promise<User | null> {
    console.log('Data Layer: Repositories consultando usuario con ID:', id);
    console.log('Data Layer: Repositories usando Models para estructura de datos');
    if (id === 'demo') {
        console.log('Data Layer: Repositories - Usuario encontrado');
        return { id: 'demo', email: 'demo@example.com' };
    }
    console.log('Data Layer: Repositories - Usuario no encontrado');
    return null;
}

// ========== Repositorio de Eventos Históricos ==========

/**
 * Obtiene todos los eventos históricos
 */
export async function getAllEvents(): Promise<EventModel[]> {
    console.log('Data Layer: Repositories - Obteniendo todos los eventos');
    try {
        const { eventos } = readEventosFile();
        console.log(`Data Layer: Repositories - ${eventos.length} eventos encontrados`);
        return eventos;
    } catch (error) {
        console.error('Data Layer: Repositories - Error al leer eventos:', error);
        throw new Error('No se pudieron cargar los eventos');
    }
}

/**
 * Obtiene un evento por su ID
 */
export async function getEventById(id: string): Promise<EventModel | null> {
    console.log('Data Layer: Repositories - Buscando evento con ID:', id);
    try {
        const eventos = await getAllEvents();
        const evento = eventos.find(e => e.id === id);
        console.log(`Data Layer: Repositories - Evento ${evento ? 'encontrado' : 'no encontrado'}`);
        return evento || null;
    } catch (error) {
        console.error('Data Layer: Repositories - Error al buscar evento:', error);
        return null;
    }
}

/**
 * Crea un nuevo evento histórico
 */
export async function createEvent(eventoData: Omit<EventModel, 'id'>): Promise<EventModel> {
    console.log('Data Layer: Repositories - Creando nuevo evento');
    try {
        const { eventos, shape } = readEventosFile();

        // Generar ID único
        const maxId = eventos.reduce((max, e) => {
            const id = parseInt(e.id);
            return id > max ? id : max;
        }, 0);
        const newId = (maxId + 1).toString();

        // Crear evento completo
        const nuevoEvento: EventModel = {
            id: newId,
            ...eventoData
        };

        // Agregar al array y guardar
        eventos.push(nuevoEvento);
        writeEventosFile(eventos, shape);

        console.log(`Data Layer: Repositories - Evento creado con ID: ${newId}`);
        return nuevoEvento;
    } catch (error) {
        console.error('Data Layer: Repositories - Error al crear evento:', error);
        throw new Error('No se pudo crear el evento');
    }
}

/**
 * Actualiza un evento existente
 */
export async function updateEvent(id: string, eventoData: Partial<EventModel>): Promise<EventModel | null> {
    console.log('Data Layer: Repositories - Actualizando evento:', id);
    try {
        const { eventos, shape } = readEventosFile();

        const index = eventos.findIndex(e => e.id === id);
        if (index === -1) {
            console.log('Data Layer: Repositories - Evento no encontrado para actualizar');
            return null;
        }

        // Actualizar evento
        eventos[index] = { ...eventos[index], ...eventoData, id }; // Mantener ID original
        writeEventosFile(eventos, shape);

        console.log('Data Layer: Repositories - Evento actualizado exitosamente');
        return eventos[index];
    } catch (error) {
        console.error('Data Layer: Repositories - Error al actualizar evento:', error);
        throw new Error('No se pudo actualizar el evento');
    }
}

/**
 * Elimina un evento
 */
export async function deleteEvent(id: string): Promise<boolean> {
    console.log('Data Layer: Repositories - Eliminando evento:', id);
    try {
        const { eventos, shape } = readEventosFile();

        const index = eventos.findIndex(e => e.id === id);
        if (index === -1) {
            console.log('Data Layer: Repositories - Evento no encontrado para eliminar');
            return false;
        }

        eventos.splice(index, 1);
        writeEventosFile(eventos, shape);

        console.log('Data Layer: Repositories - Evento eliminado exitosamente');
        return true;
    } catch (error) {
        console.error('Data Layer: Repositories - Error al eliminar evento:', error);
        throw new Error('No se pudo eliminar el evento');
    }
}
