import React from 'react';
import type { EventModel } from '../backend/logic/models';

interface EventModalProps {
    evento: EventModel | null;
    onClose: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ evento, onClose }) => {
    if (!evento) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
                <div className="sticky top-0 bg-white p-6 border-b border-green-100 z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{evento.nombre}</h2>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                <p className="flex items-center gap-1">
                                    {new Date(evento.fecha).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                                <p className="flex items-center gap-1">
                                    {evento.ubicacion}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    <div className="prose max-w-none">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            {evento.descripcion}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Personajes Principales</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {evento.integrantes.map((integrante, index) => (
                                <div
                                    key={index}
                                    className="bg-green-50 p-4 rounded-xl border border-green-100"
                                >
                                    <p className="font-bold text-green-800 text-lg">
                                        {integrante.nombre}
                                    </p>
                                    <p className="text-green-700 font-medium mt-1">
                                        {integrante.rol}
                                    </p>
                                    <p className="text-gray-600 mt-2 text-sm">
                                        {integrante.descripcion}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Consecuencias Históricas</h3>
                        <div className="bg-gray-50 rounded-xl p-6">
                            <ul className="space-y-3">
                                {evento.consecuencias.map((consecuencia, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-3 text-gray-700"
                                    >
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>{consecuencia}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; export default EventModal;