import { cx } from '../../lib/cx';

const TONES = {
    neutral: 'bg-surface-2 text-fg-muted',
    accent: 'bg-accent-soft text-accent-soft-fg',
    warning: 'bg-warning-soft text-warning-text',
    danger: 'bg-danger-soft text-danger-text',
};

export function Badge({ tone = 'neutral', className, children }) {
    return (
        <span
            className={cx(
                'inline-flex h-5 items-center gap-1 px-1.5 text-xs font-medium whitespace-nowrap',
                TONES[tone],
                className
            )}
        >
            {children}
        </span>
    );
}
