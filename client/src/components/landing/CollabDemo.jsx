import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import {
    EditorView,
    highlightSpecialChars,
    lineNumbers,
} from '@codemirror/view';
import { PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx';
import { editorTheme } from '../editor/setup';
import { MemberRow } from '../room/MemberRow';
import { RunOutput } from '../room/RunOutput';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/Button';
import { ARJUN as ARJUN_BASE, MEERA as MEERA_BASE } from './demoPeople';
import { cursorBase, cursorField, setCursors } from './previewCursors';

const BROKEN = `def average(scores):
    return sum(scores) / len(scores)

print(average([88, 92, 79]))
print(average([]))
`;
const GUARD = `    if not scores:
        return 0.0
`;
const GUARD_AT = BROKEN.indexOf('\n') + 1;
const FIXED = BROKEN.slice(0, GUARD_AT) + GUARD + BROKEN.slice(GUARD_AT);

const MEERA = { ...MEERA_BASE, isOwner: true };
const ARJUN = { ...ARJUN_BASE, isOwner: false };

const FAILED_RUN = {
    status: 'error',
    exitCode: 1,
    stdout: '86.33333333333333\n',
    stderr: 'ZeroDivisionError: division by zero\n',
    compileOutput: '',
    durationMs: 1320,
    by: ARJUN,
    language: 'python',
};
const FIXED_RUN = {
    status: 'ok',
    exitCode: 0,
    stdout: '86.33333333333333\n0.0\n',
    stderr: '',
    compileOutput: '',
    durationMs: 1180,
    by: MEERA,
    language: 'python',
};

const endOfLine = (doc, lineNumber) => doc.line(lineNumber).to;
const LINE_ONE_END = BROKEN.indexOf('\n');
const jitter = (min, max) => min + Math.random() * (max - min);

// Quick inside a word, slower after a space or punctuation, like someone who knows what they are typing.
const keyDelay = (char) => {
    if (char === ' ') return jitter(90, 170);
    if (/[:(),.]/.test(char)) return jitter(150, 260);
    return jitter(55, 115);
};

// Timed steps that hold while the preview is paused or scrolled out of view.
function createGate(signal) {
    let release = null;
    const aborted = () => new DOMException('aborted', 'AbortError');

    const sleep = (ms) =>
        new Promise((resolve, reject) => {
            const onAbort = () => {
                clearTimeout(timer);
                reject(aborted());
            };
            const timer = setTimeout(() => {
                signal.removeEventListener('abort', onAbort);
                resolve();
            }, ms);
            signal.addEventListener('abort', onAbort, { once: true });
        });

    const gate = {
        blocked: false,
        block(value) {
            gate.blocked = value;
            if (!value) release?.();
        },
        async wait(ms, { holdable = true } = {}) {
            await sleep(ms);
            while (holdable && gate.blocked) {
                await new Promise((resolve) => {
                    release = resolve;
                    signal.addEventListener('abort', resolve, { once: true });
                });
                if (signal.aborted) throw aborted();
            }
        },
    };
    return gate;
}

async function playScript(view, gate, setScene) {
    const cursorsFor = (meeraPos, arjunPos) =>
        setCursors.of([
            { name: MEERA.name, color: MEERA.color, pos: meeraPos },
            { name: ARJUN.name, color: ARJUN.color, pos: arjunPos },
        ]);
    const step = (ms) => gate.wait(ms);
    // A simulated run always finishes, so a paused preview never shows a stuck timer.
    const runFor = (ms) => gate.wait(ms, { holdable: false });

    // Meera's cursor rides along with every change through the cursor field's position mapping.
    let at = 0;
    const type = async (text) => {
        for (const char of text) {
            view.dispatch({ changes: { from: at, insert: char } });
            at += 1;
            await step(keyDelay(char));
        }
    };
    const erase = async (count) => {
        for (let index = 0; index < count; index += 1) {
            view.dispatch({ changes: { from: at - 1, to: at } });
            at -= 1;
            await step(jitter(70, 110));
        }
    };
    // Enter plus the indentation the editor adds on its own, in one keystroke.
    const newline = async (indent) => {
        view.dispatch({ changes: { from: at, insert: `\n${indent}` } });
        at += indent.length + 1;
        await step(jitter(320, 520));
    };

    for (;;) {
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: BROKEN },
            effects: cursorsFor(LINE_ONE_END, 0),
        });
        view.dispatch({
            effects: cursorsFor(LINE_ONE_END, endOfLine(view.state.doc, 4)),
        });
        setScene({ hand: false, running: null, result: null });

        await step(1400);
        setScene((scene) => ({
            ...scene,
            running: { by: ARJUN, language: 'python', startedAt: Date.now() },
        }));
        await runFor(1500);
        setScene((scene) => ({ ...scene, running: null, result: FAILED_RUN }));
        await step(1100);
        setScene((scene) => ({ ...scene, hand: true }));
        await step(1600);

        at = LINE_ONE_END;
        view.dispatch({
            effects: cursorsFor(at, endOfLine(view.state.doc, 4)),
        });
        await step(700);
        await newline('    ');
        await type('if not sco');
        await type('er');
        await step(jitter(380, 520));
        await erase(2);
        await type('res:');
        await newline('        ');
        await type('return 0.0');

        await step(1000);
        setScene((scene) => ({
            ...scene,
            running: { by: MEERA, language: 'python', startedAt: Date.now() },
        }));
        await runFor(1400);
        setScene({ hand: false, running: null, result: FIXED_RUN });
        await step(4600);
    }
}

