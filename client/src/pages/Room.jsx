import { MagnifyingGlassIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { EndedSession } from '../components/room/EndedSession';
import { LiveRoom } from '../components/room/LiveRoom';
import { PageHeader } from '../components/shell/PageHeader';
import { StateMessage } from '../components/StateMessage';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { api } from '../lib/api';

function RoomSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col" aria-busy="true">
            <span className="sr-only">Opening the session…</span>
            <PageHeader>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="ml-auto h-8 w-40" />
            </PageHeader>
            <div className="flex flex-1 flex-col gap-3 bg-editor-bg p-6">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/5" />
            </div>
        </div>
    );
}

function Message(props) {
    return (
        <>
            <PageHeader>
                <span className="text-[15px] font-semibold tracking-tight text-fg">Session</span>
            </PageHeader>
            <main id="main" className="min-h-0 flex-1 overflow-y-auto">
                <StateMessage {...props} />
            </main>
        </>
    );
}

export default function Room() {
    const { roomId } = useParams();
    const { expire } = useAuth();
    const { reload: reloadSessions } = useSessions();
    const [state, setState] = useState({ status: 'loading' });

    const load = useCallback(
        async (signal) => {
            try {
                const { session } = await api.getSession(roomId, signal);
                setState({ status: 'ready', session });
            } catch (error) {
                if (error.name === 'AbortError') return;
                if (error.status === 401) {
                    expire();
                    return;
                }
                const missing = error.status === 404 || error.status === 400;
                setState({ status: missing ? 'missing' : 'error', message: error.message });
            }
        },
        [roomId, expire]
    );

    useEffect(() => {
        const controller = new AbortController();
        setState({ status: 'loading' });
        load(controller.signal);
        return () => controller.abort();
    }, [load]);

    const onClosed = useCallback(
        (reason) => {
            reloadSessions();
            if (reason === 'ended') load();
            else if (reason === 'deleted') setState({ status: 'deleted' });
            else setState({ status: 'missing' });
        },
        [load, reloadSessions]
    );

    if (state.status === 'loading') return <RoomSkeleton />;

    if (state.status === 'missing') {
        return (
            <Message
                icon={MagnifyingGlassIcon}
                title="No session uses that code"
                description="Check the code or the link your TA shared. Codes look like abc-defg-hij."
            />
        );
    }

    if (state.status === 'deleted') {
        return <Message icon={TrashIcon} title="This session was deleted" description="The TA removed it, along with its code." />;
    }

    if (state.status === 'error') {
        return <Message icon={WarningCircleIcon} title="Could not open this session" description={state.message} />;
    }

    const { session } = state;
    return session.isActive ? (
        <LiveRoom key={session.roomId} session={session} onClosed={onClosed} />
    ) : (
        <EndedSession session={session} />
    );
}
