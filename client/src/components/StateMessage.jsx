import { Link } from 'react-router';
import { buttonStyles } from './ui/Button';

export function StateMessage({ icon: Icon, title, description, action = { to: '/session', label: 'Back to sessions' } }) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
            {Icon && (
                <span className="grid size-12 place-items-center border border-border-strong bg-surface text-fg-muted">
                    <Icon aria-hidden size={22} />
                </span>
            )}
            <h1 className="mt-5 text-xl font-semibold tracking-tight text-fg">{title}</h1>
            {description && <p className="mt-2 text-[15px] text-fg-muted">{description}</p>}
            {action && (
                <Link to={action.to} className={buttonStyles({ variant: 'secondary', className: 'mt-6' })}>
                    {action.label}
                </Link>
            )}
        </div>
    );
}
