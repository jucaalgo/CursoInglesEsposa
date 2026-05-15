import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastType, type Toast } from '../context/ToastContext';

const ICON_MAP: Record<ToastType, React.ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const STYLE_MAP: Record<ToastType, { bg: string; border: string; icon: string; accent: string }> = {
    success: {
        bg: 'var(--success-muted)',
        border: 'var(--success)',
        icon: 'var(--success)',
        accent: 'var(--success)',
    },
    error: {
        bg: 'var(--error-muted)',
        border: 'var(--error)',
        icon: 'var(--error)',
        accent: 'var(--error)',
    },
    warning: {
        bg: 'var(--warning-muted)',
        border: 'var(--warning)',
        icon: 'var(--warning)',
        accent: 'var(--warning)',
    },
    info: {
        bg: 'var(--accent-primary-muted)',
        border: 'var(--accent-primary)',
        icon: 'var(--accent-primary)',
        accent: 'var(--accent-primary)',
    },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const Icon = ICON_MAP[toast.type];
    const styles = STYLE_MAP[toast.type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
                background: 'var(--bg-card)',
                borderLeft: `3px solid ${styles.accent}`,
                boxShadow: 'var(--shadow)',
                backdropFilter: 'blur(12px)',
            }}
            className="flex items-start gap-3 rounded-lg p-4 min-w-[320px] max-w-[420px] pointer-events-auto"
        >
            {/* Icon */}
            <Icon
                size={20}
                style={{ color: styles.icon, flexShrink: 0, marginTop: 1 }}
                strokeWidth={2.5}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p
                    className="font-semibold text-sm leading-snug"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {toast.title}
                </p>
                {toast.message && (
                    <p
                        className="mt-0.5 text-xs leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {toast.message}
                    </p>
                )}

                {/* Optional action button */}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-2 text-xs font-semibold transition-colors hover:opacity-80"
                        style={{ color: styles.accent }}
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 p-0.5 rounded-md transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Dismiss notification"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, dismiss } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
};