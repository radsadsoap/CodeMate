const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export const formatDate = (value) => dateFormat.format(new Date(value));
export const formatDateTime = (value) => dateTimeFormat.format(new Date(value));

export function formatRelative(value) {
    const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
    const steps = [
        ['year', 31_536_000],
        ['month', 2_592_000],
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];
    for (const [unit, size] of steps) {
        if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
    }
    return relativeFormat.format(0, 'second');
}

export function formatDuration(ms) {
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function initials(name = '') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}

export const roleLabel = (role) => (role === 'teaching_assistant' ? 'TA' : 'Student');

export const modifierKey =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';
