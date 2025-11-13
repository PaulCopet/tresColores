import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { user, isUserLoading } from '../state/store';
import LoginModal from './auth/AuthModals'; // Corregido

const Header: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const currentUser = useStore(user);
    const isLoading = useStore(isUserLoading);
    const [menuVisible, setMenuVisible] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            // El estado de nanostores se actualizará automáticamente por el listener global
            window.location.reload(); // Forzar recarga para limpiar todo el estado
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <>
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo y título */}
                        <a href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🇨🇴</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">Tres Colores</h1>
                                <p className="text-xs text-gray-500">Historia de Colombia</p>
                            </div>
                        </a>

                        {/* Usuario y botón de login/logout */}
                        <div className="flex items-center gap-3">
                            {isLoading ? (
                                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            ) : currentUser ? (
                                <div className="relative">
                                    <button onClick={() => setMenuVisible(!menuVisible)} className="flex items-center gap-2">
                                        <img
                                            src={currentUser.photoURL || '/avatars/avatar1.png'}
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-blue-500 transition"
                                        />
                                        <span className="hidden sm:inline font-medium text-gray-700">{currentUser.displayName || currentUser.email}</span>
                                    </button>
                                    {menuVisible && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                            <a
                                                href="/usuario/configuracion"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Configuración
                                            </a>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Botón de ingresar */
                                <button
                                    onClick={() => setIsLoginOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
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
            {!currentUser && (
                <LoginModal
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                />
            )}
        </>
    );
};

export default Header;
