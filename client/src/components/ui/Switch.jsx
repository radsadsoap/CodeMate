import { useId } from 'react';
import { cx } from '../../lib/cx';

export function Switch({ checked, onChange, label, description, disabled }) {
    const labelId = useId();
    const descriptionId = useId();

    return (
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <p id={labelId} className="text-sm font-medium text-fg">
                    {label}
                </p>
                {description && (
                    <p id={descriptionId} className="mt-0.5 text-[13px] text-fg-subtle">
                        {description}
                    </p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-labelledby={labelId}
                aria-describedby={description ? descriptionId : undefined}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cx(
                    'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
                    checked ? 'border-accent bg-accent' : 'border-border-strong bg-surface-3'
                )}
            >
                <span
                    aria-hidden
                    className={cx(
                        'size-3.5 transition-transform duration-150 ease-out',
                        checked ? 'translate-x-[18px] bg-accent-fg' : 'translate-x-0.5 bg-fg-subtle'
                    )}
                />
            </button>
        </div>
    );
}
