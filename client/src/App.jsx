import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { RequireAuth } from './components/RequireAuth';
import { AppShell } from './components/shell/AppShell';

const Home = lazy(() => import('./pages/Home'));
const AuthPage = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Room = lazy(() => import('./pages/Room'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
    return (
        <>
            <a
                href="#main"
                className="focus:bg-surface focus:text-fg focus:shadow-pop sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-(--z-toast) focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
            >
                Skip to content
            </a>
            <Suspense
                fallback={<div className="bg-bg min-h-dvh" aria-busy="true" />}
            >
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route
                        path="/signup"
                        element={<AuthPage mode="signup" />}
                    />
                    <Route element={<RequireAuth />}>
                        <Route element={<AppShell />}>
                            <Route path="/session" element={<Dashboard />} />
                            <Route path="/session/:roomId" element={<Room />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </>
    );
}
