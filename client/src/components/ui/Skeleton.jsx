import { cx } from '../../lib/cx';

export function Skeleton({ className }) {
    return <div aria-hidden className={cx('animate-pulse bg-surface-2', className)} />;
}
