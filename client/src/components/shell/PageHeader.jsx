import { ListIcon } from '@phosphor-icons/react';
import { useShell } from '../../context/ShellContext';
import { cx } from '../../lib/cx';
import { IconButton } from '../ui/Button';

// The single-line bar at the top of every app page. Its controls all use the small size.
export function PageHeader({ className, children }) {
    const { isDesktop, openSidebar } = useShell();
    return (
        <header className={cx('flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 sm:px-4', className)}>
            {!isDesktop && (
                <IconButton size="sm" label="Open sessions" onClick={openSidebar} className="-ml-1">
                    <ListIcon aria-hidden size={18} />
                </IconButton>
            )}
            {children}
        </header>
    );
}
