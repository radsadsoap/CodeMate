import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from './ui/Skeleton';

export function RequireAuth() {
    const { status } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
        return (
            <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6" aria-busy="true">
                <span className="sr-only">Loading your account…</span>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    if (status === 'anonymous') {
        const next = `${location.pathname}${location.search}`;
        return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
    }

    return <Outlet />;
}
