import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { auth, db } from '../../services/firebase/client'; 
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

type Mode = 'login' | 'register';

export interface AuthUser {
  nombre: string;
  correo: string;
  rol: string;
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
    setMode(initialMode);           // resetea modo si el padre lo cambia
    setError('');
    setNombre('');
    setCorreo('');
    setContraseña('');
  }, [isOpen, initialMode]);

  // Animación
  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, y: -24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.6)' }
      );
    }
  }, [isOpen]);

  const closeWithAnim = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, { opacity: 0, scale: 0.9, duration: 0.2 });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose });
    } else {
      onClose();
    }
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, correo.trim(), contraseña);
      // trae rol/nombre desde Firestore
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      const data = snap.exists() ? snap.data() as any : {};
      const rol = data?.rol ?? 'usuario';
      const nombreUi =
        data?.nombre ??
        cred.user.displayName ??
        correo.split('@')[0];

      onAuthSuccess?.({ nombre: nombreUi, correo, rol });
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
      await setDoc(doc(db, 'users', user.uid), {
        nombre: nombre || correo.split('@')[0],
        correo,
        rol: 'usuario',               // SIEMPRE usuario (admin solo por dashboard/script)
        createdAt: serverTimestamp(),
      });

      onAuthSuccess?.({
        nombre: nombre || correo.split('@')[0],
        correo,
        rol: 'usuario',
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={closeWithAnim}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {mode === 'login' ? 'Ingresando...' : 'Creando cuenta...'}
              </>
            ) : (
              mode === 'login' ? 'Ingresar' : 'Registrarme'
            )}
          </button>

          {/* Toggle login/registro */}
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
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
