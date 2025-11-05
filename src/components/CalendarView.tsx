import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
// import type { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';
import type { EventModel } from '../backend/logic/models';
import EventModal from './EventModal';
import { gsap } from 'gsap';

interface CalendarViewProps {
    historias: EventModel[];
}

const CalendarView: React.FC<CalendarViewProps> = () => {
    const [date, setDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [historias, setHistorias] = useState<EventModel[]>([]);
    const [searchResults, setSearchResults] = useState<EventModel[]>([]); // Resultados de búsqueda
    const [displayedEventos, setDisplayedEventos] = useState<EventModel[]>([]); // Eventos mostrados en la lista
    const [selectedEvento, setSelectedEvento] = useState<EventModel | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [tooltip, setTooltip] = useState<{ date: string; eventos: EventModel[]; x: number; y: number } | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const calendarBtnRef = useRef<HTMLButtonElement>(null);
    const listBtnRef = useRef<HTMLButtonElement>(null);

    // Cargar datos desde la API
    useEffect(() => {
        const fetchHistorias = async () => {
            try {
                const response = await fetch('/api/historias');
                const data = await response.json();
                if (data.success) {
                    setHistorias(data.data);
                }
            } catch (error) {
                console.error('Error al cargar historias:', error);
            }
        };

        fetchHistorias();
    }, []);

    // Animación del tooltip con GSAP
    useEffect(() => {
        if (tooltip && tooltipRef.current) {
            gsap.fromTo(
                tooltipRef.current,
                {
                    opacity: 0,
                    scale: 0.8,
                    y: -10
                },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'back.out(1.7)'
                }
            );
        }
    }, [tooltip]);

    // Animación del toggle cuando cambia la vista
    useEffect(() => {
        const activeBtn = viewMode === 'calendar' ? calendarBtnRef.current : listBtnRef.current;
        const inactiveBtn = viewMode === 'calendar' ? listBtnRef.current : calendarBtnRef.current;

        if (activeBtn && inactiveBtn) {
            // Animar botón activo
            gsap.fromTo(
                activeBtn,
                {
                    scale: 0.95,
                    opacity: 0.8
                },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.4,
                    ease: 'elastic.out(1, 0.6)'
                }
            );

            // Animar icono del botón activo con rotación
            const activeIcon = activeBtn.querySelector('svg');
            if (activeIcon) {
                gsap.fromTo(
                    activeIcon,
                    {
                        rotate: -10,
                        scale: 0.8
                    },
                    {
                        rotate: 0,
                        scale: 1,
                        duration: 0.5,
                        ease: 'back.out(1.7)'
                    }
                );
            }

            // Animar botón inactivo
            gsap.to(inactiveBtn, {
                scale: 0.95,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }, [viewMode]);

    // Función para resaltar fechas con eventos
    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const formattedDate = date.toISOString().split('T')[0];
            const hasEvent = historias.some(historia => historia.fecha === formattedDate);
            return hasEvent ? 'has-event' : '';
        }
        // Para vistas de año y década
        if (view === 'year' || view === 'decade') {
            // Verificar si hay eventos en ese mes o año
            const hasEvent = historias.some(historia => {
                const historiaDate = new Date(historia.fecha);
                if (view === 'year') {
                    // Verificar si hay eventos en ese mes
                    return historiaDate.getMonth() === date.getMonth() &&
                        historiaDate.getFullYear() === date.getFullYear();
                } else {
                    // Verificar si hay eventos en ese año
                    return historiaDate.getFullYear() === date.getFullYear();
                }
            });
            return hasEvent ? 'has-event-period' : '';
        }
    };

    // Función para manejar el hover sobre una fecha
    const handleTileHover = (event: React.MouseEvent<HTMLDivElement>, date: Date) => {
        const formattedDate = date.toISOString().split('T')[0];
        const eventosEnFecha = historias.filter(historia => historia.fecha === formattedDate);

        if (eventosEnFecha.length > 0) {
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltip({
                date: formattedDate,
                eventos: eventosEnFecha,
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        }
    };

    // Función para ocultar el tooltip
    const handleTileLeave = () => {
        if (tooltipRef.current) {
            gsap.to(tooltipRef.current, {
                opacity: 0,
                scale: 0.8,
                duration: 0.2,
                onComplete: () => setTooltip(null)
            });
        } else {
            setTooltip(null);
        }
    };

    // Añadir content al tile para detectar hover
    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const formattedDate = date.toISOString().split('T')[0];
            const hasEvent = historias.some(historia => historia.fecha === formattedDate);

            if (hasEvent) {
                return (
                    <div
                        className="absolute inset-0"
                        onMouseEnter={(e) => handleTileHover(e, date)}
                        onMouseLeave={handleTileLeave}
                    />
                );
            }
        }
        // Añadir indicador visual (punto) para vistas de año y década
        if (view === 'year' || view === 'decade') {
            const hasEvent = historias.some(historia => {
                const historiaDate = new Date(historia.fecha);
                if (view === 'year') {
                    return historiaDate.getMonth() === date.getMonth() &&
                        historiaDate.getFullYear() === date.getFullYear();
                } else {
                    return historiaDate.getFullYear() === date.getFullYear();
                }
            });

            if (hasEvent) {
                return (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                );
            }
        }
        return null;
    };    // Función para manejar el click en una fecha
    const handleDateClick = (value: Date) => {
        if (!value) return;

        setDate(value);
        const formattedDate = value.toISOString().split('T')[0];
        const eventosEnFecha = historias.filter(historia => historia.fecha === formattedDate);
        setDisplayedEventos(eventosEnFecha);
        setIsSearching(false);
    };

    // Función para buscar eventos
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(searchValue);
        setIsSearching(searchValue.length > 0);

        if (searchValue) {
            // Búsqueda más específica
            const filtered = historias.filter(historia =>
                historia.nombre.toLowerCase().includes(searchValue) ||
                historia.integrantes.some(integrante =>
                    integrante.nombre.toLowerCase().includes(searchValue)
                )
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    // Función para seleccionar un evento desde la búsqueda
    const handleEventoClick = (evento: EventModel) => {
        const eventDate = new Date(evento.fecha + 'T00:00:00');
        setDate(eventDate);
        setIsSearching(false);
        setSearchTerm('');
        setSearchResults([]);
        setDisplayedEventos([evento]); // Solo mostramos el evento seleccionado
    };

    return (
        <div>
            {/* Barra de navegación superior */}
            <div className="mb-6">
                <div className="container">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative grow max-w-xl">
                            <input
                                type="text"
                                placeholder="Buscar eventos históricos de Colombia..."
                                className="w-full p-2 border border-gray-200 rounded-xl bg-white 
                                        transition-all duration-300 
                                        focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none
                                        text-base"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>

                        {/* Toggle de vista - Estilo switch */}
                        <div className="flex items-center bg-gray-100 rounded-full p-1 relative">
                            <button
                                ref={calendarBtnRef}
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${viewMode === 'calendar'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {/* Icono de calendario */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="font-medium">Calendario</span>
                            </button>

                            <button
                                ref={listBtnRef}
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {/* Icono de lista */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                                <span className="font-medium">Lista</span>
                            </button>
                        </div>
                    </div>

                    {/* Resultados de búsqueda */}
                    {isSearching && searchResults.length > 0 && (
                        <div className="absolute left-0 mt-1 w-xl bg-white rounded-xl shadow-xl 
                                        border border-blue-100 overflow-y-auto max-h-[80vh]">
                            {searchResults.map(evento => (
                                <div
                                    key={evento.id}
                                    className="p-4 hover:bg-blue-50 cursor-pointer border-b 
                                            border-blue-100 last:border-b-0 transition-colors duration-200"
                                    onClick={() => handleEventoClick(evento)}
                                >
                                    <h4 className="font-semibold text-lg text-gray-800 truncate">
                                        {evento.nombre}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="">
                                            <span className="text-sm text-gray-500">
                                                {(() => {
                                                    const date = new Date(evento.fecha + 'T00:00:00');
                                                    return date.toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    });
                                                })()}
                                            </span>
                                        </div>
                                        <div className="">
                                            <span className="text-sm text-gray-500 truncate">
                                                {evento.ubicacion}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto">
                {viewMode === 'calendar' ? (
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Calendario */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                                <Calendar
                                    onChange={(value: any) => {
                                        if (!value || Array.isArray(value)) return;
                                        handleDateClick(value);
                                    }}
                                    value={date}
                                    tileClassName={tileClassName}
                                    tileContent={tileContent}
                                    className="mx-auto"
                                    locale="es-ES"
                                />
                            </div>
                        </div>

                        {/* Lista de eventos del día */}
                        <div className="lg:col-span-2">
                            <div>
                                {displayedEventos.length > 0 ? (
                                    <div className="bg-white rounded-2xl shadow-xl p-6">
                                        <div className="flex items-center justify-between border-b border-blue-100 pb-4 mb-6">
                                            <h3 className="text-2xl font-bold text-gray-800">
                                                Eventos del{' '}
                                                <span className="text-blue-700">
                                                    {(() => {
                                                        // Aseguramos que la fecha se muestre en la zona horaria local
                                                        const localDate = new Date(date.toISOString().split('T')[0] + 'T00:00:00');
                                                        return localDate.toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        });
                                                    })()}
                                                </span>
                                            </h3>
                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {displayedEventos.length} evento{displayedEventos.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {displayedEventos.map(evento => (
                                                <div
                                                    key={evento.id}
                                                    className="group p-6 border-2 border-blue-100 rounded-xl 
                                                         cursor-pointer hover:border-blue-500 
                                                         transition-all duration-300 hover:shadow-md"
                                                    onClick={() => setSelectedEvento(evento)}
                                                >
                                                    <h4 className="font-bold text-xl text-gray-800 
                                                             group-hover:text-blue-700 transition-colors">
                                                        {evento.nombre}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                                        {evento.ubicacion}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                                        {evento.descripcion}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 text-center">
                                        <p className="text-gray-600 text-lg">No hay eventos registrados para esta fecha</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Vista de lista completa */
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        {historias.length > 0 ? (
                            <div className="space-y-4">
                                {historias.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(evento => (
                                    <div
                                        key={evento.id}
                                        className="group p-6 border-2 border-blue-100 rounded-xl 
                                                 cursor-pointer hover:border-blue-500 
                                                 transition-all duration-300 hover:shadow-md"
                                        onClick={() => setSelectedEvento(evento)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-xl text-gray-800 
                                                         group-hover:text-blue-700 transition-colors">
                                                {evento.nombre}
                                            </h4>
                                            <span className="text-sm text-gray-500">
                                                {new Date(evento.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {evento.ubicacion}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                                            {evento.descripcion}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-24 w-24 text-gray-400 mb-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    No hay eventos disponibles
                                </h3>
                                <p className="text-gray-500">
                                    Actualmente no hay eventos históricos registrados en el sistema
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tooltip para fechas con eventos */}
            {tooltip && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl max-w-xs">
                        <div className="text-sm font-semibold mb-1">
                            {tooltip.eventos.length} evento{tooltip.eventos.length !== 1 ? 's' : ''}
                        </div>
                        {tooltip.eventos.map((evento, index) => (
                            <div key={evento.id} className={index > 0 ? 'mt-1 pt-1 border-t border-blue-400' : ''}>
                                <p className="text-xs font-medium">{evento.nombre}</p>
                            </div>
                        ))}
                        {/* Flecha del tooltip */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-blue-600 rotate-45"
                        />
                    </div>
                </div>
            )}

            {/* Modal de evento */}
            {selectedEvento && (
                <EventModal
                    evento={selectedEvento}
                    onClose={() => setSelectedEvento(null)}
                />
            )}
        </div>
    );
};

export default CalendarView;