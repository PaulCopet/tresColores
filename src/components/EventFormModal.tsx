import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import type { EventModel, Integrante } from '../backend/logic/models';
import Toast from './Toast';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editingEvent?: EventModel | null;
}

const EventFormModal: React.FC<EventFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingEvent
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [fecha, setFecha] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
    const [consecuencias, setConsecuencias] = useState<string[]>(['']);

    // Estados de UI
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    // Estado temporal para agregar integrante
    const [newIntegrante, setNewIntegrante] = useState<Integrante>({
        nombre: '',
        rol: '',
        descripcion: ''
    });

    const isEditMode = Boolean(editingEvent);

    // Cargar datos del evento a editar
    useEffect(() => {
        if (isOpen) {
            if (editingEvent) {
                setNombre(editingEvent.nombre);
                setFecha(editingEvent.fecha);
                setDescripcion(editingEvent.descripcion);
                setUbicacion(editingEvent.ubicacion);
                setIntegrantes(editingEvent.integrantes || []);
                const consecuenciasExistentes = editingEvent.consecuencias?.length ? editingEvent.consecuencias : [''];
                setConsecuencias(consecuenciasExistentes);
            } else {
                resetForm();
            }
            setError('');
            setSuccess('');
        }
    }, [isOpen, editingEvent]);

    // Animación de entrada
    useEffect(() => {
        if (isOpen && overlayRef.current && modalRef.current) {
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
    }, [isOpen]);

    // Bloqueo de scroll + ESC
    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen]);

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
                onComplete: () => {
                    resetForm();
                    onClose();
                }
            });
        } else {
            resetForm();
            onClose();
        }
    };

    const resetForm = () => {
        setNombre('');
        setFecha('');
        setDescripcion('');
        setUbicacion('');
        setIntegrantes([]);
        setConsecuencias(['']);
        setNewIntegrante({ nombre: '', rol: '', descripcion: '' });
        setError('');
        setSuccess('');
    };

    const validateForm = (): boolean => {
        if (!nombre.trim()) {
            setError('El título del evento es obligatorio');
            return false;
        }

        if (!fecha) {
            setError('La fecha del evento es obligatoria');
            return false;
        }

        // Validar que la fecha sea válida
        const fechaDate = new Date(fecha + 'T00:00:00');
        if (isNaN(fechaDate.getTime())) {
            setError('La fecha modificada no es válida');
            return false;
        }

        if (!descripcion.trim()) {
            setError('La descripción no puede estar vacía');
            return false;
        }

        if (!ubicacion.trim()) {
            setError('La ubicación del evento es obligatoria');
            return false;
        }

        if (integrantes.length === 0) {
            setError('Debe agregar al menos un protagonista al evento');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const payload: Omit<EventModel, 'id'> = {
                nombre,
                fecha,
                descripcion,
                ubicacion,
                integrantes,
                consecuencias: consecuencias.filter((c) => c.trim() !== ''),
            };

            if (isEditMode && editingEvent) {
                const response = await fetch(`/api/events/${editingEvent.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (data.ok || data.success) {
                    if (onSuccess) {
                        onSuccess();
                    }
                    
                    // Cerrar modal inmediatamente
                    handleClose();
                    
                    // Mostrar toast después de cerrar modal
                    setTimeout(() => {
                        setToastMessage('Evento actualizado exitosamente');
                        setToastType('success');
                        setShowToast(true);
                    }, 300);
                } else {
                    setToastMessage(data.message || data.error || 'Error al actualizar el evento');
                    setToastType('error');
                    setShowToast(true);
                }
            } else {
                const response = await fetch('/api/eventos/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (data.success) {
                    if (onSuccess) {
                        onSuccess();
                    }
                    
                    // Cerrar modal inmediatamente
                    handleClose();
                    
                    // Mostrar toast después de cerrar modal
                    setTimeout(() => {
                        setToastMessage('¡Evento creado exitosamente!');
                        setToastType('success');
                        setShowToast(true);
                    }, 300);
                } else {
                    setToastMessage(data.message || 'Error al crear el evento');
                    setToastType('error');
                    setShowToast(true);
                }
            }
        } catch (err) {
            setToastMessage('Error al conectar con el servidor. Intenta de nuevo.');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddIntegrante = () => {
        if (!newIntegrante.nombre.trim() || !newIntegrante.rol.trim()) {
            setError('El nombre y rol del protagonista son obligatorios');
            return;
        }

        setIntegrantes([...integrantes, newIntegrante]);
        setNewIntegrante({ nombre: '', rol: '', descripcion: '' });
        setError('');
    };

    const handleRemoveIntegrante = (index: number) => {
        setIntegrantes(integrantes.filter((_, i) => i !== index));
    };

    const handleAddConsecuencia = () => {
        setConsecuencias([...consecuencias, '']);
    };

    const handleRemoveConsecuencia = (index: number) => {
        setConsecuencias(consecuencias.filter((_, i) => i !== index));
    };

    const handleConsecuenciaChange = (index: number, value: string) => {
        const newConsecuencias = [...consecuencias];
        newConsecuencias[index] = value;
        setConsecuencias(newConsecuencias);
    };

    // Crear fecha bonita para vista previa
    const fechaBonita = fecha ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : 'No definida';

    // Si no está abierto, no renderiza (después de todos los hooks)
    if (!isOpen) return (
        <>
            {/* Toast de notificación - siempre disponible */}
            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </>
    );

    return (
        <>
            {createPortal(
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
                <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {isEditMode ? 'Editar Evento Histórico' : 'Crear Nuevo Evento'}
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {fechaBonita}
                                </div>
                                {ubicacion && (
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {ubicacion}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 
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

                        {/* Mensajes de error y éxito */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-green-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium text-green-800">{success}</p>
                            </div>
                        )}

                        {/* Grid principal de contenido */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Columna principal - Información básica */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Información básica */}
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                        <h2 className="text-xl font-bold text-gray-900">Información del Evento</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Título */}
                                        <div>
                                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                                                Título del Evento <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="nombre"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                                placeholder="Ej: El Bogotazo"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* Fecha y Ubicación en grid */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fecha del Evento <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    id="fecha"
                                                    value={fecha}
                                                    onChange={(e) => setFecha(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ubicación <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="ubicacion"
                                                    value={ubicacion}
                                                    onChange={(e) => setUbicacion(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="Ej: Bogotá, Colombia"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        {/* Descripción */}
                                        <div>
                                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                                                Historia del Evento <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="descripcion"
                                                value={descripcion}
                                                onChange={(e) => setDescripcion(e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                                placeholder="Describe detalladamente el evento histórico, su contexto y desarrollo..."
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Consecuencias */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                                        <h2 className="text-xl font-bold text-gray-900">Impacto Histórico</h2>
                                    </div>

                                    <div className="space-y-3">
                                        {consecuencias.map((consecuencia, index) => (
                                            <div key={index} className="flex gap-2">
                                                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-3 shrink-0"></div>
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={consecuencia}
                                                        onChange={(e) => handleConsecuenciaChange(index, e.target.value)}
                                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                                        placeholder={`Consecuencia histórica ${index + 1}`}
                                                        disabled={isLoading}
                                                    />
                                                    {consecuencias.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveConsecuencia(index)}
                                                            className="text-red-600 hover:text-red-800 transition-colors px-2"
                                                            disabled={isLoading}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={handleAddConsecuencia}
                                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1 mt-3"
                                            disabled={isLoading}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Agregar consecuencia
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar - Protagonistas */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-0">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                                        <h2 className="text-xl font-bold text-gray-900">Protagonistas</h2>
                                    </div>

                                    {/* Lista de protagonistas */}
                                    <div className="space-y-4 mb-6">
                                        {integrantes.map((integrante, index) => (
                                            <div
                                                key={index}
                                                className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-gray-900 text-base">{integrante.nombre}</h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveIntegrante(index)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                        disabled={isLoading}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {integrante.rol && (
                                                    <p className="text-green-700 font-medium text-sm mb-2">{integrante.rol}</p>
                                                )}

                                                {integrante.descripcion && (
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {integrante.descripcion}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Formulario para agregar protagonista */}
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-700">Agregar protagonista:</h3>

                                        <input
                                            type="text"
                                            value={newIntegrante.nombre}
                                            onChange={(e) => setNewIntegrante({ ...newIntegrante, nombre: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                                            placeholder="Nombre completo *"
                                            disabled={isLoading}
                                        />

                                        <input
                                            type="text"
                                            value={newIntegrante.rol}
                                            onChange={(e) => setNewIntegrante({ ...newIntegrante, rol: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                                            placeholder="Rol o cargo *"
                                            disabled={isLoading}
                                        />

                                        <textarea
                                            value={newIntegrante.descripcion}
                                            onChange={(e) => setNewIntegrante({ ...newIntegrante, descripcion: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 resize-none text-sm"
                                            placeholder="Descripción (opcional)"
                                            disabled={isLoading}
                                        />

                                        <button
                                            type="button"
                                            onClick={handleAddIntegrante}
                                            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                                            disabled={isLoading}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Agregar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con botones de acción */}
                <div className="shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isEditMode ? 'Actualizando...' : 'Guardando...'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {isEditMode ? 'Actualizar Evento' : 'Crear Evento'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
                document.body
            )}
            
            {/* Toast de notificación - fuera del modal */}
            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </>
    );
};

export default EventFormModal;