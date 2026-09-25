import { XIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef } from 'react';
import { cx } from '../../lib/cx';
import { IconButton } from './Button';

export function Dialog({ open, onClose, title, description, children, className }) {
    const ref = useRef(null);
    const pressStartedOnBackdrop = useRef(false);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            dialog.querySelector('[data-autofocus]')?.focus();
        }
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            className={cx('dialog', className)}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onClose={onClose}
            onPointerDown={(event) => {
                pressStartedOnBackdrop.current = event.target === event.currentTarget;
            }}
            onClick={(event) => {
                // Only a press that starts and ends on the backdrop closes, so drag-selecting text is safe.
                if (pressStartedOnBackdrop.current && event.target === event.currentTarget) onClose();
            }}
        >
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-fg">
                            {title}
                        </h2>
                        {description && (
                            <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                                {description}
                            </p>
                        )}
                    </div>
                    <IconButton label="Close" size="sm" onClick={onClose} className="-mt-1 -mr-2">
                        <XIcon aria-hidden size={16} />
                    </IconButton>
                </div>
                <div className="mt-5">{children}</div>
            </div>
        </dialog>
    );
}
