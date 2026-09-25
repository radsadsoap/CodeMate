import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createContext, use, useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../lib/cx';

const ToastContext = createContext(null);

const TONES = {
    neutral: { icon: InfoIcon, className: 'text-fg-muted' },
    success: { icon: CheckCircleIcon, className: 'text-accent-text' },
    warning: { icon: InfoIcon, className: 'text-warning-text' },
    error: { icon: WarningCircleIcon, className: 'text-danger-text' },
};

let lastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback(
        ({ title, description, tone = 'neutral', icon, duration = 4500 }) => {
            lastId += 1;
            const id = lastId;
            setToasts((current) => [...current.slice(-3), { id, title, description, tone, icon }]);
            timers.current.set(
                id,
                setTimeout(() => dismiss(id), duration)
            );
            return id;
        },
        [dismiss]
    );

    useEffect(() => {
        const pending = timers.current;
        return () => pending.forEach((timer) => clearTimeout(timer));
    }, []);

    return (
        <ToastContext value={notify}>
            {children}
            <Toaster toasts={toasts} onDismiss={dismiss} />
        </ToastContext>
    );
}

function Toaster({ toasts, onDismiss }) {
    const reduceMotion = useReducedMotion();

    return (
        <section
            aria-label="Notifications"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex flex-col items-center gap-2 p-4 sm:items-end"
        >
            <ol aria-live="polite" className="flex w-full max-w-sm flex-col gap-2">
                <AnimatePresence initial={false}>
                    {toasts.map((toast) => {
                        const tone = TONES[toast.tone] ?? TONES.neutral;
                        const Icon = toast.icon ?? tone.icon;
                        return (
                            <motion.li
                                key={toast.id}
                                layout={!reduceMotion}
                                initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                className="pointer-events-auto flex items-start gap-3 border border-border-strong bg-surface px-4 py-3 shadow-pop"
                            >
                                <Icon aria-hidden size={18} weight="bold" className={cx('mt-0.5 shrink-0', tone.className)} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-fg">{toast.title}</p>
                                    {toast.description && (
                                        <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{toast.description}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onDismiss(toast.id)}
                                    aria-label="Dismiss notification"
                                    className="-mr-1 grid size-6 shrink-0 cursor-pointer place-items-center text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                                >
                                    <XIcon aria-hidden size={14} />
                                </button>
                            </motion.li>
                        );
                    })}
                </AnimatePresence>
            </ol>
        </section>
    );
}

export function useToast() {
    const context = use(ToastContext);
    if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
    return context;
}
