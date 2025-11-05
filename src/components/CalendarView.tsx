import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
// import type { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';
import type { EventModel } from '../backend/logic/models';
import EventModal from './EventModal';

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

    // Función para resaltar fechas con eventos
    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === 'month') {
            const formattedDate = date.toISOString().split('T')[0];
            const hasEvent = historias.some(historia => historia.fecha === formattedDate);
            return hasEvent ? 'has-event' : '';
        }
    };

    // Función para manejar el click en una fecha
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
    }; return (
        <div>
            {/* Barra de navegación superior */}
            <div className="sticky top-0 z-10 mb-3">
                <div className="container">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative grow max-w-xl">
                            <input
                                type="text"
                                placeholder="Buscar eventos históricos de Colombia..."
                                className="w-full p-2 border border-gray-200 rounded-xl bg-white 
                                        transition-all duration-300 
                                        focus:border-green-500 focus:ring-1 focus:ring-green-200 focus:outline-none
                                        text-base"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <button
                            onClick={() => setViewMode(prev => prev === 'calendar' ? 'list' : 'calendar')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 
                                    transition-colors flex items-center whitespace-nowrap min-w-[140px]"
                        >
                            Ver en {viewMode === 'calendar' ? 'lista' : 'calendario'}
                        </button>
                    </div>

                    {/* Resultados de búsqueda */}
                    {isSearching && searchResults.length > 0 && (
                        <div className="absolute left-0 mt-1 w-[36rem] bg-white rounded-xl shadow-xl 
                                        border border-green-100 overflow-y-auto max-h-[80vh]">
                            {searchResults.map(evento => (
                                <div
                                    key={evento.id}
                                    className="p-4 hover:bg-green-50 cursor-pointer border-b 
                                            border-green-100 last:border-b-0 transition-colors duration-200"
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
                                    className="mx-auto"
                                    locale="es-ES"
                                />
                            </div>
                        </div>

                        {/* Lista de eventos del día */}
                        <div className="lg:col-span-2">
                            <div className="sticky top-28">
                                {displayedEventos.length > 0 ? (
                                    <div className="bg-white rounded-2xl shadow-xl p-6">
                                        <div className="flex items-center justify-between border-b border-green-100 pb-4 mb-6">
                                            <h3 className="text-2xl font-bold text-gray-800">
                                                Eventos del{' '}
                                                <span className="text-green-700">
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
                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {displayedEventos.length} evento{displayedEventos.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {displayedEventos.map(evento => (
                                                <div
                                                    key={evento.id}
                                                    className="group p-6 border-2 border-green-100 rounded-xl 
                                                         cursor-pointer hover:border-green-500 
                                                         transition-all duration-300 hover:shadow-md"
                                                    onClick={() => setSelectedEvento(evento)}
                                                >
                                                    <h4 className="font-bold text-xl text-gray-800 
                                                             group-hover:text-green-700 transition-colors">
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
                        <div className="space-y-4">
                            {historias.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(evento => (
                                <div
                                    key={evento.id}
                                    className="group p-6 border-2 border-green-100 rounded-xl 
                                             cursor-pointer hover:border-green-500 
                                             transition-all duration-300 hover:shadow-md"
                                    onClick={() => setSelectedEvento(evento)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-xl text-gray-800 
                                                     group-hover:text-green-700 transition-colors">
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
                    </div>
                )}
            </div>

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