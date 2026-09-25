import { CaretDownIcon } from '@phosphor-icons/react';
import { cx } from '../../lib/cx';
import { CONTROL_SIZES } from './Button';

// A native select dressed as a secondary button, so it sits flush next to buttons of the same size.
export function Select({ size = 'md', className, children, ...props }) {
    return (
        <span className={cx('relative inline-flex shrink-0', className)}>
            <select
                className={cx(
                    CONTROL_SIZES[size],
                    'w-full cursor-pointer appearance-none border border-border-strong bg-surface pr-8 font-medium text-fg transition-colors duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50'
                )}
                {...props}
            >
                {children}
            </select>
            <CaretDownIcon
                aria-hidden
                size={13}
                weight="bold"
                className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-subtle"
            />
        </span>
    );
}
