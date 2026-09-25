import { useId, useState } from 'react';
import { cx } from '../../lib/cx';
import { Tabs, TabPanel } from '../ui/Tabs';
import { RunOutput } from './RunOutput';

export function OutputPanel({ running, lastRun, stdin, onStdinChange, className }) {
    const idBase = useId();
    const [tab, setTab] = useState('output');
    const stdinId = useId();

    const tabs = [
        { id: 'output', label: 'Output' },
        {
            id: 'input',
            label: 'Input',
            badge: stdin ? <span className="text-xs font-normal text-fg-subtle">(set)</span> : null,
        },
    ];

    return (
        <section aria-label="Run panel" className={cx('flex min-h-0 flex-col border-t border-border bg-surface', className)}>
            <div className="flex h-10 shrink-0 items-center border-b border-border px-4">
                <Tabs idBase={idBase} tabs={tabs} value={tab} onChange={setTab} label="Output or program input" />
            </div>
            <TabPanel idBase={idBase} id="output" value={tab} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <div aria-live="polite">
                    <RunOutput running={running} result={lastRun} />
                </div>
            </TabPanel>
            <TabPanel idBase={idBase} id="input" value={tab} className="flex min-h-0 flex-1 flex-col gap-1.5 px-4 py-3">
                <label htmlFor={stdinId} className="text-sm font-medium text-fg">
                    Program input
                </label>
                <textarea
                    id={stdinId}
                    value={stdin}
                    onChange={(event) => onStdinChange(event.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="Lines your program reads with input(), Scanner or cin…"
                    className="min-h-0 flex-1 resize-none border border-border-strong bg-editor-bg p-3 font-mono text-[13px] text-fg placeholder:text-fg-subtle focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/20 focus-visible:outline-none"
                />
                <p className="text-xs text-fg-subtle">Sent as standard input when you press Run. Only you see this box.</p>
            </TabPanel>
        </section>
    );
}
