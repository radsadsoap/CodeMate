import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { languageById } from '../../lib/languages';
import { remoteCarets } from './remoteCarets';
import { editingExtensions, readOnlyExtensions } from './setup';

export function CollaborativeEditor({
    ytext,
    awareness,
    language,
    readOnly,
    onRun,
    label,
}) {
    const hostRef = useRef(null);
    const viewRef = useRef(null);
    const compartments = useRef({
        language: new Compartment(),
        readOnly: new Compartment(),
    });
    const onRunRef = useRef(onRun);
    const readOnlyRef = useRef(readOnly);

    useEffect(() => {
        onRunRef.current = onRun;
    }, [onRun]);

    useEffect(() => {
        const { language: languageSlot, readOnly: readOnlySlot } =
            compartments.current;
        const view = new EditorView({
            parent: hostRef.current,
            state: EditorState.create({
                doc: ytext.toString(),
                extensions: [
                    keymap.of([
                        {
                            key: 'Mod-Enter',
                            run: () => {
                                onRunRef.current?.();
                                return true;
                            },
                        },
                        ...yUndoManagerKeymap,
                    ]),
                    editingExtensions,
                    languageSlot.of([]),
                    readOnlySlot.of(readOnlyExtensions(readOnlyRef.current)),
                    // Without awareness yCollab only syncs text and undo; remoteCarets draws the other people.
                    yCollab(ytext, null),
                    remoteCarets(ytext, awareness),
                    EditorView.contentAttributes.of({ 'aria-label': label }),
                ],
            }),
        });
        viewRef.current = view;
        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, [ytext, awareness, label]);

    useEffect(() => {
        let cancelled = false;
        languageById[language]?.load().then((support) => {
            if (!cancelled) {
                viewRef.current?.dispatch({
                    effects: compartments.current.language.reconfigure(support),
                });
            }
        });
        return () => {
            cancelled = true;
        };
    }, [language, ytext]);

    useEffect(() => {
        readOnlyRef.current = readOnly;
        viewRef.current?.dispatch({
            effects: compartments.current.readOnly.reconfigure(
                readOnlyExtensions(readOnly)
            ),
        });
    }, [readOnly]);

    return (
        <div ref={hostRef} className="h-full min-h-0 [&_.cm-editor]:h-full" />
    );
}
