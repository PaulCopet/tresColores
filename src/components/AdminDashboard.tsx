import React, { useEffect, useMemo, useState } from "react";
import type { EventModel } from "../backend/logic/models";
import AdminPanel from "./AdminPanel";
import EventModal from "./EventModal";

const AdminDashboard: React.FC = () => {
    const [historias, setHistorias] = useState<EventModel[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingEvento, setEditingEvento] = useState<EventModel | null>(null);
    const [selectedEvento, setSelectedEvento] = useState<EventModel | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    const fetchHistorias = async () => {
        try {
            const res = await fetch("/api/historias");
            const data = await res.json();
            if (data.success) {
                setHistorias(data.data);
            }
        } catch (e) {
            console.error("Error al cargar historias:", e);
        }
    };

    useEffect(() => {
        fetchHistorias();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este evento?")) return;

        try {
            const res = await fetch(`/api/events/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                await fetchHistorias();
                if (selectedEvento?.id === id) setSelectedEvento(null);
                if (editingEvento?.id === id) setEditingEvento(null);
                alert("Evento eliminado exitosamente");
            } else {
                alert("Error al eliminar evento: " + data.error);
            }
        } catch (e) {
            console.error("Error al eliminar evento:", e);
            alert("Error al eliminar el evento");
        }
    };

    const filteredHistorias = useMemo(() => {
        const base = searchTerm
            ? historias.filter(
                (h) =>
                    h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    h.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    h.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : historias;

        return base.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    }, [historias, searchTerm]);

    const openCreatePanel = () => {
        setEditingEvento(null);
        setIsPanelOpen(true);
    };

    const openEditPanel = (evento: EventModel) => {
        setEditingEvento(evento);
        setIsPanelOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-100 py-10">
            <div className="max-w-7xl mx-auto px-4 space-y-8">
                <header className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-sm font-medium text-blue-600">tresColores</p>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Panel de Administración</h1>
                            <p className="text-sm text-slate-500">Gestiona las historias históricas registradas en la plataforma</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <a
                            href="/calendario"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Ver calendario
                        </a>
                        <button
                            onClick={openCreatePanel}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva historia
                        </button>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Historias registradas</h2>
                            <p className="text-sm text-slate-500">{filteredHistorias.length} resultado(s)</p>
                        </div>
                        <div className="relative ml-auto w-full max-w-xs">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="Buscar por nombre, descripción o ubicación"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">Historia</th>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Ubicación</th>
                                    <th className="px-6 py-3">Etiquetas</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistorias.map((evento) => (
                                    <tr
                                        key={evento.id}
                                        className={`transition-colors ${highlightedId === evento.id ? "bg-slate-50" : "hover:bg-slate-50"
                                            }`}
                                        onMouseEnter={() => setHighlightedId(evento.id)}
                                        onMouseLeave={() => setHighlightedId((prev) => (prev === evento.id ? null : prev))}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-slate-900">{evento.nombre}</span>
                                                <span className="text-sm text-slate-500 line-clamp-1">{evento.descripcion}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                {evento.ubicacion}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                                    {evento.integrantes.length} integrante{evento.integrantes.length !== 1 ? "s" : ""}
                                                </span>
                                                {evento.consecuencias.length > 0 && (
                                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                                                        {evento.consecuencias.length} consecuencia{evento.consecuencias.length !== 1 ? "s" : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedEvento(evento)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                                                    title="Ver detalles"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openEditPanel(evento)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                                                    title="Editar historia"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L13 14l-4 1 1-4 8.5-8.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(evento.id)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                                                    title="Eliminar historia"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredHistorias.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center text-slate-500">
                            <svg className="h-14 w-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M5 6h14M5 6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2" />
                            </svg>
                            <p className="text-sm font-medium">
                                {searchTerm ? "No se encontraron historias con los criterios de búsqueda." : "Aún no hay historias registradas."}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={openCreatePanel}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Registrar la primera historia
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {selectedEvento && (
                <EventModal evento={selectedEvento} onClose={() => setSelectedEvento(null)} />
            )}

            <AdminPanel
                isOpen={isPanelOpen}
                editingEvent={editingEvento}
                onClose={() => {
                    setIsPanelOpen(false);
                    setEditingEvento(null);
                }}
                onEventCreated={() => {
                    fetchHistorias();
                    setIsPanelOpen(false);
                    setEditingEvento(null);
                }}
            />
        </div>
    );
};

export default AdminDashboard;
