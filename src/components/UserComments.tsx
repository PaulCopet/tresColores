import React, { useState, useEffect } from 'react';
import type { Comentario, EventModel } from '../backend/logic/models';
import type { UsuarioSesion } from '../shared/authTypes';

interface UserCommentsProps {
    usuario: UsuarioSesion;
    onClose: () => void;
}

const UserComments: React.FC<UserCommentsProps> = ({ usuario, onClose }) => {
    const [comentarios, setComentarios] = useState<Array<Comentario & { eventoNombre: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'pendientes' | 'aprobados' | 'rechazados'>('todos');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchUserComments();
    }, [usuario]);

    const fetchUserComments = async () => {
        try {
            setLoading(true);

            // Obtener comentarios del usuario desde Firestore
            const res = await fetch(`/api/comentarios/usuario?usuarioId=${encodeURIComponent(usuario.correo)}`);
            const data = await res.json();

            if (data.success) {
                const userComments = data.data;

                // Obtener nombres de eventos para cada comentario
                const historiasRes = await fetch('/api/historias');
                const historiasData = await historiasRes.json();

                if (historiasData.success) {
                    const historias: EventModel[] = historiasData.data;
                    const comentariosConEvento = userComments.map((comentario: any) => {
                        const historia = historias.find((h) => h.id === comentario.eventoId);
                        return {
                            ...comentario,
                            eventoNombre: historia?.nombre || 'Evento no encontrado',
                        };
                    });

                    setComentarios(comentariosConEvento);
                }
            }
        } catch (e) {
            console.error('Error al cargar comentarios:', e);
            alert('Error al cargar comentarios');
        } finally {
            setLoading(false);
        }
    };

    const filteredComments = comentarios.filter((c) => {
        if (filter === 'todos') return true;
        if (filter === 'pendientes') return c.estado === 'pendiente';
        if (filter === 'aprobados') return c.estado === 'aprobado';
        if (filter === 'rechazados') return c.estado === 'rechazado';
        return true;
    });

    const handleEdit = (comentario: Comentario & { eventoNombre: string }) => {
        setEditingId(comentario.id);
        setEditContent(comentario.contenido);
    };

    const handleSaveEdit = async (comentarioId: string, eventoId: string) => {
        try {
            const res = await fetch('/api/comentarios/usuario', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comentarioId,
                    contenido: editContent.trim(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Actualizar localmente
                setComentarios((prev) =>
                    prev.map((c) =>
                        c.id === comentarioId
                            ? {
                                ...c,
                                contenido: editContent.trim(),
                                estado: 'pendiente' as const,
                                fechaModeracion: undefined,
                                moderadoPor: undefined,
                            }
                            : c
                    )
                );
                setEditingId(null);
                setEditContent('');
                alert('Comentario actualizado. Será revisado nuevamente por el administrador.');
            } else {
                alert('Error al editar comentario: ' + data.error);
            }
        } catch (e) {
            console.error('Error al editar comentario:', e);
            alert('Error al editar el comentario');
        }
    };

    const handleDelete = async (comentarioId: string, eventoId: string) => {
        if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

        try {
            const res = await fetch(`/api/comentarios/usuario?comentarioId=${encodeURIComponent(comentarioId)}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
                alert('Comentario eliminado exitosamente');
            } else {
                alert('Error al eliminar comentario: ' + data.error);
            }
        } catch (e) {
            console.error('Error al eliminar comentario:', e);
            alert('Error al eliminar el comentario');
        }
    };

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
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        En revisión
                    </span>
                );
            case 'aprobado':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Aprobado
                    </span>
                );
            case 'rechazado':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Rechazado
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Mis Comentarios</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {comentarios.length} comentario{comentarios.length !== 1 ? 's' : ''} en total
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 transition"
                        title="Cerrar"
                    >
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-2 p-6 border-b border-slate-200">
                    <button
                        onClick={() => setFilter('todos')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'todos'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Todos ({comentarios.length})
                    </button>
                    <button
                        onClick={() => setFilter('pendientes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pendientes'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        En revisión
                    </button>
                    <button
                        onClick={() => setFilter('aprobados')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'aprobados'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Aprobados
                    </button>
                    <button
                        onClick={() => setFilter('rechazados')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'rechazados'
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Rechazados
                    </button>
                </div>

                {/* Lista de comentarios */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredComments.length > 0 ? (
                        <div className="space-y-4">
                            {filteredComments.map((comentario) => (
                                <div
                                    key={comentario.id}
                                    className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getEstadoBadge(comentario.estado)}
                                                <span className="text-xs text-slate-500">{formatDate(comentario.fechaCreacion)}</span>
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 mb-1">
                                                Historia: {comentario.eventoNombre}
                                            </p>
                                        </div>

                                        {/* Acciones solo para rechazados */}
                                        {comentario.estado === 'rechazado' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(comentario)}
                                                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                    title="Editar comentario"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comentario.id, comentario.eventoId)}
                                                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                    title="Eliminar comentario"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingId === comentario.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                rows={3}
                                                placeholder="Edita tu comentario..."
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(comentario.id, comentario.eventoId)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditContent('');
                                                    }}
                                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                                            {comentario.contenido}
                                        </p>
                                    )}

                                    {comentario.estado === 'rechazado' && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                            <p className="text-xs text-red-700">
                                                <strong>Este comentario fue rechazado.</strong> Puedes editarlo y será enviado nuevamente para revisión.
                                            </p>
                                        </div>
                                    )}

                                    {comentario.estado === 'pendiente' && (
                                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                                            <p className="text-xs text-amber-700">
                                                <strong>Este comentario está en revisión.</strong> Será visible públicamente una vez aprobado por un administrador.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm text-slate-500">
                                {filter === 'todos'
                                    ? 'Aún no has realizado comentarios'
                                    : `No tienes comentarios ${filter === 'pendientes' ? 'en revisión' : filter}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserComments;
