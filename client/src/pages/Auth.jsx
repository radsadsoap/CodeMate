import {
    ChalkboardTeacherIcon,
    EyeIcon,
    EyeSlashIcon,
    StudentIcon,
} from '@phosphor-icons/react';
import { lazy, Suspense, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button, IconButton } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { cx } from '../lib/cx';

const CollabDemo = lazy(() => import('../components/landing/CollabDemo'));

const ROLES = [
    {
        value: 'student',
        title: 'Student',
        description: 'Join sessions with a code from your TA.',
        icon: StudentIcon,
    },
    {
        value: 'teaching_assistant',
        title: 'Teaching assistant',
        description: 'Create sessions, run them live and moderate.',
        icon: ChalkboardTeacherIcon,
    },
];

// Only same-origin paths are allowed as a post-sign-in destination. Parsing catches tricks
// like `/\host` or an embedded tab, which browsers normalize into `//host`.
function safeNext(value) {
    if (!value?.startsWith('/')) return '/session';
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin
        ? `${url.pathname}${url.search}${url.hash}`
        : '/session';
}

// Mirrors the server rules for instant feedback; the server still has the final say.
function validate(values, isSignup) {
    const errors = {};
    if (isSignup && values.name.trim().length < 2)
        errors.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim()))
        errors.email = 'Enter a valid email address, like name@school.edu.';
    if (!values.password) errors.password = 'Enter your password.';
    else if (isSignup && values.password.length < 8)
        errors.password = 'Use at least 8 characters.';
    if (isSignup && !values.role)
        errors.role = 'Choose Student or Teaching assistant.';
    return errors;
}

function RolePicker({ value, onChange, error }) {
    return (
        <fieldset
            aria-describedby={error ? 'role-error' : undefined}
            className="flex flex-col gap-2"
        >
            <legend className="text-fg mb-1.5 text-sm font-medium">
                Your role
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
                {ROLES.map(
                    ({ value: option, title, description, icon: Icon }) => (
                        <label
                            key={option}
                            className={cx(
                                'has-focus-visible:outline-focus flex cursor-pointer gap-3 border p-3 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                                value === option
                                    ? 'border-accent bg-accent-soft'
                                    : 'border-border-strong hover:bg-surface-2',
                                error && value !== option && 'border-danger/60'
                            )}
                        >
                            <input
                                type="radio"
                                name="role"
                                value={option}
                                checked={value === option}
                                onChange={() => onChange(option)}
                                className="sr-only"
                            />
                            <Icon
                                aria-hidden
                                size={20}
                                className={
                                    value === option
                                        ? 'text-accent-text'
                                        : 'text-fg-subtle'
                                }
                            />
                            <span className="min-w-0">
                                <span className="text-fg block text-sm font-medium">
                                    {title}
                                </span>
                                <span className="text-fg-muted mt-0.5 block text-xs leading-snug">
                                    {description}
                                </span>
                            </span>
                        </label>
                    )
                )}
            </div>
            {error && (
                <p
                    id="role-error"
                    className="text-danger-text text-[13px] font-medium"
                >
                    {error}
                </p>
            )}
        </fieldset>
    );
}

