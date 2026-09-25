import { useRef } from 'react';
import { cx } from '../../lib/cx';

export function Tabs({ idBase, tabs, value, onChange, label, className }) {
    const refs = useRef({});

    const onKeyDown = (event) => {
        const index = tabs.findIndex((tab) => tab.id === value);
        const moves = {
            ArrowRight: (index + 1) % tabs.length,
            ArrowLeft: (index - 1 + tabs.length) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
        };
        if (!(event.key in moves)) return;
        event.preventDefault();
        const next = tabs[moves[event.key]].id;
        onChange(next);
        refs.current[next]?.focus();
    };

    // Tabs fill the height of their bar; the active one gets an accent underline sitting on the bar's bottom border.
    return (
        <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex h-full items-stretch gap-5', className)}>
            {tabs.map((tab) => {
                const selected = tab.id === value;
                return (
                    <button
                        key={tab.id}
                        ref={(node) => {
                            refs.current[tab.id] = node;
                        }}
                        type="button"
                        role="tab"
                        id={`${idBase}-tab-${tab.id}`}
                        aria-selected={selected}
                        aria-controls={`${idBase}-panel-${tab.id}`}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                        className={cx(
                            'relative inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:-outline-offset-2',
                            'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:transition-colors',
                            selected ? 'text-fg after:bg-accent' : 'text-fg-subtle after:bg-transparent hover:text-fg'
                        )}
                    >
                        {tab.label}
                        {tab.badge}
                    </button>
                );
            })}
        </div>
    );
}

export function TabPanel({ idBase, id, value, className, children }) {
    return (
        <div
            role="tabpanel"
            id={`${idBase}-panel-${id}`}
            aria-labelledby={`${idBase}-tab-${id}`}
            hidden={value !== id}
            className={className}
        >
            {children}
        </div>
    );
}
