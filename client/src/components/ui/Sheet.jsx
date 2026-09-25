import { useEffect, useRef } from 'react';

// Edge-anchored modal panel for small screens, built on <dialog> for Escape, focus trapping and the top layer.
export function Sheet({ open, onClose, side = 'left', label, children }) {
    const ref = useRef(null);
    const pressStartedOnBackdrop = useRef(false);

    useEffect(() => {
        const sheet = ref.current;
        if (!sheet) return;
        if (open && !sheet.open) sheet.showModal();
        if (!open && sheet.open) sheet.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            data-side={side}
            aria-label={label}
            className="sheet"
            onClose={onClose}
            onPointerDown={(event) => {
                pressStartedOnBackdrop.current = event.target === event.currentTarget;
            }}
            onClick={(event) => {
                if (pressStartedOnBackdrop.current && event.target === event.currentTarget) onClose();
            }}
        >
            <div className="flex h-full flex-col">{children}</div>
        </dialog>
    );
}
