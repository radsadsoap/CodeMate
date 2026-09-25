import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { useTheme } from '../context/ThemeContext';
import { cx } from '../lib/cx';

const OPTIONS = [
    { value: 'system', label: 'Match system theme', icon: DesktopIcon },
    { value: 'light', label: 'Light theme', icon: SunIcon },
    { value: 'dark', label: 'Dark theme', icon: MoonIcon },
];

// Segment sizes include the 1px outer border, so the group matches buttons of the same size.
const SEGMENT = { sm: 'size-[30px]', md: 'size-[34px]' };

export function ThemeToggle({ size = 'md', className }) {
    const { preference, setPreference } = useTheme();
    const name = useId();

    return (
        <fieldset className={cx('inline-flex border border-border-strong bg-surface', className)}>
            <legend className="sr-only">Color theme</legend>
            {OPTIONS.map(({ value, label, icon: Icon }) => {
                const checked = preference === value;
                return (
                    <label
                        key={value}
                        title={label}
                        className={cx(
                            SEGMENT[size],
                            'grid cursor-pointer place-items-center transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus',
                            checked ? 'bg-surface-3 text-fg' : 'text-fg-subtle hover:bg-surface-2 hover:text-fg'
                        )}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={value}
                            checked={checked}
                            onChange={() => setPreference(value)}
                            className="sr-only"
                        />
                        <Icon aria-hidden size={15} weight={checked ? 'bold' : 'regular'} />
                        <span className="sr-only">{label}</span>
                    </label>
                );
            })}
        </fieldset>
    );
}
