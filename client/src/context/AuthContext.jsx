import {
    createContext,
    startTransition,
    use,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [state, setState] = useState({ status: 'loading', user: null });

    useEffect(() => {
        const controller = new AbortController();
        api.me(controller.signal)
            .then(({ user }) =>
                setState(
                    user
                        ? { status: 'authenticated', user }
                        : { status: 'anonymous', user: null }
                )
            )
            .catch((error) => {
                if (error.name !== 'AbortError')
                    setState({ status: 'anonymous', user: null });
            });
        return () => controller.abort();
    }, []);

    const login = useCallback(async (input) => {
        const { user } = await api.login(input);
        setState({ status: 'authenticated', user });
        return user;
    }, []);

    const register = useCallback(async (input) => {
        const { user } = await api.register(input);
        setState({ status: 'authenticated', user });
        return user;
    }, []);

    // `leave` shares the transition that clears the user, so a protected page never renders signed out and bounces to /login.
    const logout = useCallback(async (leave) => {
        await api.logout().catch(() => {});
        startTransition(() => {
            leave?.();
            setState({ status: 'anonymous', user: null });
        });
    }, []);

    // Called when any request comes back 401 so protected pages redirect to sign-in.
    const expire = useCallback(
        () => setState({ status: 'anonymous', user: null }),
        []
    );

    const value = useMemo(
        () => ({ ...state, login, register, logout, expire }),
        [state, login, register, logout, expire]
    );

    return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
    const context = use(AuthContext);
    if (!context)
        throw new Error('useAuth must be used inside <AuthProvider>.');
    return context;
}
