import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { languageById } from '../../lib/languages';
import { editingExtensions } from './setup';

export function ReadOnlyEditor({ value, language, label }) {
    const hostRef = useRef(null);

    useEffect(() => {
        let view = null;
        let cancelled = false;
        languageById[language].load().then((support) => {
            if (cancelled) return;
            view = new EditorView({
                parent: hostRef.current,
                state: EditorState.create({
                    doc: value,
                    extensions: [
                        editingExtensions,
                        support,
                        EditorState.readOnly.of(true),
                        EditorView.contentAttributes.of({ 'aria-label': label }),
                    ],
                }),
            });
        });
        return () => {
            cancelled = true;
            view?.destroy();
        };
    }, [value, language, label]);

    return <div ref={hostRef} className="h-full min-h-0 [&_.cm-editor]:h-full" />;
}
