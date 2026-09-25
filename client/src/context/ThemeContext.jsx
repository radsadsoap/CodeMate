import { createContext, use, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const STORAGE_KEY = 'codemate-theme';
const THEME_COLORS = { light: '#fafafa', dark: '#0b0b0c' };

const ThemeContext = createContext(null);

function readPreference() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'light' || saved === 'dark' ? saved : 'system';
    } catch {
        return 'system';
    }
}

export function ThemeProvider({ children }) {
    const [preference, setPreferenceState] = useState(readPreference);
    const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
    const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = resolved;
        root.style.colorScheme = resolved;
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
    }, [resolved]);

    const setPreference = useCallback((next) => {
        setPreferenceState(next);
        try {
            if (next === 'system') localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage can be unavailable (private mode); the choice still applies for this visit.
        }
    }, []);

    const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
    return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
    const context = use(ThemeContext);
    if (!context) throw new Error('useTheme must be used inside <ThemeProvider>.');
    return context;
}
