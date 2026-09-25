import { CaretRightIcon, HandIcon, PlusIcon, SignInIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { Link, NavLink, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useSessions } from '../../context/SessionsContext';
import { cx } from '../../lib/cx';
import { Logo } from '../Logo';
import { IconButton } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { UserPanel } from './UserPanel';

const SHORT_LANGUAGE = { python: 'py', javascript: 'js', java: 'java', cpp: 'c++' };

const rowStyles = ({ isActive }) =>
    cx(
        'relative flex h-8 items-center gap-2 px-2 text-[13px] transition-colors duration-150',
        'before:absolute before:inset-y-1.5 before:left-0 before:w-0.5',
        isActive ? 'bg-surface-3 font-medium text-fg before:bg-accent' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
    );

function SessionLink({ session, onNavigate }) {
    const hands = session.isOwner ? session.raisedHands : 0;
    return (
        <li>
            <NavLink to={`/session/${session.roomId}`} onClick={onNavigate} className={rowStyles}>
                <span className="min-w-0 flex-1 truncate">{session.title}</span>
                {hands > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-warning-text tabular-nums">
                        <HandIcon aria-hidden size={13} weight="fill" />
                        {hands}
                        <span className="sr-only">{hands === 1 ? 'raised hand' : 'raised hands'}</span>
                    </span>
                )}
                <span className="font-mono text-[11px] text-fg-subtle">{SHORT_LANGUAGE[session.language]}</span>
            </NavLink>
        </li>
    );
}

export function SessionsSidebar({ voiceSlotRef, onNavigate }) {
    const { user } = useAuth();
    const { sessions } = useSessions();
    const [, setParams] = useSearchParams();
    const isTa = user.role === 'teaching_assistant';
    const live = sessions?.filter((session) => session.isActive) ?? [];
    const ended = sessions?.filter((session) => !session.isActive) ?? [];

    const openDialog = (name) => {
        onNavigate?.();
        setParams((current) => {
            current.set('dialog', name);
            return current;
        });
    };

    return (
        <>
            <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
                <Link to="/session" onClick={onNavigate} aria-label="CodeMate, all sessions">
                    <Logo />
                </Link>
            </div>

            <nav aria-label="Sessions" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
                <NavLink to="/session" end onClick={onNavigate} className={rowStyles}>
                    <SquaresFourIcon aria-hidden size={16} />
                    All sessions
                </NavLink>

                <section aria-labelledby="sidebar-live" className="flex flex-col">
                    <div className="flex h-8 items-center justify-between pl-2">
                        <h2 id="sidebar-live" className="text-xs font-medium text-fg-subtle">
                            Live
                        </h2>
                        <div className="flex">
                            <IconButton size="sm" label="Join with a code" onClick={() => openDialog('join')}>
                                <SignInIcon aria-hidden size={16} />
                            </IconButton>
                            {isTa && (
                                <IconButton size="sm" label="New session" onClick={() => openDialog('new')}>
                                    <PlusIcon aria-hidden size={16} />
                                </IconButton>
                            )}
                        </div>
                    </div>
                    {!sessions && (
                        <div className="flex flex-col gap-1.5 px-2 py-1" aria-hidden>
                            <Skeleton className="h-5 w-4/5" />
                            <Skeleton className="h-5 w-3/5" />
                        </div>
                    )}
                    {sessions && live.length === 0 && (
                        <p className="px-2 py-1 text-[13px] text-fg-subtle">
                            {isTa ? 'Nothing live. Start a session with the plus button.' : 'Nothing live. Join with a code from your TA.'}
                        </p>
                    )}
                    <ul className="flex flex-col gap-px">
                        {live.map((session) => (
                            <SessionLink key={session.roomId} session={session} onNavigate={onNavigate} />
                        ))}
                    </ul>
                </section>

                {ended.length > 0 && (
                    <details className="group">
                        <summary className="flex h-8 list-none items-center gap-1 pl-2 text-xs font-medium text-fg-subtle hover:text-fg [&::-webkit-details-marker]:hidden">
                            <CaretRightIcon aria-hidden size={12} weight="bold" className="transition-transform duration-150 group-open:rotate-90" />
                            Ended ({ended.length})
                        </summary>
                        <ul className="flex flex-col gap-px">
                            {ended.map((session) => (
                                <SessionLink key={session.roomId} session={session} onNavigate={onNavigate} />
                            ))}
                        </ul>
                    </details>
                )}
            </nav>

            <div ref={voiceSlotRef} />
            <UserPanel />
        </>
    );
}
