import { Suspense, useMemo, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { SessionsProvider } from '../../context/SessionsContext';
import { ShellContext } from '../../context/ShellContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { CreateSessionDialog } from '../dashboard/CreateSessionDialog';
import { JoinSessionDialog } from '../dashboard/JoinSessionDialog';
import { Sheet } from '../ui/Sheet';
import { SessionsSidebar } from './SessionsSidebar';

// Signed-in layout: a persistent sessions sidebar on the left, the current page on the right.
export function AppShell() {
    const { user } = useAuth();
    const isDesktop = useMediaQuery('(min-width: 64rem)');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [voiceSlot, setVoiceSlot] = useState(null);
    const [params, setParams] = useSearchParams();
    const dialog = params.get('dialog');

    const closeDialog = () =>
        setParams(
            (current) => {
                current.delete('dialog');
                current.delete('code');
                return current;
            },
            { replace: true }
        );

    const shell = useMemo(() => ({ isDesktop, voiceSlot, openSidebar: () => setDrawerOpen(true) }), [isDesktop, voiceSlot]);
    const sidebar = <SessionsSidebar voiceSlotRef={setVoiceSlot} onNavigate={() => setDrawerOpen(false)} />;

    return (
        <SessionsProvider>
            <ShellContext value={shell}>
                <div className="flex h-dvh overflow-hidden bg-bg">
                    {isDesktop ? (
                        <aside aria-label="Sessions and account" className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
                            {sidebar}
                        </aside>
                    ) : (
                        <Sheet side="left" label="Sessions and account" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                            {sidebar}
                        </Sheet>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
                            <Outlet />
                        </Suspense>
                    </div>
                </div>

                {user.role === 'teaching_assistant' && <CreateSessionDialog open={dialog === 'new'} onClose={closeDialog} />}
                <JoinSessionDialog open={dialog === 'join'} onClose={closeDialog} initialCode={params.get('code')} />
            </ShellContext>
        </SessionsProvider>
    );
}
