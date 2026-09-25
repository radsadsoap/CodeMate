import { createContext, use } from 'react';

// Lets pages inside the app shell open the sessions drawer and place voice controls in the sidebar.
export const ShellContext = createContext({ isDesktop: true, voiceSlot: null, openSidebar: () => {} });

export function useShell() {
    return use(ShellContext);
}
