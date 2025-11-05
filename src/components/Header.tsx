import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import { gsap } from 'gsap';

const Header: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null);

    // Cargar sesión desde localStorage al montar
    useEffect(() => {
        const sesionGuardada = localStorage.getItem('usuario');
        if (sesionGuardada) {
            setUsuario(JSON.parse(sesionGuardada));
        }
    }, []);

    const handleLogin = (nombre: string, rol: string) => {
        const usuarioData = { nombre, rol };
        setUsuario(usuarioData);
        localStorage.setItem('usuario', JSON.stringify(usuarioData));

        // Mostrar mensaje de bienvenida
        const welcomeMsg = document.getElementById('welcome-message');
        if (welcomeMsg) {
            gsap.fromTo(
                welcomeMsg,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
            );
        }
    };

    const handleLogout = () => {
        setUsuario(null);
        localStorage.removeItem('usuario');
    };

    return (
        <>
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo y título */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🇨🇴</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Tres Colores</h1>
                                <p className="text-xs text-gray-500">Historia de Colombia</p>
                            </div>
                        </div>

                        {/* Usuario y botón de login/logout */}
                        <div className="flex items-center gap-3">
                            {usuario ? (
                                <>
                                    {/* Mensaje de bienvenida */}
                                    <div id="welcome-message" className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-gray-800">
                                            Bienvenido, <span className="text-blue-600">{usuario.nombre}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{usuario.rol}</p>
                                    </div>

                                    {/* Botón de cerrar sesión */}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="hidden sm:inline">Salir</span>
                                    </button>
                                </>
                            ) : (
                                /* Botón de ingresar */
                                <button
                                    onClick={() => setIsLoginOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Ingresar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal de Login */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLogin={handleLogin}
            />
        </>
    );
};

export default Header;
