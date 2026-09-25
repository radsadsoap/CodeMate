import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';

// Named remote cursors drawn with the same markup y-codemirror uses, so the app theme styles both.
class CursorWidget extends WidgetType {
    constructor(name, color) {
        super();
        this.name = name;
        this.color = color;
    }
    eq(other) {
        return other.name === this.name && other.color === this.color;
    }
    toDOM() {
        const caret = document.createElement('span');
        caret.className = 'cm-ySelectionCaret';
        caret.style.borderColor = this.color;
        const info = document.createElement('span');
        info.className = 'cm-ySelectionInfo';
        info.style.backgroundColor = this.color;
        info.textContent = this.name.split(' ')[0];
        caret.append('\u2060', info, '\u2060');
        return caret;
    }
}

export const setCursors = StateEffect.define();

export const cursorField = StateField.define({
    create: () => [],
    update(cursors, transaction) {
        let next = transaction.docChanged
            ? cursors.map((cursor) => ({ ...cursor, pos: transaction.changes.mapPos(cursor.pos, 1) }))
            : cursors;
        for (const effect of transaction.effects) if (effect.is(setCursors)) next = effect.value;
        return next;
    },
    provide: (field) =>
        EditorView.decorations.from(field, (cursors) =>
            Decoration.set(
                cursors.map(({ name, color, pos }) =>
                    Decoration.widget({ widget: new CursorWidget(name, color), side: 1 }).range(pos)
                ),
                true
            )
        ),
});

export const cursorBase = EditorView.baseTheme({
    '.cm-ySelectionCaret': {
        position: 'relative',
        borderLeft: '2px solid',
        marginLeft: '-1px',
        marginRight: '-1px',
        boxSizing: 'border-box',
        display: 'inline',
    },
    '.cm-ySelectionInfo': {
        position: 'absolute',
        color: 'white',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: '5',
    },
});
