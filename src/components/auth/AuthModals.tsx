import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { auth, db } from '../../services/firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

type Mode = 'login' | 'register';

export interface AuthUser {
  uid: string;
  nombre: string;
  correo: string;
  rol: string;
  avatarNumber?: number;
}

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: Mode;
  onClose: () => void;
  onAuthSuccess?: (u: AuthUser) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setNombre('');
    setCorreo('');
    setContraseña('');
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (isOpen && overlayRef.current && modalRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, ease: 'power2.out' }
      );
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  const closeWithAnim = () => {
    if (overlayRef.current && modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0, scale: 0.95, y: 10, duration: 0.2, ease: 'power2.in'
      });
      gsap.to(overlayRef.current, {
        opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, correo.trim(), contraseña);

      // Obtener datos del usuario desde Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userDocRef);
      const data = snap.exists() ? snap.data() as any : {};

      // rol: 1 = usuario, 2 = admin
      const rolNumero = data?.rol ?? 1;
      const rol = rolNumero === 2 ? 'admin' : 'usuario';

      const nombreUi = data?.nombre ?? cred.user.displayName ?? correo.split('@')[0];
      const avatarNumber = data?.avatarNumber || 1;

      // Migración: Si el documento no tiene uid o avatarNumber, agregarlos
      if (!data?.uid || !data?.avatarNumber) {
        await setDoc(userDocRef, {
          ...data,
          uid: cred.user.uid,
          avatarNumber: data?.avatarNumber || 1,
        }, { merge: true });
      }

      onAuthSuccess?.({
        uid: cred.user.uid,
        nombre: nombreUi,
        correo,
        rol,
        avatarNumber
      });
      closeWithAnim();
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, correo.trim(), contraseña);

      // Guardar en Firestore con rol = 1 (usuario por defecto)
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        nombre: nombre || correo.split('@')[0],
        correo,
        rol: 1, // 1 = usuario, 2 = admin (cambiar manualmente en Firestore)
        avatarNumber: 1, // Avatar 1 por defecto
        createdAt: serverTimestamp(),
      });

      onAuthSuccess?.({
        uid: user.uid,
        nombre: nombre || correo.split('@')[0],
        correo,
        rol: 'usuario',
        avatarNumber: 1
      });
      closeWithAnim();
    } catch (e: any) {
      setError(e?.message || 'No se pudo registrar');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !contraseña.trim()) {
      setError('Completa correo y contraseña');
      return;
    }
    if (mode === 'register' && !nombre.trim()) {
      setError('Escribe tu nombre');
      return;
    }
    if (mode === 'login') await handleLogin();
    else await handleRegister();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={closeWithAnim}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <button
              onClick={closeWithAnim}
              className="text-white/90 hover:bg-white/20 rounded-lg p-2 transition-colors"
              aria-label="Cerrar modal"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Tu nombre"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="ejemplo@correo.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {mode === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
              </>
            ) : (
              mode === 'login' ? 'Ingresar' : 'Registrarme'
            )}
          </button>

          {/* Toggle login/registro - Temporalmente ocultado */}
          {/* 
          <p className="text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
          */}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
