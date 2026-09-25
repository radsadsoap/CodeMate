import { MicrophoneIcon, MicrophoneSlashIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { cx } from '../../lib/cx';
import { MemberRow } from '../room/MemberRow';
import { MembersPanel } from '../room/MembersPanel';
import { OutputPanel } from '../room/OutputPanel';
import { Avatar } from '../ui/Avatar';
import { Switch } from '../ui/Switch';
import { ARJUN, KABIR, MEERA, TANVI } from './demoPeople';
import { Reveal } from './Reveal';

const EditorPreview = lazy(() => import('./EditorPreview'));

const noop = () => {};

// The real room components with sample data. Inert keeps their controls out of reach and out of the tab order.
function Preview({ label, className, children }) {
    return (
        <div role="img" aria-label={label} className={className}>
            <div inert>{children}</div>
        </div>
    );
}

const PREVIEW_MEMBERS = [
    {
        ...MEERA,
        isOwner: true,
        canEdit: true,
        handRaisedAt: null,
        voice: { joined: true, micOn: true, mutedByHost: false },
        joinedAt: 1,
    },
    {
        ...ARJUN,
        isOwner: false,
        canEdit: true,
        handRaisedAt: 2,
        voice: { joined: true, micOn: false, mutedByHost: false },
        joinedAt: 2,
    },
    {
        ...TANVI,
        isOwner: false,
        canEdit: false,
        handRaisedAt: 1,
        voice: { joined: true, micOn: true, mutedByHost: false },
        joinedAt: 3,
    },
    {
        ...KABIR,
        isOwner: false,
        canEdit: false,
        handRaisedAt: null,
        voice: { joined: false, micOn: false, mutedByHost: false },
        joinedAt: 4,
    },
];
const PREVIEW_ROOM = {
    snapshot: { ownerId: MEERA.id, editLocked: true, members: PREVIEW_MEMBERS },
    me: PREVIEW_MEMBERS[0],
    actions: {},
};
const PREVIEW_RUN = {
    status: 'ok',
    exitCode: 0,
    stdout: '5.5\n3\n',
    stderr: '',
    compileOutput: '',
    durationMs: 1840,
    by: TANVI,
    language: 'javascript',
};

function Cell({ title, body, className, children }) {
    return (
        <article className={cx('bg-bg flex flex-col', className)}>
            <div className="p-6 sm:p-8">
                <h3 className="text-fg text-base font-semibold tracking-tight">
                    {title}
                </h3>
                <p className="text-fg-muted mt-2 max-w-[50ch] text-[15px] leading-relaxed">
                    {body}
                </p>
            </div>
            {children}
        </article>
    );
}

const VOICES = [
    { ...MEERA, speaking: true },
    { ...ARJUN, speaking: false },
    { ...TANVI, speaking: false },
];

function VoiceStrip() {
    const reduceMotion = useReducedMotion();
    return (
        <div
            aria-hidden
            className="mt-auto flex items-center gap-6 px-6 pb-8 sm:px-8"
        >
            {VOICES.map((voice) => (
                <div
                    key={voice.name}
                    className="flex flex-col items-center gap-2"
                >
                    <span className="relative grid place-items-center">
                        {voice.speaking && !reduceMotion && (
                            <motion.span
                                className="absolute inset-0 rounded-full"
                                style={{
                                    boxShadow: `0 0 0 2px ${voice.color}`,
                                }}
                                animate={{
                                    scale: [1, 1.22, 1],
                                    opacity: [0.9, 0, 0.9],
                                }}
                                transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                        )}
                        <Avatar
                            name={voice.name}
                            color={voice.color}
                            size={44}
                        />
                    </span>
                    {voice.speaking ? (
                        <MicrophoneIcon
                            size={15}
                            weight="fill"
                            className="text-accent-text"
                        />
                    ) : (
                        <MicrophoneSlashIcon
                            size={15}
                            className="text-fg-subtle"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

const STUDENTS = [ARJUN, TANVI];

function LockPreview() {
    const [locked, setLocked] = useState(true);
    const allowed = locked
        ? new Set([TANVI.id])
        : new Set(STUDENTS.map((student) => student.id));

    return (
        <div className="grid gap-4 px-6 pb-6 sm:px-8 sm:pb-8 md:grid-cols-2 md:items-start">
            <div className="border-border bg-bg border p-4">
                <Switch
                    checked={locked}
                    onChange={setLocked}
                    label="Lock editing"
                    description={
                        locked
                            ? 'Only you and the people you allow can type.'
                            : 'Everyone in the room can type.'
                    }
                />
            </div>
            <ul
                aria-label="Editing access in this example"
                className="border-border bg-bg flex flex-col border py-1"
            >
                {STUDENTS.map((student) => (
                    <MemberRow
                        key={student.id}
                        member={{
                            ...student,
                            isOwner: false,
                            canEdit: allowed.has(student.id),
                            handRaisedAt: null,
                            voice: { joined: false },
                        }}
                        isSelf={false}
                        locked={locked}
                    />
                ))}
            </ul>
        </div>
    );
}

export function Features() {
    return (
        <section id="product" className="border-border border-b">
            <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                <Reveal className="max-w-2xl">
                    <h2 className="text-fg text-3xl font-semibold tracking-tight sm:text-4xl">
                        Everything a coding session needs, in one tab
                    </h2>
                    <p className="text-fg-muted mt-4 text-lg leading-relaxed">
                        No installs and no screen sharing. Students open a link
                        and land in the same file as their TA.
                    </p>
                </Reveal>

                {/* One reveal for the whole grid: the 1px gaps are the grid's own background showing through. */}
                <Reveal
                    delay={0.05}
                    className="border-border bg-border mt-12 grid grid-cols-1 gap-px border lg:grid-cols-3"
                >
                    <Cell
                        className="lg:col-span-2"
                        title="Edit the same file at once"
                        body="Keystrokes merge live, so two people can fix one function without overwriting each other. Every cursor carries a name."
                    >
                        <Preview
                            label="The shared editor with Arjun's and Tanvi's named cursors in one JavaScript file"
                            className="border-border bg-editor-bg mt-auto border-t"
                        >
                            <Suspense fallback={<div className="h-64" />}>
                                <EditorPreview />
                            </Suspense>
                        </Preview>
                    </Cell>

                    <Cell
                        className="dot-grid lg:row-span-2"
                        title="Raise a hand"
                        body="Stuck students raise a hand instead of interrupting. The TA sees who asked first and lowers it once they are unblocked."
                    >
                        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 sm:px-8 sm:pb-8">
                            <Preview
                                label="The TA's people panel with two raised hands at the top of the list"
                                className="border-border-strong bg-surface flex min-h-80 flex-1 flex-col border [&>div]:flex-1"
                            >
                                <MembersPanel
                                    room={PREVIEW_ROOM}
                                    userId={MEERA.id}
                                />
                            </Preview>
                        </div>
                    </Cell>

                    <Cell
                        title="Run it for real"
                        body="Python, JavaScript, Java and C++ run on real compilers, and the whole room sees the same output."
                    >
                        <Preview
                            label="The output panel after Tanvi ran the JavaScript file"
                            className="mt-auto"
                        >
                            <OutputPanel
                                running={null}
                                lastRun={PREVIEW_RUN}
                                stdin=""
                                onStdinChange={noop}
                                className="h-44"
                            />
                        </Preview>
                    </Cell>

                    <Cell
                        title="Talk it through"
                        body="Voice chat is built in. Join with one click, and the TA can mute anyone who needs a moment."
                    >
                        <VoiceStrip />
                    </Cell>

                    <Cell
                        className="bg-surface lg:col-span-3"
                        title="Decide who types"
                        body="Lock the editor for a walkthrough, then hand the keyboard to one student at a time. Try the switch."
                    >
                        <LockPreview />
                    </Cell>
                </Reveal>
            </div>
        </section>
    );
}
