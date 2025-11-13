import React, { useState, useMemo, useEffect } from 'react';
import type { Comentario, EventModel } from '../backend/logic/models';

interface CommentsModerationProps {
    historias: EventModel[];
    onViewEvent: (eventoId: string) => void;
    moderadorId: string; // ID del administrador que modera
}

const CommentsModeration: React.FC<CommentsModerationProps> = ({
    historias,
    onViewEvent,
    moderadorId,
}) => {
    const [filter, setFilter] = useState<'todos' | 'pendientes' | 'aprobados' | 'rechazados'>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar comentarios desde Firestore
    useEffect(() => {
        fetchComentarios();
    }, []);

    const fetchComentarios = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/comentarios/admin');
            const data = await res.json();

            if (data.success) {
                setComentarios(data.data);
            } else {
                console.error('Error al cargar comentarios:', data.error);
            }
        } catch (e) {
            console.error('Error al cargar comentarios:', e);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar y ordenar comentarios
    const comentariosFiltrados = useMemo(() => {
        const comentariosConEvento = comentarios.map((comentario) => {
            const historia = historias.find((h) => h.id === comentario.eventoId);
            return {
                ...comentario,
                eventoNombre: historia?.nombre || 'Evento no encontrado',
            };
        });

        // Filtrar por estado
        let filtered = comentariosConEvento;
        if (filter !== 'todos') {
            filtered = comentariosConEvento.filter((c) => {
                if (filter === 'pendientes') return c.estado === 'pendiente';
                if (filter === 'aprobados') return c.estado === 'aprobado';
                if (filter === 'rechazados') return c.estado === 'rechazado';
                return true;
            });
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(
                (c) =>
                    c.usuarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.eventoNombre.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Ordenar por fecha (más recientes primero)
        return filtered.sort((a, b) =>
            new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
    }, [comentarios, historias, filter, searchTerm]);

    const formatDate = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pendiente
                    </span>
                );
            case 'aprobado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Aprobado
                    </span>
                );
            case 'rechazado':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Rechazado
                    </span>
                );
            default:
                return null;
        }
    };

    const handleApprove = async (comentario: Comentario & { eventoNombre: string }) => {
        if (!confirm('¿Aprobar este comentario?')) return;

        try {
            const res = await fetch('/api/comentarios/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comentarioId: comentario.id,
                    accion: 'aprobar',
                    moderadorId,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Actualizar localmente
                setComentarios((prev) =>
                    prev.map((c) =>
                        c.id === comentario.id
                            ? { ...c, estado: 'aprobado' as const, moderadoPor: moderadorId }
                            : c
                    )
                );
                alert('Comentario aprobado');
            } else {
                alert('Error al aprobar comentario: ' + data.error);
            }
        } catch (e) {
            console.error('Error al aprobar comentario:', e);
            alert('Error al aprobar comentario');
        }
    };

    const handleReject = async (comentario: Comentario & { eventoNombre: string }) => {
        if (!confirm('¿Rechazar este comentario? El usuario podrá editarlo.')) return;

        try {
            const res = await fetch('/api/comentarios/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comentarioId: comentario.id,
                    accion: 'rechazar',
                    moderadorId,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Actualizar localmente
                setComentarios((prev) =>
                    prev.map((c) =>
                        c.id === comentario.id
                            ? { ...c, estado: 'rechazado' as const, moderadoPor: moderadorId }
                            : c
                    )
                );
                alert('Comentario rechazado');
            } else {
                alert('Error al rechazar comentario: ' + data.error);
            }
        } catch (e) {
            console.error('Error al rechazar comentario:', e);
            alert('Error al rechazar comentario');
        }
    };

    return (
        <div className="p-6">
            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                {/* Filtros por estado */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('todos')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'todos'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Todos ({comentarios.length})
                    </button>
                    <button
                        onClick={() => setFilter('pendientes')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'pendientes'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilter('aprobados')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'aprobados'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Aprobados
                    </button>
                    <button
                        onClick={() => setFilter('rechazados')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === 'rechazados'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Rechazados
                    </button>
                </div>

                {/* Búsqueda */}
                <div className="relative ml-auto w-full max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Buscar comentarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Lista de comentarios */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-500">Cargando comentarios...</p>
                    </div>
                ) : comentariosFiltrados.length > 0 ? (
                    comentariosFiltrados.map((comentario) => (
                        <div
                            key={comentario.id}
                            className="border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                            {comentario.usuarioNombre
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900">
                                                {comentario.usuarioNombre}
                                            </p>
                                            <p className="text-xs text-slate-500">{formatDate(comentario.fechaCreacion)}</p>
                                        </div>
                                        {getEstadoBadge(comentario.estado)}
                                    </div>

                                    <button
                                        onClick={() => onViewEvent(comentario.eventoId)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium mb-2 flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Ver historia: {comentario.eventoNombre}
                                    </button>
                                </div>

                                {/* Botones de acción */}
                                {comentario.estado === 'pendiente' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleApprove(comentario)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
                                            title="Aprobar comentario"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleReject(comentario)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
                                            title="Rechazar comentario"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                                {comentario.contenido}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm text-slate-500">
                            {searchTerm
                                ? 'No se encontraron comentarios con los criterios de búsqueda'
                                : 'No hay comentarios para mostrar'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentsModeration;
