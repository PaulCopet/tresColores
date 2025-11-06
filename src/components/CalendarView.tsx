import React, { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { gsap } from "gsap";
import "animate.css";
import type { EventModel } from "../backend/logic/models";
import EventModal from "./EventModal";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { createPortal } from "react-dom";

const CalendarView: React.FC = () => {
  // ====== Estado general ======
  const [date, setDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [historias, setHistorias] = useState<EventModel[]>([]);
  const [searchResults, setSearchResults] = useState<EventModel[]>([]);
  const [displayedEventos, setDisplayedEventos] = useState<EventModel[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<EventModel | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // ====== Tooltip calendario ======
  const [tooltip, setTooltip] = useState<{
    date: string;
    eventos: EventModel[];
    x: number;
    y: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const calendarBtnRef = useRef<HTMLButtonElement>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);

  // ====== Auth y modales ======
  const [usuario, setUsuario] = useState<{ nombre: string; correo: string; rol: string } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // ====== Popover avatar (portal fijo) ======
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const positionMenu = () => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const width = 200; // ancho del popover
    setMenuPos({
      top: r.bottom + 8,
      left: Math.max(8, r.right - width),
    });
  };

  const openMenu = () => {
    positionMenu();
    setMenuOpen(true);
  };
  const toggleMenu = () => {
    positionMenu();
    setMenuOpen((v) => !v);
  };

  // Cerrar por click-fuera/ESC
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocDown, true); // captura
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocDown, true);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  // Reposicionar si se abre y cambia el viewport (scroll/resize)
  useEffect(() => {
    if (!menuOpen) return;
    const onWin = () => positionMenu();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [menuOpen]);

  // ====== Data & sesión ======
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/historias");
        const data = await res.json();
        if (data.success) setHistorias(data.data);
      } catch (e) {
        console.error("Error al cargar historias:", e);
      }
    })();

    const sesion = localStorage.getItem("usuario");
    if (sesion) {
      try {
        setUsuario(JSON.parse(sesion));
      } catch {
        localStorage.removeItem("usuario");
      }
    }
  }, []);

  // ====== Animaciones ======
  useEffect(() => {
    if (tooltip && tooltipRef.current) {
      gsap.fromTo(
        tooltipRef.current,
        { opacity: 0, scale: 0.8, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [tooltip]);

  useEffect(() => {
    const activeBtn = viewMode === "calendar" ? calendarBtnRef.current : listBtnRef.current;
    const inactiveBtn = viewMode === "calendar" ? listBtnRef.current : calendarBtnRef.current;
    if (activeBtn && inactiveBtn) {
      gsap.fromTo(activeBtn, { scale: 0.95, opacity: 0.8 }, { scale: 1, opacity: 1, duration: 0.4, ease: "elastic.out(1,0.6)" });
      const activeIcon = activeBtn.querySelector("svg");
      if (activeIcon) {
        gsap.fromTo(activeIcon, { rotate: -10, scale: 0.8 }, { rotate: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" });
      }
      gsap.to(inactiveBtn, { scale: 0.95, duration: 0.3, ease: "power2.out" });
    }
  }, [viewMode]);

  // ====== Helpers calendario ======
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const formatted = date.toISOString().split("T")[0];
      return historias.some((h) => h.fecha === formatted) ? "has-event" : "";
    }
    if (view === "year" || view === "decade") {
      const hasEvent = historias.some((h) => {
        const d = new Date(h.fecha);
        return view === "year"
          ? d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
          : d.getFullYear() === date.getFullYear();
      });
      return hasEvent ? "has-event-period" : "";
    }
    return "";
  };

  const handleTileHover = (ev: React.MouseEvent<HTMLDivElement>, date: Date) => {
    const formatted = date.toISOString().split("T")[0];
    const eventos = historias.filter((h) => h.fecha === formatted);
    if (eventos.length) {
      const rect = ev.currentTarget.getBoundingClientRect();
      setTooltip({ date: formatted, eventos, x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  };

  const handleTileLeave = () => {
    if (tooltipRef.current) {
      gsap.to(tooltipRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.2,
        onComplete: () => setTooltip(null),
      });
    } else setTooltip(null);
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const formatted = date.toISOString().split("T")[0];
      if (historias.some((h) => h.fecha === formatted)) {
        return (
          <div className="absolute inset-0" onMouseEnter={(e) => handleTileHover(e, date)} onMouseLeave={handleTileLeave} />
        );
      }
    }
    if (view === "year" || view === "decade") {
      const hasEvent = historias.some((h) => {
        const d = new Date(h.fecha);
        return view === "year"
          ? d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
          : d.getFullYear() === date.getFullYear();
      });
      if (hasEvent) {
        return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />;
      }
    }
    return null;
  };

  const handleDateClick = (value: Date) => {
    if (!value) return;
    setDate(value);
    const formatted = value.toISOString().split("T")[0];
    setDisplayedEventos(historias.filter((h) => h.fecha === formatted));
    setIsSearching(false);
  };

  // ====== Búsqueda ======
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toLowerCase();
    setSearchTerm(q);
    setIsSearching(!!q);
    if (q) {
      setSearchResults(
        historias.filter(
          (h) =>
            h.nombre.toLowerCase().includes(q) ||
            h.integrantes.some((i) => i.nombre.toLowerCase().includes(q))
        )
      );
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleEventoClick = (evento: EventModel) => {
    const d = new Date(evento.fecha + "T00:00:00");
    setDate(d);
    setIsSearching(false);
    setSearchTerm("");
    setSearchResults([]);
    setDisplayedEventos([evento]);
  };

  // ====== Auth handlers ======
  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };
  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };
  const handleAuthSuccess = (u: { nombre: string; correo: string; rol: string }) => {
    setUsuario(u);
    localStorage.setItem("usuario", JSON.stringify(u));
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
  };
  const handleLogout = () => {
    setMenuOpen(false);
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

  return (
    <div>
      {/* NAV superior */}
      <div className="mb-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Buscador */}
            <div className="relative grow max-w-2xl animate__animated animate__fadeInDown">
              <input
                type="text"
                placeholder="Buscar eventos históricos de Colombia..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-3xl bg-white 
                           transition-all duration-300 focus:border-blue-500 focus:ring-2
                           focus:ring-blue-200 focus:outline-none text-base"
                value={searchTerm}
                onChange={handleSearch}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Toggle vista */}
            <div className="flex items-center bg-gray-100 rounded-full p-1 relative shrink-0 animate__animated animate__fadeInLeft">
              <button
                ref={calendarBtnRef}
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                  viewMode === "calendar" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium hidden sm:inline">Calendario</span>
              </button>

              <button
                ref={listBtnRef}
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300 ${
                  viewMode === "list" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="font-medium hidden sm:inline">Lista</span>
              </button>
            </div>

            {/* Acciones de usuario */}
            <div className="shrink-0 flex items-center gap-3 animate__animated animate__fadeInUp">
              {usuario ? (
                <>
                  <button
                    ref={anchorRef}
                    onClick={toggleMenu}
                    onMouseEnter={openMenu}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                               flex items-center justify-center text-white font-bold text-sm
                               shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    title={`${usuario.nombre} (${usuario.rol})`}
                  >
                    {usuario.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </button>

                  {/* Portal del menú para garantizar z-index y no recorte */}
                  {menuOpen &&
                    createPortal(
                      <div
                        ref={menuRef}
                        role="menu"
                        className="fixed z-[99999] w-[200px] rounded-xl bg-slate-900 text-white p-3 shadow-2xl"
                        style={{ top: menuPos.top, left: menuPos.left }}
                      >
                        <p className="font-semibold leading-5 truncate">{usuario.nombre || "—"}</p>
                        <p className="text-xs text-slate-300 capitalize">{usuario.rol || "usuario"}</p>
                        <button onClick={handleLogout} className="mt-2 text-sm text-red-400 hover:text-red-300">
                          Cerrar sesión
                        </button>
                      </div>,
                      document.body
                    )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Ingresar
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute left-0 mt-1 w-xl bg-white rounded-xl shadow-xl border border-blue-100 overflow-y-auto max-h-[80vh] z-[99]">
              {searchResults.map((evento) => (
                <div
                  key={evento.id}
                  className="p-4 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors duration-200"
                  onClick={() => handleEventoClick(evento)}
                >
                  <h4 className="font-semibold text-lg text-gray-800 truncate">{evento.nombre}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">
                      {new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-sm text-gray-500 truncate">{evento.ubicacion}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto">
        {viewMode === "calendar" ? (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Calendario */}
            <div className="lg:col-span-3 animate__animated animate__fadeInLeft">
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <Calendar
                  onChange={(v: any) => {
                    if (!v || Array.isArray(v)) return;
                    handleDateClick(v);
                  }}
                  value={date}
                  tileClassName={tileClassName}
                  tileContent={tileContent}
                  className="mx-auto"
                  locale="es-ES"
                />
              </div>
            </div>

            {/* Lista del día */}
            <div className="lg:col-span-2 animate__animated animate__fadeInRight">
              <div>
                {displayedEventos.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-4 mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">
                        Eventos del{" "}
                        <span className="text-blue-700">
                          {new Date(date.toISOString().split("T")[0] + "T00:00:00").toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {displayedEventos.length} evento{displayedEventos.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {displayedEventos.map((evento) => (
                        <div
                          key={evento.id}
                          className="group p-6 border-2 border-blue-100 rounded-xl cursor-pointer hover:border-blue-500 transition-all duration-300 hover:shadow-md"
                          onClick={() => setSelectedEvento(evento)}
                        >
                          <h4 className="font-bold text-xl text-gray-800 group-hover:text-blue-700 transition-colors">
                            {evento.nombre}
                          </h4>
                          <p className="text-sm text-gray-500 mt-2">{evento.ubicacion}</p>
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{evento.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-8 text-center z-10">
                    <p className="text-gray-600 text-lg">No hay eventos registrados para esta fecha</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Vista de lista
          <div className="bg-white rounded-2xl shadow-xl p-6">
            {historias.length > 0 ? (
              <div className="space-y-4">
                {historias
                  .slice()
                  .sort((a, b) => a.fecha.localeCompare(b.fecha))
                  .map((evento) => (
                    <div
                      key={evento.id}
                      className="group p-6 border-2 border-blue-100 rounded-xl cursor-pointer hover:border-blue-500 transition-all duration-300 hover:shadow-md"
                      onClick={() => setSelectedEvento(evento)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xl text-gray-800 group-hover:text-blue-700 transition-colors">
                          {evento.nombre}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{evento.ubicacion}</p>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-3">{evento.descripcion}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay eventos disponibles</h3>
                <p className="text-gray-500">Actualmente no hay eventos históricos registrados en el sistema</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip fechas */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: "translate(-50%, -100%)" }}
        >
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-xl max-w-xs relative">
            <div className="text-sm font-semibold mb-1">
              {tooltip.eventos.length} evento{tooltip.eventos.length !== 1 ? "s" : ""}
            </div>
            {tooltip.eventos.map((evento, idx) => (
              <div key={evento.id} className={idx > 0 ? "mt-1 pt-1 border-t border-blue-400" : ""}>
                <p className="text-xs font-medium">{evento.nombre}</p>
              </div>
            ))}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-blue-600 rotate-45" />
          </div>
        </div>
      )}

      {/* Modales */}
      {selectedEvento && <EventModal evento={selectedEvento} onClose={() => setSelectedEvento(null)} />}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleAuthSuccess}
        onSwitchToRegister={openRegister}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleAuthSuccess}
        onSwitchToLogin={openLogin}
      />
    </div>
  );
};

export default CalendarView;
