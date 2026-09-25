import { CheckCircleIcon, CircleNotchIcon, ClockIcon, TerminalWindowIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { cx } from '../../lib/cx';
import { formatDuration, modifierKey } from '../../lib/format';
import { languageById } from '../../lib/languages';

function useElapsed(startedAt) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!startedAt) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(timer);
    }, [startedAt]);
    return startedAt ? Math.max(0, now - startedAt) : 0;
}

const STATUS = {
    ok: { tone: 'text-accent-text', icon: CheckCircleIcon },
    error: { tone: 'text-danger-text', icon: WarningCircleIcon },
    compile_error: { tone: 'text-danger-text', icon: WarningCircleIcon },
    timeout: { tone: 'text-warning-text', icon: ClockIcon },
    unavailable: { tone: 'text-warning-text', icon: WarningCircleIcon },
    rate_limited: { tone: 'text-warning-text', icon: ClockIcon },
};

function headline(result) {
    if (result.status === 'ok' || result.status === 'error') return `Exited with code ${result.exitCode ?? 'unknown'}`;
    if (result.status === 'compile_error') return 'Compilation failed';
    return result.message;
}

function Stream({ text, className }) {
    if (!text) return null;
    return <pre className={cx('font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words', className)}>{text}</pre>;
}

export function RunOutput({ running, result, className }) {
    const elapsed = useElapsed(running?.startedAt);

    if (running) {
        return (
            <div className={cx('flex items-center gap-2 text-sm text-fg-muted', className)}>
                <CircleNotchIcon aria-hidden size={16} className="animate-spin text-accent-text" />
                <span>
                    {running.by.name} is running {languageById[running.language]?.label ?? 'code'} on Wandbox
                </span>
                <span className="font-mono text-xs text-fg-subtle tabular-nums">{formatDuration(elapsed)}</span>
            </div>
        );
    }

    if (!result) {
        return (
            <div className={cx('flex items-start gap-3 text-sm text-fg-muted', className)}>
                <TerminalWindowIcon aria-hidden size={18} className="mt-0.5 shrink-0 text-fg-subtle" />
                <p>
                    Run the code to see its output here. Everyone in the session sees the result. Shortcut:{' '}
                    <kbd className="border border-border bg-surface-2 px-1.5 py-0.5 text-xs text-fg">{modifierKey}</kbd>{' '}
                    <kbd className="border border-border bg-surface-2 px-1.5 py-0.5 text-xs text-fg">Enter</kbd>
                </p>
            </div>
        );
    }

    const { tone, icon: Icon } = STATUS[result.status] ?? STATUS.error;
    const hasOutput = result.stdout || result.stderr || (result.status === 'compile_error' && result.compileOutput);

    return (
        <div className={cx('flex flex-col gap-3', className)}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className={cx('flex items-center gap-1.5 text-sm font-medium', tone)}>
                    <Icon aria-hidden size={16} weight="bold" />
                    {headline(result)}
                </p>
                <p className="text-xs text-fg-subtle">
                    {result.by.name} ran {languageById[result.language]?.label}
                    {result.durationMs ? ` in ${formatDuration(result.durationMs)}` : ''}
                </p>
            </div>
            {result.status === 'compile_error' && <Stream text={result.compileOutput} className="text-danger-text" />}
            <Stream text={result.stdout} className="text-fg" />
            <Stream text={result.stderr} className="text-danger-text" />
            {!hasOutput && (result.status === 'ok' || result.status === 'error') && (
                <p className="text-sm text-fg-subtle">The program finished without printing anything.</p>
            )}
        </div>
    );
}
