import { CompassIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Logo } from '../components/Logo';
import { StateMessage } from '../components/StateMessage';

export default function NotFound() {
    return (
        <div className="bg-bg flex min-h-dvh flex-col px-5 py-5 sm:px-10">
            <header className="flex">
                <Link to="/" aria-label="CodeMate home">
                    <Logo />
                </Link>
            </header>
            <main
                id="main"
                className="flex flex-1 items-center justify-center pb-16"
            >
                <StateMessage
                    icon={CompassIcon}
                    title="This page does not exist"
                    description="The link may be old or mistyped."
                    action={{ to: '/', label: 'Go to the home page' }}
                />
            </main>
        </div>
    );
}
