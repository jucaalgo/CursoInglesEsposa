import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    action?: { label: string; onClick: () => void };
}

interface ToastMethods {
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    dismiss: (id?: string) => void;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, title: string, message?: string) => string;
    dismiss: (id?: string) => void;
    toast: ToastMethods;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let idCounter = 0;
function nextId(): string {
    return `toast-${++idCounter}`;
}

const AUTO_DISMISS_MS: Record<ToastType, number> = {
    success: 4000,
    error: 6000,
    warning: 4000,
    info: 4000,
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id?: string) => {
        if (id) {
            // Clear auto-dismiss timer
            const timer = timers.current.get(id);
            if (timer) {
                clearTimeout(timer);
                timers.current.delete(id);
            }
            setToasts((prev) => prev.filter((t) => t.id !== id));
        } else {
            // Dismiss all
            timers.current.forEach((timer) => clearTimeout(timer));
            timers.current.clear();
            setToasts([]);
        }
    }, []);

    const addToast = useCallback(
        (type: ToastType, title: string, message?: string): string => {
            const id = nextId();
            setToasts((prev) => [...prev, { id, type, title, message }]);

            // Auto-dismiss
            const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS[type]);
            timers.current.set(id, timer);

            return id;
        },
        [dismiss],
    );

    const toast: ToastMethods = React.useMemo(
        () => ({
            success: (title, message) => addToast('success', title, message),
            error: (title, message) => addToast('error', title, message),
            warning: (title, message) => addToast('warning', title, message),
            info: (title, message) => addToast('info', title, message),
            dismiss,
        }),
        [addToast, dismiss],
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, dismiss, toast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    };
    return context;
};