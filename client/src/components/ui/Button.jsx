import { CircleNotchIcon } from '@phosphor-icons/react';
import { cx } from '../../lib/cx';

// Every variant keeps a 1px border (transparent when filled) so buttons, selects and inputs of one size line up exactly.
const VARIANTS = {
    primary: 'border-transparent bg-accent text-accent-fg hover:bg-accent-hover',
    secondary: 'border-border-strong bg-surface text-fg hover:bg-surface-2',
    ghost: 'border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
    danger: 'border-transparent bg-danger text-white hover:bg-danger-hover',
    quiet: 'border-transparent text-danger-text hover:bg-danger-soft',
};

export const CONTROL_SIZES = {
    sm: 'h-8 gap-1.5 px-3 text-[13px]',
    md: 'h-9 gap-2 px-3.5 text-sm',
    lg: 'h-10 gap-2 px-4 text-[15px]',
};

const ICON_SIZES = { sm: 'size-8', md: 'size-9', lg: 'size-10' };

const BASE =
    'inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap border font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

export function buttonStyles({ variant = 'secondary', size = 'md', className } = {}) {
    return cx(BASE, VARIANTS[variant], CONTROL_SIZES[size], className);
}

export function Button({ variant, size, loading = false, disabled, className, children, type = 'button', ...props }) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonStyles({ variant, size, className })}
            {...props}
        >
            {loading && <CircleNotchIcon aria-hidden size={16} className="animate-spin" />}
            {children}
        </button>
    );
}

export function IconButton({ label, variant = 'ghost', size = 'md', className, children, ...props }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cx(BASE, VARIANTS[variant], ICON_SIZES[size], 'p-0', className)}
            {...props}
        >
            {children}
        </button>
    );
}
