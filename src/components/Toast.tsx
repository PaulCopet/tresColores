import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
    message, 
    type, 
    isVisible, 
    onClose,
    duration = 3000 
}) => {
    const toastRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && toastRef.current) {
            // Animación de entrada
            gsap.fromTo(
                toastRef.current,
                { 
                    y: -100, 
                    opacity: 0,
                    scale: 0.8
                },
                { 
                    y: 0, 
                    opacity: 1,
                    scale: 1,
                    duration: 0.4,
                    ease: 'back.out(1.7)'
                }
            );

            // Auto cerrar después del duration
            const timer = setTimeout(() => {
                if (toastRef.current) {
                    gsap.to(toastRef.current, {
                        y: -100,
                        opacity: 0,
                        scale: 0.8,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: onClose
                    });
                }
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    const handleClose = () => {
        if (toastRef.current) {
            gsap.to(toastRef.current, {
                y: -100,
                opacity: 0,
                scale: 0.8,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: onClose
            });
        }
    };

    if (!isVisible) return null;

    const styles = {
        success: {
            bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )
        },
        error: {
            bg: 'bg-gradient-to-r from-red-500 to-rose-600',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )
        },
        info: {
            bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            )
        }
    };

    const currentStyle = styles[type];

    return createPortal(
        <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pt-4 pointer-events-none">
            <div
                ref={toastRef}
                className={`${currentStyle.bg} text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-md w-full pointer-events-auto`}
            >
                <div className="flex-shrink-0">
                    {currentStyle.icon}
                </div>
                <p className="flex-1 font-medium text-sm leading-snug">
                    {message}
                </p>
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label="Cerrar notificación"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>,
        document.body
    );
};

export default Toast;
