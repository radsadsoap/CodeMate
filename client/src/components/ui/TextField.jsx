import { useId } from 'react';
import { cx } from '../../lib/cx';

// Same height, border and type size as a large button, so a field and its submit button line up.
export const inputStyles =
    'h-10 w-full border border-border-strong bg-surface px-3 text-base text-fg transition-[border-color,box-shadow] duration-150 placeholder:text-fg-subtle hover:border-fg-subtle focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/20 focus-visible:outline-none aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20 sm:text-[15px]';

export function TextField({ label, hint, error, trailing, className, inputClassName, id: providedId, ...inputProps }) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

    return (
        <div className={cx('flex flex-col gap-1.5', className)}>
            <label htmlFor={id} className="text-sm font-medium text-fg">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cx(inputStyles, trailing && 'pr-11', inputClassName)}
                    {...inputProps}
                />
                {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
            </div>
            {hint && (
                <p id={hintId} className="text-[13px] text-fg-subtle">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="text-[13px] font-medium text-danger-text">
                    {error}
                </p>
            )}
        </div>
    );
}
