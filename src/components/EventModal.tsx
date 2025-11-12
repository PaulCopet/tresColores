import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import type { EventModel } from '../backend/logic/models';

interface EventModalProps {
  evento: EventModel | null;
  onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ evento, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Si no hay evento, no renderiza
  if (!evento) return null;

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
      className="fixed inset-0 z-2000 w-screen h-screen bg-slate-900/60
                 flex items-center justify-center px-4"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        style={{ transform: 'scale(0.8)' }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header en gradiente */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight truncate">
                {evento.nombre}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-white/95 bg-white/10 px-3 py-1 rounded-full">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {fechaBonita}
                </span>
                {evento.ubicacion && (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-white/95 bg-white/10 px-3 py-1 rounded-full">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19.5 8c0 7-7.5 13-7.5 13S4.5 15 4.5 8a7.5 7.5 0 1115 0z" />
                    </svg>
                    {evento.ubicacion}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleClose}
              className="shrink-0 rounded-lg p-2 text-white/90 hover:text-white hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Card "glass" */}
        <div className="bg-white border border-slate-200
                        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]">
          {/* Contenido scrolleable */}
          <div className="max-h-[78vh] overflow-y-auto p-6 space-y-8">
            {/* Descripción */}
            {evento.descripcion && (
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Descripción</h3>
                <p className="text-slate-700 leading-relaxed">
                  {evento.descripcion}
                </p>
              </section>
            )}

            {/* Personajes */}
            {integrantes.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Personajes principales</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {integrantes.map((it, idx) => (
                    <article
                      key={idx}
                      className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"
                    >
                      <p className="text-blue-800 font-bold text-lg truncate">{it.nombre}</p>
                      {it.rol && (
                        <p className="text-blue-700 font-medium mt-1">{it.rol}</p>
                      )}
                      {it.descripcion && (
                        <p className="text-slate-700 mt-2 text-sm leading-relaxed">
                          {it.descripcion}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Consecuencias */}
            {consecuencias.length > 0 && (
              <section className='pb-5'>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Consecuencias históricas</h3>
                <ul className="space-y-3">
                  {consecuencias.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700">
                      <span className="mt-1 h-2 w-2 rounded-full bg-blue-600"></span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EventModal;