// `still` renders the finished scene without motion, for places where a loop would distract.
export default function CollabDemo({ still: stillProp = false, className }) {
    const reduceMotion = useReducedMotion();
    const still = stillProp || reduceMotion;
    const frameRef = useRef(null);
    const hostRef = useRef(null);
    const gateRef = useRef(null);
    const inView = useInView(frameRef, { amount: 0.35 });
    const [paused, setPaused] = useState(false);
    const [scene, setScene] = useState({
        hand: false,
        running: null,
        result: still ? FIXED_RUN : null,
    });

    useEffect(() => {
        const view = new EditorView({
            parent: hostRef.current,
            state: EditorState.create({
                doc: still ? FIXED : BROKEN,
                extensions: [
                    lineNumbers(),
                    highlightSpecialChars(),
                    python(),
                    editorTheme,
                    cursorBase,
                    cursorField,
                    EditorView.lineWrapping,
                    EditorState.readOnly.of(true),
                    EditorView.editable.of(false),
                ],
            }),
        });

        if (still) {
            view.dispatch({
                effects: setCursors.of([
                    {
                        name: MEERA.name,
                        color: MEERA.color,
                        pos: GUARD_AT + GUARD.length - 1,
                    },
                    {
                        name: ARJUN.name,
                        color: ARJUN.color,
                        pos: endOfLine(view.state.doc, 6),
                    },
                ]),
            });
            setScene({ hand: false, running: null, result: FIXED_RUN });
            return () => view.destroy();
        }

        const controller = new AbortController();
        const gate = createGate(controller.signal);
        gateRef.current = gate;
        playScript(view, gate, setScene).catch((error) => {
            if (error.name !== 'AbortError') throw error;
        });
        return () => {
            controller.abort();
            view.destroy();
        };
    }, [still]);

    useEffect(() => {
        gateRef.current?.block(paused || !inView);
    }, [paused, inView, still]);

    const people = [
        {
            ...MEERA,
            canEdit: true,
            handRaisedAt: null,
            voice: { joined: true, micOn: true, mutedByHost: false },
        },
        {
            ...ARJUN,
            canEdit: true,
            handRaisedAt: scene.hand ? 1 : null,
            voice: { joined: true, micOn: false, mutedByHost: false },
        },
    ];

    return (
        <figure
            ref={frameRef}
            className={cx(
                'border-border-strong bg-surface overflow-hidden border',
                className
            )}
            aria-labelledby="demo-caption"
        >
            <div className="border-border flex h-12 items-center gap-3 border-b px-4">
                <p className="text-fg truncate text-sm font-medium">
                    Week 6: Debugging
                </p>
                <Badge>Python</Badge>
                <div className="ml-auto flex items-center gap-3">
                    <div aria-hidden className="flex -space-x-1.5">
                        {people.map((person) => (
                            <Avatar
                                key={person.id}
                                name={person.name}
                                color={person.color}
                                size={24}
                                className="ring-surface ring-2"
                            />
                        ))}
                    </div>
                    {!still && (
                        <IconButton
                            size="sm"
                            label={
                                paused
                                    ? 'Play the preview'
                                    : 'Pause the preview'
                            }
                            onClick={() => setPaused((value) => !value)}
                        >
                            {paused ? (
                                <PlayIcon aria-hidden size={15} weight="fill" />
                            ) : (
                                <PauseIcon
                                    aria-hidden
                                    size={15}
                                    weight="fill"
                                />
                            )}
                        </IconButton>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1fr)_12.5rem]">
                <div
                    ref={hostRef}
                    aria-hidden
                    className="bg-editor-bg h-64 overflow-hidden [&_.cm-editor]:h-full"
                />
                <ul
                    aria-label="People in the preview"
                    className="border-border hidden flex-col border-l py-1 md:flex"
                >
                    {people.map((person) => (
                        <MemberRow
                            key={person.id}
                            member={person}
                            isSelf={false}
                            locked={false}
                            className={
                                person.handRaisedAt
                                    ? 'bg-warning-soft'
                                    : undefined
                            }
                        />
                    ))}
                </ul>
            </div>

            <div className="border-border h-28 overflow-hidden border-t px-4 py-3">
                <RunOutput running={scene.running} result={scene.result} />
            </div>

            <figcaption id="demo-caption" className="sr-only">
                Preview of a CodeMate session. Meera, the TA, and Arjun, a
                student, share one Python file. Arjun runs it, hits a
                ZeroDivisionError and raises his hand. Meera adds a guard for
                empty lists and the program runs cleanly.
            </figcaption>
        </figure>
    );
}
