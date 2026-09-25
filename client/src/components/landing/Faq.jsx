import { PlusIcon } from '@phosphor-icons/react';
import { Reveal } from './Reveal';

const QUESTIONS = [
    {
        question: 'Which languages can we run?',
        answer: 'Python 3.14, JavaScript on Node.js 20, Java 22 and C++ with GCC 13. Everyone in the session sees the output of each run.',
    },
    {
        question: 'Where does our code run?',
        answer: 'On Wandbox, a free public compiler service, inside its sandbox. Nothing runs on your laptop or on the CodeMate server. Wandbox allows 10 runs a minute from one network.',
    },
    {
        question: 'Do students need to install anything?',
        answer: 'No. A browser and the session code are enough. Voice chat asks for microphone access the first time you join it.',
    },
    {
        question: 'Who can host a session?',
        answer: 'Anyone who picks Teaching assistant when signing up. Students join sessions with a code and cannot create their own.',
    },
    {
        question: 'What happens when a session ends?',
        answer: 'Editing stops for everyone and the final code is saved. Anyone who joined can reopen it read-only from their session list.',
    },
    {
        question: 'Does it work on a phone?',
        answer: 'Yes for following along, reading code, running it and raising a hand. Typing code is more comfortable with a keyboard.',
    },
];

export function Faq() {
    return (
        <section id="faq" className="border-b border-border">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-28">
                <Reveal>
                    <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Common questions</h2>
                </Reveal>
                <Reveal delay={0.05} className="border-t border-border">
                    {QUESTIONS.map(({ question, answer }) => (
                        <details key={question} className="group border-b border-border [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex list-none items-center justify-between gap-4 py-5 text-[15px] font-medium text-fg transition-colors hover:text-accent-text">
                                {question}
                                <PlusIcon
                                    aria-hidden
                                    size={16}
                                    className="shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-45"
                                />
                            </summary>
                            <p className="max-w-[62ch] pb-6 text-[15px] leading-relaxed text-fg-muted">{answer}</p>
                        </details>
                    ))}
                </Reveal>
            </div>
        </section>
    );
}