export default function AuthPage({ mode }) {
    const isSignup = mode === 'signup';
    const { status, login, register } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = safeNext(params.get('next'));
    const formRef = useRef(null);

    const [values, setValues] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const wide = useMediaQuery('(min-width: 64rem)');

    if (status === 'authenticated' && !submitting)
        return <Navigate to={next} replace />;

    const set = (field) => (event) =>
        setValues((current) => ({ ...current, [field]: event.target.value }));

    const focusFirstError = (fields) => {
        const first = ['name', 'email', 'password', 'role'].find(
            (field) => fields[field]
        );
        const control = first
            ? formRef.current?.elements.namedItem(first)
            : null;
        (control instanceof RadioNodeList ? control[0] : control)?.focus();
    };

    const submit = async (event) => {
        event.preventDefault();
        const local = validate(values, isSignup);
        if (Object.keys(local).length) {
            setErrors(local);
            focusFirstError(local);
            return;
        }

        setSubmitting(true);
        setErrors({});
        try {
            if (isSignup) await register(values);
            else
                await login({ email: values.email, password: values.password });
            navigate(next, { replace: true });
        } catch (error) {
            const fields = error.fields ?? {};
            setErrors({
                ...fields,
                form: Object.keys(fields).length ? undefined : error.message,
            });
            focusFirstError(fields);
            setSubmitting(false);
        }
    };

    const passwordToggle = (
        <IconButton
            size="sm"
            label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((shown) => !shown)}
        >
            {showPassword ? (
                <EyeSlashIcon aria-hidden size={16} />
            ) : (
                <EyeIcon aria-hidden size={16} />
            )}
        </IconButton>
    );

    return (
        <div className="bg-bg grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col px-5 py-5 sm:px-10">
                <header className="flex items-center justify-between">
                    <Link to="/" aria-label="CodeMate home">
                        <Logo />
                    </Link>
                    <ThemeToggle />
                </header>

                <main
                    id="main"
                    className="flex flex-1 items-center justify-center py-10"
                >
                    <div className="w-full max-w-md">
                        <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-[28px]">
                            {isSignup ? 'Create your account' : 'Welcome back'}
                        </h1>
                        <p className="text-fg-muted mt-1.5 text-[15px]">
                            {isSignup
                                ? 'TAs host live sessions. Students join them with a code.'
                                : 'Sign in to get back to your sessions.'}
                        </p>

                        <form
                            ref={formRef}
                            onSubmit={submit}
                            noValidate
                            className="mt-8 flex flex-col gap-5"
                        >
                            {isSignup && (
                                <TextField
                                    label="Full name"
                                    name="name"
                                    autoComplete="name"
                                    value={values.name}
                                    onChange={set('name')}
                                    error={errors.name}
                                    required
                                />
                            )}
                            <TextField
                                label="Email"
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                autoCapitalize="none"
                                spellCheck={false}
                                placeholder="name@school.edu…"
                                value={values.email}
                                onChange={set('email')}
                                error={errors.email}
                                required
                            />
                            <TextField
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete={
                                    isSignup
                                        ? 'new-password'
                                        : 'current-password'
                                }
                                value={values.password}
                                onChange={set('password')}
                                error={errors.password}
                                hint={
                                    isSignup
                                        ? 'At least 8 characters.'
                                        : undefined
                                }
                                trailing={passwordToggle}
                                required
                            />
                            {isSignup && (
                                <RolePicker
                                    value={values.role}
                                    onChange={(role) =>
                                        setValues((current) => ({
                                            ...current,
                                            role,
                                        }))
                                    }
                                    error={errors.role}
                                />
                            )}

                            {errors.form && (
                                <p
                                    role="alert"
                                    className="border-danger/40 bg-danger-soft text-danger-text border px-3 py-2.5 text-sm font-medium"
                                >
                                    {errors.form}
                                </p>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={submitting}
                                className="mt-1 w-full"
                            >
                                {submitting
                                    ? isSignup
                                        ? 'Creating account…'
                                        : 'Signing in…'
                                    : isSignup
                                      ? 'Create account'
                                      : 'Sign in'}
                            </Button>
                        </form>

                        <p className="text-fg-muted mt-6 text-sm">
                            {isSignup
                                ? 'Already have an account? '
                                : 'New to CodeMate? '}
                            <Link
                                to={`${isSignup ? '/login' : '/signup'}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`}
                                className="text-accent-text font-medium underline-offset-4 hover:underline"
                            >
                                {isSignup ? 'Sign in' : 'Create an account'}
                            </Link>
                        </p>
                    </div>
                </main>
            </div>

            <aside
                aria-hidden
                inert
                className="border-border bg-surface-2 relative isolate hidden items-center overflow-hidden border-l lg:flex"
            >
                <div aria-hidden className="dot-grid absolute inset-0 -z-10" />
                {wide && (
                    <div className="w-full py-16 pl-16">
                        <Suspense
                            fallback={
                                <div className="border-border-strong bg-surface h-[27.5rem] border border-r-0" />
                            }
                        >
                            <CollabDemo still className="border-r-0" />
                        </Suspense>
                    </div>
                )}
            </aside>
        </div>
    );
}
