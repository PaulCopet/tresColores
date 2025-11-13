import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { EventModel, Integrante } from '../backend/logic/models';
import Toast from './Toast';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated?: () => void;
    editingEvent?: EventModel | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onEventCreated, editingEvent }) => {
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
    const [currentTab, setCurrentTab] = useState<'basic' | 'integrantes' | 'consecuencias'>('basic');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    // Refs para animaciones
    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Estado temporal para agregar integrante
    const [newIntegrante, setNewIntegrante] = useState<Integrante>({
        nombre: '',
        rol: '',
        descripcion: ''
    });

    const isEditMode = Boolean(editingEvent);

    useEffect(() => {
        if (isOpen && overlayRef.current && modalRef.current) {
            gsap.fromTo(overlayRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.2, ease: 'power2.out' }
            );
            gsap.fromTo(modalRef.current,
                { opacity: 0, y: 40, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
            );
        }
    }, [isOpen]);

    const handleClose = () => {
        if (overlayRef.current && modalRef.current) {
            gsap.to(modalRef.current, {
                opacity: 0, y: 20, scale: 0.98, duration: 0.25, ease: 'power2.in'
            });
            gsap.to(overlayRef.current, {
                opacity: 0, duration: 0.25, ease: 'power2.in',
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
        setCurrentTab('basic');
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (editingEvent) {
            setNombre(editingEvent.nombre);
            setFecha(editingEvent.fecha);
            setDescripcion(editingEvent.descripcion);
            setUbicacion(editingEvent.ubicacion);
            setIntegrantes(editingEvent.integrantes || []);
            const consecuenciasExistentes = editingEvent.consecuencias?.length ? editingEvent.consecuencias : [''];
            setConsecuencias(consecuenciasExistentes);
            setError('');
            setSuccess('');
            setCurrentTab('basic');
        } else {
            resetForm();
        }
    }, [isOpen, editingEvent]);

    const validateForm = (): boolean => {
        // Validar campos obligatorios
        if (!nombre.trim()) {
            setError('El título del evento es obligatorio');
            setCurrentTab('basic');
            return false;
        }

        if (!fecha) {
            setError('La fecha del evento es obligatoria');
            setCurrentTab('basic');
            return false;
        }

        if (!descripcion.trim()) {
            setError('La descripción del evento es obligatoria');
            setCurrentTab('basic');
            return false;
        }

        if (!ubicacion.trim()) {
            setError('La ubicación del evento es obligatoria');
            setCurrentTab('basic');
            return false;
        }

        if (integrantes.length === 0) {
            setError('Debe agregar al menos un integrante al evento');
            setCurrentTab('integrantes');
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
                    if (onEventCreated) {
                        onEventCreated();
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
                    if (onEventCreated) {
                        onEventCreated();
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
            setError('El nombre y rol del integrante son obligatorios');
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
            <div
                ref={overlayRef}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Editar evento histórico' : 'Panel de Administración'}</h2>
                            <p className="text-blue-100 mt-1">{isEditMode ? 'Actualiza la información del evento seleccionado' : 'Crear nuevo evento histórico'}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                            aria-label="Cerrar panel"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-6">
                    <button
                        onClick={() => setCurrentTab('basic')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${currentTab === 'basic'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Información Básica
                    </button>
                    <button
                        onClick={() => setCurrentTab('integrantes')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${currentTab === 'integrantes'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Integrantes ({integrantes.length})
                    </button>
                    <button
                        onClick={() => setCurrentTab('consecuencias')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${currentTab === 'consecuencias'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Consecuencias
                    </button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto flex-1 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        {/* Tab: Información Básica */}
                        {currentTab === 'basic' && (
                            <div className="space-y-5">
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
                                        placeholder="Ej: Grito de Independencia"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Fecha */}
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

                                {/* Ubicación */}
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

                                {/* Descripción */}
                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="descripcion"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                        placeholder="Describe el evento histórico..."
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab: Integrantes */}
                        {currentTab === 'integrantes' && (
                            <div className="space-y-5">
                                {/* Lista de integrantes */}
                                {integrantes.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-gray-700">Integrantes agregados:</h3>
                                        {integrantes.map((integrante, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{integrante.nombre}</p>
                                                    <p className="text-sm text-gray-600">{integrante.rol}</p>
                                                    {integrante.descripcion && (
                                                        <p className="text-sm text-gray-500 mt-1">{integrante.descripcion}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIntegrante(index)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                    aria-label="Eliminar integrante"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Formulario para agregar integrante */}
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-700">Agregar nuevo integrante:</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nombre <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newIntegrante.nombre}
                                            onChange={(e) => setNewIntegrante({ ...newIntegrante, nombre: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                            placeholder="Nombre completo"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rol <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newIntegrante.rol}
                                            onChange={(e) => setNewIntegrante({ ...newIntegrante, rol: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                            placeholder="Ej: Líder, Participante, etc."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Descripción (opcional)
                                        </label>
                                        <textarea
                                            value={newIntegrante.descripcion}
                                            onChange={(e) => setNewIntegrante({ ...newIntegrante, descripcion: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                            placeholder="Información adicional sobre este integrante"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddIntegrante}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Agregar Integrante
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab: Consecuencias */}
                        {currentTab === 'consecuencias' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-700">Consecuencias históricas (opcional):</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddConsecuencia}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Agregar consecuencia
                                    </button>
                                </div>

                                {consecuencias.map((consecuencia, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={consecuencia}
                                            onChange={(e) => handleConsecuenciaChange(index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                            placeholder={`Consecuencia ${index + 1}`}
                                        />
                                        {consecuencias.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveConsecuencia(index)}
                                                className="text-red-600 hover:text-red-800 transition-colors px-3"
                                                aria-label="Eliminar consecuencia"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer con botones de acción */}
                <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isEditMode ? 'Actualizando...' : 'Guardando...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {isEditMode ? 'Actualizar evento' : 'Guardar evento'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
            
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

export default AdminPanel;
