import { cx } from '../lib/cx';

// `</>`: two flat-tipped chevrons and a slash on a black square, same as the favicon.
const GLYPH =
    'M41 33L7 55V65L41 87V71L24 60L41 49Z' +
    'M66 22H79L54 98H41Z' +
    'M79 33L113 55V65L79 87V71L96 60L79 49Z';

export function LogoMark({ size = 22, className }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 120 120"
            width={size}
            height={size}
            className={cx('shrink-0', className)}
        >
            <rect width="120" height="120" fill="#0b0b0b" />
            <path d={GLYPH} fill="#8bc34a" />
        </svg>
    );
}

export function Logo({ className }) {
    return (
        <span
            translate="no"
            className={cx('text-fg inline-flex items-center gap-2', className)}
        >
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">
                CodeMate
            </span>
        </span>
    );
}
