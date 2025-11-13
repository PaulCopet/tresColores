import React, { useState, useEffect } from 'react';
import { ServiceProxy } from './ServiceProxy/index';

// Lista de avatares disponibles (índice 0-4, pero usaremos números 1-5 para el usuario)
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

interface Usuario {
    uid: string;
    nombre: string;
    correo: string; // Cambiar de 'email' a 'correo' para coincidir con UsuarioSesion
    rol?: string;
    displayName?: string;
    avatarNumber?: number; // Ahora usamos número en lugar de URL
}

const UserSettings = () => {
    const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [selectedAvatarNumber, setSelectedAvatarNumber] = useState(1); // Ahora es número
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Verificar autenticación desde localStorage (igual que CalendarView)
        const sesion = localStorage.getItem("usuario");
        if (sesion) {
            try {
                const usuario = JSON.parse(sesion) as Usuario;
                setCurrentUser(usuario);
                setDisplayName(usuario.nombre || '');
                setSelectedAvatarNumber(usuario.avatarNumber || 1); // Avatar 1 por defecto
            } catch (error) {
                console.error('Error parsing user session:', error);
                window.location.href = '/';
            }
        } else {
            // No hay sesión, redirigir a la página principal
            window.location.href = '/';
        }
        setLoading(false);
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            if (!currentUser?.uid) {
                setMessage('Error: No se encontró el ID del usuario.');
                return;
            }

            console.log('Actualizando perfil:', {
                uid: currentUser.uid,
                displayName,
                selectedAvatarNumber
            });

            // Actualizar en Firestore usando Client SDK
            const { db } = await import('../services/firebase/client');
            const { doc, updateDoc } = await import('firebase/firestore');

            const updateData: { nombre?: string; avatarNumber?: number } = {};
            updateData.nombre = displayName;
            updateData.avatarNumber = selectedAvatarNumber;

            await updateDoc(doc(db, 'users', currentUser.uid), updateData);

            // Actualizar localStorage con los nuevos valores
            const updatedUser = {
                ...currentUser!,
                nombre: displayName,
                displayName: displayName,
                avatarNumber: selectedAvatarNumber
            };
            localStorage.setItem('usuario', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);

            console.log('Perfil actualizado exitosamente:', updatedUser);
            setMessage('Perfil actualizado con éxito.');
            setIsEditing(false); // Salir del modo edición
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage(`Error al actualizar el perfil: ${error.message || 'Error desconocido'}`);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        if (newPassword.length < 6) {
            setMessage('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        try {
            // Cambiar contraseña usando Firebase Client SDK
            const { auth } = await import('../lib/firebase.client');
            const { updatePassword } = await import('firebase/auth');

            if (!auth.currentUser) {
                setMessage('Error: No hay usuario autenticado.');
                return;
            }

            await updatePassword(auth.currentUser, newPassword);
            setMessage('Contraseña actualizada con éxito.');
            setNewPassword('');
            setIsEditingPassword(false); // Salir del modo edición de contraseña
        } catch (error: any) {
            console.error('Error updating password:', error);
            if (error.code === 'auth/requires-recent-login') {
                setMessage('Por seguridad, debes volver a iniciar sesión antes de cambiar tu contraseña.');
            } else {
                setMessage('Error al actualizar la contraseña.');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Cargando...</div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">No has iniciado sesión.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Botón Regresar */}
                <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Regresar al inicio</span>
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Configuración de Usuario</h1>
                    <p className="text-gray-600">Personaliza tu perfil y ajustes de cuenta</p>
                </div>

                {/* Mensaje de estado */}
                {message && (
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 px-6 py-4 rounded-lg shadow-sm animate-fade-in">
                        <p className="text-green-800 font-medium">{message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sección de Avatar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Perfil</h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Modificar
                                    </button>
                                )}
                            </div>

                            {/* Avatar Principal */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative">
                                    <img
                                        src={isEditing ? getAvatarUrl(selectedAvatarNumber) : getAvatarUrl(currentUser.avatarNumber)}
                                        alt="Avatar actual"
                                        className="w-40 h-40 rounded-full border-4 border-indigo-100 shadow-xl object-cover"
                                    />
                                    {isEditing && (
                                        <div className="absolute bottom-2 right-2 bg-indigo-500 text-white rounded-full p-2 shadow-lg">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-4 text-gray-700 font-semibold text-lg">{currentUser.nombre}</p>
                                <p className="text-gray-500 text-sm">{currentUser.correo}</p>
                                {!isEditing && (
                                    <div className="mt-2 px-3 py-1 bg-indigo-50 rounded-full">
                                        <p className="text-xs text-indigo-600 font-medium">
                                            Avatar #{currentUser.avatarNumber || 1}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Galería de Avatares - Solo visible en modo edición */}
                            {isEditing && (
                                <div className="border-t border-gray-100 pt-6">
                                    <p className="text-sm font-semibold text-gray-700 mb-4">Selecciona un avatar</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {avatares.map((avatarUrl, index) => {
                                            const avatarNum = index + 1; // Convertir índice a número de avatar (1-5)
                                            return (
                                                <button
                                                    key={avatarUrl}
                                                    type="button"
                                                    onClick={() => setSelectedAvatarNumber(avatarNum)}
                                                    className={`relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-200 ${selectedAvatarNumber === avatarNum
                                                        ? 'ring-4 ring-indigo-500 scale-105 shadow-lg'
                                                        : 'ring-2 ring-gray-200 hover:ring-indigo-300 hover:scale-105'
                                                        }`}
                                                >
                                                    <img
                                                        src={avatarUrl}
                                                        alt={`Avatar ${avatarNum}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {selectedAvatarNumber === avatarNum && (
                                                        <div className="absolute inset-0 bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full w-6 h-6 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-gray-700">{avatarNum}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección de Formularios */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información del Perfil */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">Información del Perfil</h2>
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={currentUser.correo || ''}
                                            disabled
                                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="displayName" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Nombre de Usuario
                                        </label>
                                        <input
                                            type="text"
                                            id="displayName"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="Ingresa tu nombre"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setDisplayName(currentUser.nombre || '');
                                                setSelectedAvatarNumber(currentUser.avatarNumber || 1);
                                            }}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Correo Electrónico</p>
                                        <p className="text-base text-gray-800">{currentUser.correo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Nombre de Usuario</p>
                                        <p className="text-base text-gray-800">{currentUser.nombre}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cambiar Contraseña */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="bg-red-100 p-2 rounded-lg">
                                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-800">Seguridad</h2>
                                </div>
                                {!isEditingPassword && (
                                    <button
                                        onClick={() => setIsEditingPassword(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Cambiar
                                    </button>
                                )}
                            </div>

                            {isEditingPassword ? (
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Nueva Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                                        >
                                            Actualizar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingPassword(false);
                                                setNewPassword('');
                                            }}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-all duration-200"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Contraseña</p>
                                        <p className="text-base text-gray-800">••••••••</p>
                                    </div>
                                    <p className="text-xs text-gray-400">Última actualización hace 30 días</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
