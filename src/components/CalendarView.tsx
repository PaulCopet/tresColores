import React, { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { gsap } from "gsap";
import type { EventModel } from "../backend/logic/models";
import EventModal from "./EventModal";
import AuthModal from "./auth/AuthModals";
import AdminPanel from "./AdminPanel";
import UserComments from "./UserComments";
import { createPortal } from "react-dom";
import type { AuthTokens, UsuarioSesion } from "../shared/authTypes";

// Lista de avatares disponibles
const avatares = [
  '/avatars/avatar1.webp',
  '/avatars/avatar2.webp',
  '/avatars/avatar3.webp',
  '/avatars/avatar4.webp',
  '/avatars/avatar5.webp',
];

// Función helper para obtener la URL del avatar según el número
const getAvatarUrl = (avatarNumber?: number | null): string => {
  if (!avatarNumber || avatarNumber < 1 || avatarNumber > 5) {
    return avatares[0]; // Avatar 1 por defecto
  }
  return avatares[avatarNumber - 1]; // Convertir número de usuario (1-5) a índice (0-4)
};

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
  const calendarRootRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // ====== Auth y modales ======
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isUserCommentsOpen, setIsUserCommentsOpen] = useState(false);

  // ====== Popover avatar (portal fijo) ======
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const positionMenu = () => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const width = 200; // ancho del popover
    const centerX = r.left + r.width / 2;
    setMenuPos({
      top: r.bottom + 8,
      left: Math.max(8, Math.min(centerX - width / 2, window.innerWidth - width - 8)),
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

  // Marcar como montado (solo cliente)
  useEffect(() => {
    setIsMounted(true);
    setIsHydrated(true);
  }, []);

  // Animaciones con GSAP (solo después de hidratación)
  useEffect(() => {
    if (!isHydrated) return; // No animar en la hidratación inicial

    if (viewMode === "calendar") {
      // Animar buscador
      gsap.fromTo(
        "[data-search]",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );

      // Animar calendario
      gsap.fromTo(
        "[data-calendar]",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.3, delay: 0.1, ease: "power2.out" }
      );

      // Animar lista del día
      gsap.fromTo(
        "[data-events]",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.3, delay: 0.1, ease: "power2.out" }
      );
    } else {
      // Vista lista
      gsap.fromTo(
        "[data-search]",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );

      gsap.fromTo(
        "[data-list]",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, delay: 0.1, ease: "power2.out" }
      );
    }
  }, [viewMode, historias, date, isHydrated]);

  // ====== Funciones para recargar datos ======
  const fetchHistorias = async () => {
    try {
      const res = await fetch("/api/historias");
      const data = await res.json();
      if (data.success) setHistorias(data.data);
    } catch (e) {
      console.error("Error al cargar historias:", e);
    }
  };

  // ====== Data & sesión ======
  useEffect(() => {
    fetchHistorias();

    const sesion = localStorage.getItem("usuario");
    if (sesion) {
      try {
        const base = JSON.parse(sesion) as UsuarioSesion;
        if (base && base.correo) {
          const tokensRaw = localStorage.getItem("authTokens");
          let tokens: AuthTokens | undefined;
          if (tokensRaw) {
            try {
              tokens = JSON.parse(tokensRaw) as AuthTokens;
            } catch {
              localStorage.removeItem("authTokens");
            }
          }
          setUsuario(tokens ? { ...base, tokens } : base);
        }
      } catch {
        localStorage.removeItem("usuario");
        localStorage.removeItem("authTokens");
      }
    } else {
      localStorage.removeItem("authTokens");
    }
  }, []);

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
    setTooltip(null);
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
        historias.filter((h) => {
          // Búsqueda por título
          if (h.nombre.toLowerCase().includes(q)) return true;

          // Búsqueda por integrantes
          if (h.integrantes.some((i) => i.nombre.toLowerCase().includes(q))) return true;

          // Búsqueda por ubicación
          if (h.ubicacion.toLowerCase().includes(q)) return true;

          // Búsqueda por descripción
          if (h.descripcion.toLowerCase().includes(q)) return true;

          // Búsqueda por fecha en diferentes formatos
          const fecha = h.fecha;
          if (fecha.includes(q)) return true;

          // Convertir fecha a formato legible y buscar
          try {
            const fechaObj = new Date(fecha + 'T00:00:00');
            const fechaLegible = fechaObj.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).toLowerCase();
            if (fechaLegible.includes(q)) return true;

            // Buscar por año, mes o día por separado
            const año = fechaObj.getFullYear().toString();
            const mes = fechaObj.toLocaleDateString('es-ES', { month: 'long' }).toLowerCase();
            const día = fechaObj.getDate().toString();

            if (año.includes(q) || mes.includes(q) || día.includes(q)) return true;
          } catch (error) {
            // Si hay error parseando fecha, continuar con otras búsquedas
          }

          return false;
        })
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
    // setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };
  // const openRegister = () => {
  //   setIsLoginOpen(false);
  //   setIsRegisterOpen(true);
  // };
  const handleAuthSuccess = (u: { uid: string; nombre: string; correo: string; rol: string; avatarNumber?: number }) => {
    const usuario: UsuarioSesion = {
      uid: u.uid,
      nombre: u.nombre,
      correo: u.correo,
      rol: u.rol,
      avatarNumber: u.avatarNumber,
    };
    setUsuario(usuario);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    setIsLoginOpen(false);
  };
  const handleLogout = () => {
    setMenuOpen(false);
    setUsuario(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("authTokens");
  };

  return (
    <div ref={calendarRootRef}>
      {/* NAV superior */}
      <nav className="mb-4 sticky top-0 z-40 ">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-4">


            {/* Buscador - centrado y flexible para mantener estética */}
            <div
              className="relative flex-1"
              data-search
            >
              <input
                type="text"
                placeholder="Buscar por evento, fecha, protagonista, ubicación..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-full bg-white 
                            transition-all duration-200 focus:border-blue-500 focus:ring-2
                            focus:ring-blue-200 focus:outline-none text-sm"
                value={searchTerm}
                onChange={handleSearch}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Controles derecha */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Toggle vista */}
              <div className="flex items-center bg-slate-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${viewMode === "calendar" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium hidden sm:inline">Calendario</span>
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${viewMode === "list" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="font-medium hidden sm:inline">Lista</span>
                </button>
              </div>

              {/* Botón condicional según el rol del usuario */}
              {usuario && (
                <div>
                  {usuario.rol === 'admin' ? (
                    <a
                      href="/admin/dashboard"
                      className="inline-flex items-center gap-2 p-3 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Panel Admin
                    </a>
                  ) : (
                    <button
                      onClick={() => setIsUserCommentsOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                      title="Ver mis comentarios"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Mis Comentarios
                    </button>
                  )}
                </div>
              )}

              {/* Acciones de usuario */}
              <div className="shrink-0 flex items-center gap-3">
                {usuario ? (
                  <>
                    <button
                      ref={anchorRef}
                      onClick={toggleMenu}
                      className="w-10 h-10 rounded-full overflow-hidden
                              shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105
                              ring-2 ring-white"
                      aria-haspopup="true"
                      aria-expanded={menuOpen}
                      title={`${usuario.nombre} (${usuario.rol})`}
                    >
                      <img
                        src={getAvatarUrl(usuario.avatarNumber)}
                        alt={usuario.nombre}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    {/* Portal del menú para garantizar z-index y no recorte */}
                    {menuOpen &&
                      createPortal(
                        <div
                          ref={menuRef}
                          className="fixed z-50 w-[200px] rounded-xl bg-white text-slate-900 p-3 shadow-lg popover-menu"
                          style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                        >
                          <p className="font-semibold leading-5 truncate text-gray-800">{usuario.nombre || "—"}</p>
                          <p className="text-xs text-gray-500 capitalize">{usuario.rol || "usuario"}</p>

                          <a
                            href="/usuario/configuracion"
                            className="mt-3 block w-full text-sm text-blue-600 hover:text-blue-500 text-left"
                          >
                            Configuración
                          </a>

                          <button
                            onClick={handleLogout}
                            className="mt-3 w-full text-sm text-red-500 hover:text-red-400 text-left"
                          >
                            Cerrar sesión
                          </button>
                        </div>,
                        document.body
                      )}
                  </>
                ) : (
                  <>
                    {/* Temporalmente ocultado - botón registrarse */}
                    {/* 
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setIsLoginOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-full bg-white text-blue-600 text-sm font-medium hover:bg-blue-50 transition shadow-sm border border-blue-200"
                    >
                      Registrarse
                    </button>
                    */}
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setIsLoginOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                      Ingresar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resultados de búsqueda - diseño minimalista */}
        <div className="container mx-auto px-4">
          {/* Resultados de búsqueda */}
          {isSearching && searchResults.length > 0 && (
            <div className="relative pb-2">
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="py-1">
                  {searchResults.map((evento, index) => (
                    <div
                      key={evento.id}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleEventoClick(evento)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{evento.nombre}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-gray-400 truncate">{evento.ubicacion}</span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                {searchResults.length > 5 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      {searchResults.length} resultados encontrados
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container mx-auto px-4">
        {viewMode === "calendar" ? (
          <div className="grid lg:grid-cols-6 gap-2">
            {/* Calendario */}
            <div
              className="lg:col-span-4"
              data-calendar
            >
              <div className="">
                {isMounted ? (
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
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-pulse text-slate-400">Cargando calendario...</div>
                  </div>
                )}
              </div>
            </div>

            {/* Lista del día */}
            <div
              className="lg:col-span-2"
              data-events
            >
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
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center z-10">
                    <p className="text-gray-600 text-lg">No hay eventos registrados para esta fecha</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Vista de lista
          <div className="bg-white rounded-2xl shadow-xl p-6" data-list>
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
      {selectedEvento && <EventModal evento={selectedEvento} usuario={usuario} onClose={() => setSelectedEvento(null)} />}

      <AuthModal
        isOpen={isLoginOpen}
        initialMode={authMode}
        onClose={() => setIsLoginOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Panel de Administración */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onEventCreated={fetchHistorias}
      />

      {/* Modal de comentarios del usuario */}
      {isUserCommentsOpen && usuario && (
        <UserComments
          usuario={usuario}
          onClose={() => setIsUserCommentsOpen(false)}
        />
      )}
    </div>
  );
};


export default CalendarView;
