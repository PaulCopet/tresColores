import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void; // abre el modal de login
  onRegisterSuccess?: (usuario: {
    nombre: string;
    correo: string;
    rol: string;
  }) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onRegisterSuccess,
}) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && overlayRef.current && modalRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: -18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const closeWithAnim = () => {
    if (!overlayRef.current || !modalRef.current) return onClose();
    gsap.to(modalRef.current, {
      opacity: 0,
      y: -10,
      scale: 0.98,
      duration: 0.2,
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: onClose,
    });
  };

  const inputBase =
    "w-full pl-11 pr-3 py-3 rounded-xl border border-slate-200 bg-white/90 " +
    "shadow-[0_0_0_0_rgba(0,0,0,0)] outline-none transition " +
    "focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400";

  const labelBase = "block text-sm font-medium text-slate-700 mb-2";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) return setError("El nombre es obligatorio");
    if (!/\S+@\S+\.\S+/.test(correo)) return setError("Correo inválido");
    if (pass.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres");
    if (pass !== pass2) return setError("Las contraseñas no coinciden");

    try {
      setLoading(true);

      // 👉 Endpoint que ya conecta con Firebase (Auth + Firestore)
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, contraseña: pass }),
      });
      const data = await resp.json();
      if (!data?.success)
        throw new Error(data?.message || "No se pudo registrar");

      // Esperamos que el backend devuelva {usuario:{nombre,correo,rol}}
      const usuario = {
        nombre: data.usuario?.nombre ?? nombre,
        correo: data.usuario?.correo ?? correo,
        rol: data.usuario?.rol ?? "usuario",
      };

      // Guarda sesión local si quieres
      localStorage.setItem("usuario", JSON.stringify(usuario));

      onRegisterSuccess?.(usuario);
      closeWithAnim();
    } catch (err: any) {
      setError(err?.message || "Error al registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalUI = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] w-screen h-screen bg-slate-900/60 backdrop-blur-sm
                 flex items-center justify-center px-4"
      onClick={closeWithAnim}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
              Crear cuenta
            </h2>
            <button
              onClick={closeWithAnim}
              className="text-white/90 hover:text-white rounded-lg p-2 transition"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Card */}
        <div
          className="bg-white/90 backdrop-blur-xl border border-slate-200/80
                        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] p-6"
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className={labelBase}>Nombre</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.121 17.804A7 7 0 0112 14a7 7 0 016.879 3.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            </div>

            {/* Correo */}
            <div>
              <label className={labelBase}>Correo electrónico</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l9 6 9-6"
                    />
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
                    />
                  </svg>
                </span>
                <input
                  type="email"
                  className={inputBase}
                  placeholder="ejemplo@correo.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelBase}>Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z"
                    />
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21v-2a7 7 0 10-14 0v2"
                    />
                  </svg>
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  className={`${inputBase} pr-11`}
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelBase}>Confirmar contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11z"
                    />
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21v-2a7 7 0 10-14 0v2"
                    />
                  </svg>
                </span>
                <input
                  type={showPass2 ? "text" : "password"}
                  className={`${inputBase} pr-11`}
                  placeholder="••••••••"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass2((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showPass2 ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPass2 ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl
                         bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3
                         shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700
                         focus:ring-4 focus:ring-blue-200 transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      strokeWidth="4"
                      className="opacity-75"
                    />
                  </svg>
                  Registrando…
                </>
              ) : (
                "Registrarme"
              )}
            </button>

            {/* Switch */}
            <p className="text-center text-sm text-slate-600">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => {
                  closeWithAnim();
                  onSwitchToLogin();
                }}
                className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );

  // Portal para backdrop a pantalla completa
  return createPortal(modalUI, document.body);
};

export default RegisterModal;
