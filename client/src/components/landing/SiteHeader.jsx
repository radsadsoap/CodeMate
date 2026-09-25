import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../Logo';
import { ThemeToggle } from '../ThemeToggle';
import { buttonStyles } from '../ui/Button';

const NAV = [
    { href: '#product', label: 'Product' },
    { href: '#faq', label: 'FAQ' },
];

// Every control in this bar is the medium size (36px), the theme toggle included.
export function SiteHeader() {
    const { status } = useAuth();
    const signedIn = status === 'authenticated';

    return (
        <header className="border-border bg-bg/85 sticky top-0 z-(--z-header) border-b backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
                <Link
                    to="/"
                    aria-label="CodeMate home"
                    className="flex flex-col items-center"
                >
                    <Logo />
                </Link>
                <nav aria-label="Sections" className="hidden md:block">
                    <ul className="flex items-center gap-1">
                        {NAV.map((item) => (
                            <li key={item.href}>
                                <a
                                    href={item.href}
                                    className={buttonStyles({
                                        variant: 'ghost',
                                        className: 'font-normal',
                                    })}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle className="hidden sm:inline-flex" />
                    {signedIn ? (
                        <Link
                            to="/session"
                            className={buttonStyles({ variant: 'primary' })}
                        >
                            Your sessions
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className={buttonStyles({ variant: 'ghost' })}
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className={buttonStyles({ variant: 'primary' })}
                            >
                                Get started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
