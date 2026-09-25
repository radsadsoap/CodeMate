import { HandIcon, LinkIcon, TrashIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { formatDate } from '../../lib/format';
import { languageById } from '../../lib/languages';
import { IconButton } from '../ui/Button';

// Shared by the header row and every session row so the columns always line up.
export const SESSION_COLUMNS = 'grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_7rem_9rem_8rem_4.5rem]';

export function SessionRow({ session, onCopy, onDelete }) {
    const hosted = session.isOwner ? 'you host' : `hosted by ${session.owner.name}`;
    const people = session.isActive ? `${session.online} online` : `${session.participantCount} joined`;
    const hands = session.isOwner && session.isActive ? session.raisedHands : 0;

    return (
        <li
            className={`group relative grid items-center gap-x-6 px-4 py-3 transition-colors duration-150 hover:bg-surface-2 ${SESSION_COLUMNS}`}
        >
            <div className="min-w-0">
                <Link
                    to={`/session/${session.roomId}`}
                    className="block truncate text-sm font-medium text-fg outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-focus"
                >
                    {session.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-fg-subtle">
                    <span translate="no" className="font-mono">
                        {session.roomId}
                    </span>
                    , {hosted}
                    <span className="md:hidden">, {languageById[session.language]?.label}</span>
                </p>
            </div>
            <span className="hidden text-[13px] text-fg-muted md:block">{languageById[session.language]?.label}</span>
            <span className="hidden items-center gap-3 text-[13px] text-fg-muted tabular-nums md:flex">
                {people}
                {hands > 0 && (
                    <span className="inline-flex items-center gap-1 text-warning-text">
                        <HandIcon aria-hidden size={14} weight="fill" />
                        {hands}
                        <span className="sr-only">{hands === 1 ? 'raised hand' : 'raised hands'}</span>
                    </span>
                )}
            </span>
            <time dateTime={session.createdAt} className="hidden text-[13px] text-fg-muted md:block">
                {formatDate(session.createdAt)}
            </time>
            <div className="relative flex justify-end gap-0.5">
                {session.isActive && (
                    <IconButton size="sm" label={`Copy invite link for ${session.title}`} onClick={() => onCopy(session)}>
                        <LinkIcon aria-hidden size={16} />
                    </IconButton>
                )}
                {session.isOwner && (
                    <IconButton
                        size="sm"
                        label={`Delete ${session.title}`}
                        onClick={() => onDelete(session)}
                        className="hover:bg-danger-soft hover:text-danger-text"
                    >
                        <TrashIcon aria-hidden size={16} />
                    </IconButton>
                )}
            </div>
        </li>
    );
}
