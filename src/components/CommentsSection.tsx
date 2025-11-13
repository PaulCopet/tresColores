import React, { useState } from 'react';
import type { Comentario } from '../backend/logic/models';
import type { UsuarioSesion } from '../shared/authTypes';

interface CommentsSectionProps {
    eventoId: string;
    comentarios: Comentario[];
    usuario: UsuarioSesion | null;
    onAddComment: (contenido: string) => Promise<void>;
    onEditComment?: (comentarioId: string, nuevoContenido: string) => Promise<void>;
    onDeleteComment?: (comentarioId: string) => Promise<void>;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
    eventoId,
    comentarios = [],
    usuario,
    onAddComment,
    onEditComment,
    onDeleteComment,
}) => {
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Filtrar comentarios según el usuario
    const comentariosFiltrados = comentarios.filter((c) => {
        // Admin ve todos
        if (usuario?.rol === 'admin') return true;

        // Usuario ve: aprobados públicos + sus propios comentarios (pendientes/rechazados)
        if (c.estado === 'aprobado') return true;
        if (usuario && c.usuarioId === usuario.correo) return true;

        // Usuario no logueado solo ve aprobados
        return false;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoComentario.trim() || !usuario) return;

        setIsSubmitting(true);
        try {
            await onAddComment(nuevoComentario.trim());
            setNuevoComentario('');
        } catch (error) {
            console.error('Error al enviar comentario:', error);
            alert('Error al enviar el comentario');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (fecha: string) => {
        const date = new Date(fecha);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const handleEdit = (comentario: Comentario) => {
        setEditingId(comentario.id);
        setEditContent(comentario.contenido);
    };

    const handleSaveEdit = async (comentarioId: string) => {
        if (!onEditComment || !editContent.trim()) return;

        try {
            await onEditComment(comentarioId, editContent.trim());
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            console.error('Error al editar comentario:', error);
            alert('Error al editar el comentario');
        }
    };

    const handleDelete = async (comentarioId: string) => {
        if (!onDeleteComment) return;
        if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

        try {
            await onDeleteComment(comentarioId);
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            alert('Error al eliminar el comentario');
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pendiente
                    </span>
                );
            case 'rechazado':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
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

    return (
        <section className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                    Comentarios ({comentariosFiltrados.length})
                </h3>
            </div>

            {/* Formulario para agregar comentario */}
            {usuario ? (
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {usuario.nombre
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={nuevoComentario}
                                onChange={(e) => setNuevoComentario(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white 
                          resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                          focus:outline-none text-sm"
                                rows={3}
                                disabled={isSubmitting}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={!nuevoComentario.trim() || isSubmitting}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium 
                            hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Comentar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-sm text-slate-600">
                        <span className="font-medium">Inicia sesión</span> para dejar un comentario
                    </p>
                </div>
            )}

            {/* Lista de comentarios */}
            <div className="space-y-4">
                {comentariosFiltrados.length > 0 ? (
                    comentariosFiltrados.map((comentario) => {
                        const isAutor = usuario && comentario.usuarioId === usuario.correo;
                        const isEditing = editingId === comentario.id;

                        return (
                            <div key={comentario.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                    {comentario.usuarioNombre
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>
                                <div className="flex-1">
                                    <div className={`rounded-xl px-4 py-3 ${comentario.estado === 'rechazado' ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
                                        }`}>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-slate-900">
                                                    {comentario.usuarioNombre}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {formatDate(comentario.fechaCreacion)}
                                                </span>
                                                {getEstadoBadge(comentario.estado)}
                                            </div>

                                            {/* Botones de acción para el autor de comentarios rechazados */}
                                            {isAutor && comentario.estado === 'rechazado' && !isEditing && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(comentario)}
                                                        className="p-1 text-slate-500 hover:text-blue-600 transition"
                                                        title="Editar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L13 14l-4 1 1-4 8.5-8.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(comentario.id)}
                                                        className="p-1 text-slate-500 hover:text-red-600 transition"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="mt-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white 
                                                              resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                                                              focus:outline-none text-sm"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditContent('');
                                                        }}
                                                        className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-sm transition"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(comentario.id)}
                                                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                                                    >
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                {comentario.contenido}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <svg
                            className="mx-auto h-12 w-12 text-slate-300 mb-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <p className="text-sm text-slate-500">
                            Aún no hay comentarios. {usuario ? '¡Sé el primero en comentar!' : ''}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CommentsSection;
