import { ArrowClockwiseIcon, PlusIcon, SignInIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { SESSION_COLUMNS, SessionRow } from '../components/dashboard/SessionRow';
import { PageHeader } from '../components/shell/PageHeader';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { cx } from '../lib/cx';
import { inviteLink } from '../lib/roomCode';

function EmptyState({ isTa, onCreate, onJoin }) {
    return (
        <div className="dot-grid border border-border px-6 py-16 text-center">
            <h2 className="text-base font-semibold text-fg">{isTa ? 'No sessions yet' : 'You have not joined a session yet'}</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-fg-muted">
                {isTa
                    ? 'Start one, then share its code with your class. Sessions you run show up here.'
                    : 'Ask your TA for a session code. Every session you join stays here, even after it ends.'}
            </p>
            <Button variant="primary" className="mt-6" onClick={isTa ? onCreate : onJoin}>
                {isTa ? <PlusIcon aria-hidden size={16} weight="bold" /> : <SignInIcon aria-hidden size={16} />}
                {isTa ? 'New session' : 'Join with a code'}
            </Button>
        </div>
    );
}

function SessionTable({ id, title, sessions, onCopy, onDelete }) {
    if (sessions.length === 0) return null;
    return (
        <section aria-labelledby={id} className="flex flex-col gap-3">
            <h2 id={id} className="text-[13px] font-semibold text-fg">
                {title} <span className="font-normal text-fg-subtle tabular-nums">{sessions.length}</span>
            </h2>
            <div className="border border-border bg-surface">
                <div
                    aria-hidden
                    className={cx('hidden gap-x-6 border-b border-border px-4 py-2 text-xs font-medium text-fg-subtle md:grid', SESSION_COLUMNS)}
                >
                    <span>Session</span>
                    <span>Language</span>
                    <span>People</span>
                    <span>Created</span>
                    <span />
                </div>
                <ul className="divide-y divide-border">
                    {sessions.map((session) => (
                        <SessionRow key={session.roomId} session={session} onCopy={onCopy} onDelete={onDelete} />
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const { sessions, error, reload, remove } = useSessions();
    const notify = useToast();
    const [, setParams] = useSearchParams();
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isTa = user.role === 'teaching_assistant';

    const openDialog = (name) =>
        setParams((current) => {
            current.set('dialog', name);
            return current;
        });

    const copyInvite = async (session) => {
        try {
            await navigator.clipboard.writeText(inviteLink(session.roomId));
            notify({ title: 'Invite link copied', description: session.title, tone: 'success' });
        } catch {
            notify({ title: `Share this code: ${session.roomId}`, duration: 8000 });
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await api.deleteSession(pendingDelete.roomId);
            remove(pendingDelete.roomId);
            notify({ title: 'Session deleted', description: pendingDelete.title });
            setPendingDelete(null);
        } catch (deleteError) {
            notify({ title: deleteError.message, tone: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const live = sessions?.filter((session) => session.isActive) ?? [];
    const ended = sessions?.filter((session) => !session.isActive) ?? [];

    return (
        <>
            <PageHeader>
                <h1 className="text-[15px] font-semibold tracking-tight text-fg">All sessions</h1>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant={isTa ? 'secondary' : 'primary'} size="sm" onClick={() => openDialog('join')}>
                        <SignInIcon aria-hidden size={15} />
                        Join with a code
                    </Button>
                    {isTa && (
                        <Button variant="primary" size="sm" onClick={() => openDialog('new')}>
                            <PlusIcon aria-hidden size={15} weight="bold" />
                            New session
                        </Button>
                    )}
                </div>
            </PageHeader>

            <main id="main" className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
                    {error && !sessions && (
                        <div role="alert" className="flex flex-col items-start gap-3 border border-danger/40 bg-danger-soft px-4 py-3 sm:flex-row sm:items-center">
                            <p className="flex-1 text-sm text-danger-text">{error}</p>
                            <Button size="sm" onClick={() => reload()}>
                                <ArrowClockwiseIcon aria-hidden size={15} />
                                Try again
                            </Button>
                        </div>
                    )}

                    {!sessions && !error && (
                        <div className="flex flex-col gap-3" aria-busy="true">
                            <span className="sr-only">Loading sessions…</span>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    )}

                    {sessions?.length === 0 && (
                        <EmptyState isTa={isTa} onCreate={() => openDialog('new')} onJoin={() => openDialog('join')} />
                    )}

                    <SessionTable id="live-heading" title="Live" sessions={live} onCopy={copyInvite} onDelete={setPendingDelete} />
                    <SessionTable id="ended-heading" title="Ended" sessions={ended} onCopy={copyInvite} onDelete={setPendingDelete} />
                </div>
            </main>

            <Dialog
                open={Boolean(pendingDelete)}
                onClose={() => !deleting && setPendingDelete(null)}
                title={`Delete “${pendingDelete?.title ?? ''}”?`}
                description="This removes the session and its code for everyone who joined. It cannot be undone."
            >
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="lg" onClick={() => setPendingDelete(null)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" size="lg" onClick={confirmDelete} loading={deleting}>
                        {deleting ? 'Deleting…' : 'Delete session'}
                    </Button>
                </div>
            </Dialog>
        </>
    );
}
