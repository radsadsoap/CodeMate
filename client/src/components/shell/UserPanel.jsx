import { GearSixIcon, SignOutIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { roleLabel } from '../../lib/format';
import { ThemeToggle } from '../ThemeToggle';
import { Avatar } from '../ui/Avatar';
import { Button, IconButton } from '../ui/Button';

function SettingsMenu() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const panelId = useId();

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, [open]);

    const signOut = () => logout(() => navigate('/', { replace: true }));

    return (
        <div ref={rootRef}>
            <IconButton
                ref={triggerRef}
                size="sm"
                label="Settings"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((value) => !value)}
                className={open ? 'bg-surface-3 text-fg' : undefined}
            >
                <GearSixIcon aria-hidden size={17} />
            </IconButton>
            {open && (
                <div
                    id={panelId}
                    className="border-border-strong bg-surface shadow-pop absolute inset-x-2 bottom-full z-(--z-popover) mb-2 border"
                >
                    <div className="flex items-center justify-between gap-3 px-3 py-3">
                        <span className="text-fg text-[13px] font-medium">
                            Theme
                        </span>
                        <ThemeToggle size="sm" />
                    </div>
                    <div className="border-border border-t p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="w-full justify-start"
                        >
                            <SignOutIcon aria-hidden size={16} />
                            Sign out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function UserPanel() {
    const { user } = useAuth();

    return (
        <div className="border-border relative flex h-14 shrink-0 items-center gap-2.5 border-t px-3">
            <Avatar name={user.name} size={32} />
            <div className="min-w-0 flex-1 leading-tight">
                <p className="text-fg truncate text-[13px] font-medium">
                    {user.name}
                </p>
                <p className="text-fg-subtle text-xs">{roleLabel(user.role)}</p>
            </div>
            <SettingsMenu />
        </div>
    );
}
