import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
} from '@codemirror/autocomplete';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import {
    bracketMatching,
    HighlightStyle,
    indentOnInput,
    indentUnit,
    syntaxHighlighting,
} from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightSpecialChars,
    keymap,
    lineNumbers,
    rectangularSelection,
} from '@codemirror/view';
import { tags as t } from '@lezer/highlight';

export const MAX_CODE_LENGTH = 100_000;

// Every color is a CSS variable, so the editor follows the app theme without being rebuilt.
const theme = EditorView.theme({
    '&': {
        height: '100%',
        backgroundColor: 'var(--editor-bg)',
        color: 'var(--fg)',
        fontSize: '14px',
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
        fontFamily: 'var(--font-mono)',
        lineHeight: '1.7',
        overflow: 'auto',
    },
    '.cm-content': { padding: '18px 0 24px', caretColor: 'var(--fg)' },
    '.cm-line': { padding: '0 20px 0 12px' },
    '.cm-gutters': {
        backgroundColor: 'var(--editor-gutter)',
        color: 'var(--fg-subtle)',
        border: 'none',
        paddingLeft: '10px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '28px',
        fontVariantNumeric: 'tabular-nums',
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: 'var(--fg)',
    },
    '.cm-activeLine': { backgroundColor: 'var(--editor-line)' },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--fg)',
        borderLeftWidth: '2px',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        { backgroundColor: 'var(--editor-selection)' },
    '.cm-matchingBracket': {
        backgroundColor: 'var(--surface-3)',
        outline: '1px solid var(--border-strong)',
    },
    '.cm-selectionMatch': { backgroundColor: 'var(--surface-3)' },
    '.cm-searchMatch': {
        backgroundColor: 'var(--warning-soft)',
        outline: '1px solid var(--warning-text)',
    },
    '.cm-tooltip': {
        backgroundColor: 'var(--surface)',
        color: 'var(--fg)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-pop)',
        overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete > ul': {
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: 'var(--accent-soft)',
        color: 'var(--fg)',
    },
    '.cm-panels': { backgroundColor: 'var(--surface)', color: 'var(--fg)' },
    '.cm-panels-top': { borderBottom: '1px solid var(--border)' },
    '.cm-panel input, .cm-panel button': {
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
    },
    '.cm-ySelectionCaret': { borderLeftWidth: '2px', borderRightWidth: '0' },
    '.cm-ySelectionInfo': {
        top: '-1.45em',
        left: '-2px',
        padding: '1px 6px',
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        fontWeight: '500',
        lineHeight: '1.4',
        pointerEvents: 'none',
    },
    '.cm-ySelectionCaret-active > .cm-ySelectionInfo, .cm-ySelectionCaret:hover > .cm-ySelectionInfo':
        {
            opacity: '1',
        },
});

const highlight = HighlightStyle.define([
    {
        tag: [
            t.keyword,
            t.controlKeyword,
            t.moduleKeyword,
            t.operatorKeyword,
            t.definitionKeyword,
            t.modifier,
            t.self,
        ],
        color: 'var(--syntax-keyword)',
    },
    {
        tag: [t.string, t.special(t.string), t.regexp, t.character],
        color: 'var(--syntax-string)',
    },
    { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--syntax-number)' },
    {
        tag: [
            t.function(t.variableName),
            t.function(t.propertyName),
            t.function(t.definition(t.variableName)),
        ],
        color: 'var(--syntax-function)',
    },
    {
        tag: [t.typeName, t.className, t.namespace, t.definition(t.typeName)],
        color: 'var(--syntax-type)',
    },
    {
        tag: [t.propertyName, t.attributeName, t.labelName],
        color: 'var(--syntax-property)',
    },
    {
        tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
        color: 'var(--syntax-comment)',
        fontStyle: 'italic',
    },
    { tag: [t.processingInstruction, t.meta], color: 'var(--syntax-keyword)' },
    { tag: t.invalid, color: 'var(--danger-text)' },
]);

export const editorTheme = [theme, syntaxHighlighting(highlight)];

// Blocks typing or pasting past the limit without touching changes that arrive from other people.
const lengthGuard = EditorState.transactionFilter.of((transaction) =>
    transaction.docChanged &&
    transaction.newDoc.length > MAX_CODE_LENGTH &&
    ['input', 'paste', 'drop'].some((event) => transaction.isUserEvent(event))
        ? []
        : transaction
);

export const editingExtensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    indentUnit.of('    '),
    EditorState.tabSize.of(4),
    lengthGuard,
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...completionKeymap,
        indentWithTab,
    ]),
    editorTheme,
];

// Read-only keeps the text selectable and keyboard-navigable; it only blocks edits.
export const readOnlyExtensions = (readOnly) =>
    readOnly ? [EditorState.readOnly.of(true)] : [];
