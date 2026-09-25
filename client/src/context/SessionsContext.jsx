import {
    createContext,
    use,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useLocation } from 'react-router';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const REFRESH_MS = 20_000;

const SessionsContext = createContext(null);

// One copy of "my sessions", shared by the sidebar and the overview page.
export function SessionsProvider({ children }) {
    const { expire } = useAuth();
    const { pathname } = useLocation();
    const [sessions, setSessions] = useState(null);
    const [error, setError] = useState(null);

    const reload = useCallback(
        async (signal) => {
            try {
                const { sessions: list } = await api.listSessions(signal);
                setSessions(list);
                setError(null);
            } catch (loadError) {
                if (loadError.name === 'AbortError') return;
                if (loadError.status === 401) return expire();
                setError(loadError.message);
            }
        },
        [expire]
    );

    // Refetching on navigation makes a session you just created or joined appear right away.
    useEffect(() => {
        const controller = new AbortController();
        reload(controller.signal);
        const refresh = () =>
            document.visibilityState === 'visible' && reload(controller.signal);
        const timer = setInterval(refresh, REFRESH_MS);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            controller.abort();
            clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [reload, pathname]);

    const remove = useCallback(
        (roomId) =>
            setSessions(
                (current) =>
                    current?.filter((session) => session.roomId !== roomId) ??
                    current
            ),
        []
    );

    const patch = useCallback(
        (roomId, changes) =>
            setSessions(
                (current) =>
                    current?.map((session) =>
                        session.roomId === roomId
                            ? { ...session, ...changes }
                            : session
                    ) ?? current
            ),
        []
    );

    const value = useMemo(
        () => ({ sessions, error, reload, remove, patch }),
        [sessions, error, reload, remove, patch]
    );
    return <SessionsContext value={value}>{children}</SessionsContext>;
}

export function useSessions() {
    const context = use(SessionsContext);
    if (!context)
        throw new Error('useSessions must be used inside <SessionsProvider>.');
    return context;
}
