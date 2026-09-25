import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightSpecialChars, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { editorTheme } from '../editor/setup';
import { ARJUN, TANVI } from './demoPeople';
import { cursorBase, cursorField, setCursors } from './previewCursors';

const PREVIEW_CODE = `function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

console.log(median([7, 1, 4, 9]));
console.log(median([3, 8, 1]));
`;

const after = (text) => PREVIEW_CODE.indexOf(text) + text.length;

export default function EditorPreview() {
    const hostRef = useRef(null);

    useEffect(() => {
        const view = new EditorView({
            parent: hostRef.current,
            state: EditorState.create({
                doc: PREVIEW_CODE,
                extensions: [
                    lineNumbers(),
                    highlightSpecialChars(),
                    javascript(),
                    editorTheme,
                    cursorBase,
                    cursorField,
                    EditorState.readOnly.of(true),
                    EditorView.editable.of(false),
                ],
            }),
        });
        view.dispatch({
            effects: setCursors.of([
                { name: ARJUN.name, color: ARJUN.color, pos: after('(a, b) => a - b') },
                { name: TANVI.name, color: TANVI.color, pos: after('median([3, 8, 1]));') },
            ]),
        });
        return () => view.destroy();
    }, []);

    return <div ref={hostRef} className="h-64 overflow-hidden [&_.cm-editor]:h-full" />;
}
