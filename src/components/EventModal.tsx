import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import type { EventModel, Comentario } from '../backend/logic/models';
import type { UsuarioSesion } from '../shared/authTypes';
import CommentsSection from './CommentsSection';

interface EventModalProps {
  evento: EventModel | null;
  usuario: UsuarioSesion | null;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ evento, usuario, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loadingComentarios, setLoadingComentarios] = useState(true);

  // Si no hay evento, no renderiza
  if (!evento) return null;

  // Cargar comentarios desde la API
  useEffect(() => {
    const fetchComentarios = async () => {
      if (!evento?.id) return;

      try {
        setLoadingComentarios(true);
        const res = await fetch(`/api/comentarios/evento?eventoId=${encodeURIComponent(evento.id)}`);
        const data = await res.json();

        if (data.success) {
          setComentarios(data.data);
        }
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      } finally {
        setLoadingComentarios(false);
      }
    };

    fetchComentarios();
  }, [evento?.id]);

  // Animación de entrada
  useEffect(() => {
    if (evento && overlayRef.current && modalRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(modalRef.current, { scale: 0.8 });

      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.15,
        ease: 'power2.out'
      });

      gsap.to(modalRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  }, [evento]);

  // Bloqueo de scroll + ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (overlayRef.current && modalRef.current) {
      gsap.to(modalRef.current, {
        scale: 0.8,
        duration: 0.18,
        ease: 'power2.in'
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  const fechaBonita = (() => {
    // si viene como 'YYYY-MM-DD', aseguramos T00:00 para evitar TZ raras
    const d = new Date((evento.fecha || '').includes('T') ? evento.fecha : `${evento.fecha}T00:00:00`);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const integrantes = Array.isArray(evento.integrantes) ? evento.integrantes : [];
  const consecuencias = Array.isArray(evento.consecuencias) ? evento.consecuencias : [];

  return createPortal(
    <div
      ref={overlayRef}
      style={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm 
                 flex items-center justify-center p-4 md:p-6"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        style={{ transform: 'scale(0.8)' }}
        className="relative w-full h-[90vh] md:max-w-4xl lg:max-w-5xl 
                   bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header minimalista */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                {evento.nombre}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {fechaBonita}
                </div>
                {evento.ubicacion && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {evento.ubicacion}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 
                         flex items-center justify-center transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido principal con scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Grid principal de contenido */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Columna principal - Descripción */}
              <div className="lg:col-span-2 space-y-6">
                {evento.descripcion && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-900">Historia del Evento</h2>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {evento.descripcion}
                    </p>
                  </div>
                )}

                {/* Consecuencias */}
                {consecuencias.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-900">Impacto Histórico</h2>
                    </div>
                    <div className="space-y-3">
                      {consecuencias.map((c, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0"></div>
                          <p className="text-gray-700 text-base leading-relaxed">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Personajes */}
              <div className="lg:col-span-1">
                {integrantes.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-0">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                      <h2 className="text-xl font-bold text-gray-900">Protagonistas</h2>
                    </div>
                    <div className="space-y-4">
                      {integrantes.map((it, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100"
                        >
                          <h3 className="font-bold text-gray-900 text-base mb-1">{it.nombre}</h3>
                          {it.rol && (
                            <p className="text-green-700 font-medium text-sm mb-2">{it.rol}</p>
                          )}
                          {it.descripcion && (
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {it.descripcion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sección de comentarios - ancho completo */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-orange-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">Comentarios de la Comunidad</h2>
              </div>

              <CommentsSection
                eventoId={evento.id}
                comentarios={comentarios}
                usuario={usuario}
                onAddComment={async (contenido) => {
                  if (!usuario) return;

                  try {
                    const res = await fetch('/api/comentarios/usuario', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventoId: evento.id,
                        usuarioId: usuario.correo,
                        usuarioNombre: usuario.nombre,
                        contenido,
                      }),
                    });

                    const data = await res.json();

                    if (data.success) {
                      const nuevoComentario: Comentario = {
                        id: data.data.id,
                        eventoId: evento.id,
                        usuarioId: usuario.correo,
                        usuarioNombre: usuario.nombre,
                        contenido,
                        fechaCreacion: new Date().toISOString(),
                        estado: 'pendiente',
                      };
                      setComentarios([...comentarios, nuevoComentario]);
                      alert('Comentario enviado. Será visible una vez aprobado por un administrador.');
                    } else {
                      alert('Error al crear comentario: ' + data.error);
                    }
                  } catch (error) {
                    console.error('Error al crear comentario:', error);
                    alert('Error al crear comentario');
                  }
                }}
                onEditComment={async (comentarioId: string, nuevoContenido: string) => {
                  try {
                    const res = await fetch('/api/comentarios/usuario', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        comentarioId,
                        contenido: nuevoContenido,
                      }),
                    });

                    const data = await res.json();

                    if (data.success) {
                      setComentarios(
                        comentarios.map((c) =>
                          c.id === comentarioId
                            ? { ...c, contenido: nuevoContenido, estado: 'pendiente' as const }
                            : c
                        )
                      );
                      alert('Comentario editado. Será revisado nuevamente.');
                    } else {
                      alert('Error al editar comentario: ' + data.error);
                    }
                  } catch (error) {
                    console.error('Error al editar comentario:', error);
                    alert('Error al editar comentario');
                  }
                }}
                onDeleteComment={async (comentarioId) => {
                  if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

                  try {
                    const res = await fetch(`/api/comentarios/usuario?comentarioId=${encodeURIComponent(comentarioId)}`, {
                      method: 'DELETE',
                    });

                    const data = await res.json();

                    if (data.success) {
                      setComentarios(comentarios.filter((c) => c.id !== comentarioId));
                      alert('Comentario eliminado');
                    } else {
                      alert('Error al eliminar comentario: ' + data.error);
                    }
                  } catch (error) {
                    console.error('Error al eliminar comentario:', error);
                    alert('Error al eliminar comentario');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EventModal;
