import { GithubLogoIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Logo } from '../Logo';

const LINKS = [
    { href: '#product', label: 'Product' },
    { href: '#faq', label: 'FAQ' },
];

export function SiteFooter() {
    return (
        <footer>
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center">
                <Logo />
                <nav aria-label="Footer" className="md:ml-10">
                    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg-muted">
                        {LINKS.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} className="transition-colors hover:text-fg">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                        <li>
                            <Link to="/login" className="transition-colors hover:text-fg">
                                Sign in
                            </Link>
                        </li>
                        <li>
                            <a
                                href="https://github.com/radsadsoap/CodeMate"
                                className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
                            >
                                <GithubLogoIcon aria-hidden size={16} />
                                GitHub
                            </a>
                        </li>
                    </ul>
                </nav>
                <p className="text-sm text-fg-subtle md:ml-auto">&copy; {new Date().getFullYear()} CodeMate</p>
            </div>
        </footer>
    );
}
