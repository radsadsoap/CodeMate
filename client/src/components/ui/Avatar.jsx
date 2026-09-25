import { initials } from '../../lib/format';
import { cx } from '../../lib/cx';

export function Avatar({ name, color, size = 28, className }) {
    return (
        <span
            aria-hidden
            className={cx(
                'inline-grid shrink-0 place-items-center rounded-full font-semibold text-white select-none',
                !color && 'bg-fg-subtle',
                className
            )}
            style={{ width: size, height: size, backgroundColor: color, fontSize: Math.round(size * 0.38) }}
        >
            {initials(name)}
        </span>
    );
}
