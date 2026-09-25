import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { yRemoteSelectionsTheme } from 'y-codemirror.next';
import * as Y from 'yjs';

// Name tags sit over the line above the caret, so each one only shows while that person is active.
const ACTIVE_MS = 3000;

// Cursors come from other people's browsers, so a malformed one is skipped instead of crashing the editor.
function resolve(json, doc) {
    try {
        return Y.createAbsolutePositionFromRelativePosition(
            Y.createRelativePositionFromJSON(json),
            doc
        );
    } catch {
        return null;
    }
}

class RemoteCaret extends WidgetType {
    constructor(color, name, active) {
        super();
        this.color = color;
        this.name = name;
        this.active = active;
    }

    eq(other) {
        return (
            other.color === this.color &&
            other.name === this.name &&
            other.active === this.active
        );
    }

    toDOM() {
        const caret = document.createElement('span');
        const info = document.createElement('span');
        info.className = 'cm-ySelectionInfo';
        caret.append('\u2060', info, '\u2060');
        this.updateDOM(caret);
        return caret;
    }

    // Reusing the element lets the name tag fade out instead of disappearing.
    updateDOM(caret) {
        caret.className = this.active
            ? 'cm-ySelectionCaret cm-ySelectionCaret-active'
            : 'cm-ySelectionCaret';
        caret.style.borderColor = this.color;
        const info = caret.firstElementChild;
        info.style.backgroundColor = this.color;
        info.textContent = this.name;
        return true;
    }

    get estimatedHeight() {
        return -1;
    }

    ignoreEvent() {
        return true;
    }
}

// Replaces y-codemirror's remote selections: same awareness format, plus activity tracking.
export function remoteCarets(ytext, awareness) {
    const plugin = ViewPlugin.fromClass(
        class {
            constructor(view) {
                this.view = view;
                this.activeUntil = new Map();
                this.timer = 0;
                this.onAwareness = ({ added, updated, removed }) => {
                    for (const id of removed) this.activeUntil.delete(id);
                    const moved = [...added, ...updated].filter(
                        (id) => id !== awareness.clientID
                    );
                    if (
                        moved.length ||
                        removed.some((id) => id !== awareness.clientID)
                    )
                        this.touch(moved);
                };
                // Typing keeps a relative cursor where it is, so remote inserts count as activity too.
                this.onText = (_event, transaction) => {
                    if (transaction.local) return;
                    const authors = [];
                    transaction.afterState.forEach((clock, id) => {
                        if (clock > (transaction.beforeState.get(id) ?? 0))
                            authors.push(id);
                    });
                    if (authors.length) this.touch(authors);
                };
                awareness.on('change', this.onAwareness);
                ytext.observe(this.onText);
                this.decorations = this.build(view.state);
            }

            touch(ids) {
                const until = Date.now() + ACTIVE_MS;
                for (const id of ids) this.activeUntil.set(id, until);
                this.view.dispatch({});
            }

            update(update) {
                this.broadcast(update);
                this.decorations = this.build(update.state);
            }

            destroy() {
                clearTimeout(this.timer);
                awareness.off('change', this.onAwareness);
                ytext.unobserve(this.onText);
            }

            broadcast({ view, state }) {
                const local = awareness.getLocalState();
                if (
                    !local ||
                    !view.hasFocus ||
                    !view.dom.ownerDocument.hasFocus()
                )
                    return;
                const { anchor, head } = state.selection.main;
                const next = {
                    anchor: Y.createRelativePositionFromTypeIndex(
                        ytext,
                        anchor
                    ),
                    head: Y.createRelativePositionFromTypeIndex(ytext, head),
                };
                const current = local.cursor;
                if (
                    !current ||
                    !Y.compareRelativePositions(
                        Y.createRelativePositionFromJSON(current.anchor),
                        next.anchor
                    ) ||
                    !Y.compareRelativePositions(
                        Y.createRelativePositionFromJSON(current.head),
                        next.head
                    )
                ) {
                    awareness.setLocalStateField('cursor', next);
                }
            }

            build(state) {
                clearTimeout(this.timer);
                const now = Date.now();
                let nextExpiry = Infinity;
                const ranges = [];
                awareness.getStates().forEach((peer, id) => {
                    const cursor = peer.cursor;
                    if (
                        id === awareness.clientID ||
                        !cursor?.anchor ||
                        !cursor?.head
                    )
                        return;
                    const anchor = resolve(cursor.anchor, ytext.doc);
                    const head = resolve(cursor.head, ytext.doc);
                    if (anchor?.type !== ytext || head?.type !== ytext) return;

                    const {
                        color = '#30bced',
                        name = 'Anonymous',
                        colorLight = `${color}33`,
                    } = peer.user ?? {};
                    const until = this.activeUntil.get(id) ?? 0;
                    if (until > now) nextExpiry = Math.min(nextExpiry, until);

                    const from = Math.min(anchor.index, head.index);
                    const to = Math.max(anchor.index, head.index);
                    if (from < to) {
                        const attributes = {
                            style: `background-color: ${colorLight}`,
                        };
                        const mark = Decoration.mark({
                            class: 'cm-ySelection',
                            attributes,
                        });
                        const first = state.doc.lineAt(from);
                        const last = state.doc.lineAt(to);
                        if (first.number === last.number) {
                            ranges.push(mark.range(from, to));
                        } else {
                            if (from < first.to)
                                ranges.push(mark.range(from, first.to));
                            if (last.from < to)
                                ranges.push(mark.range(last.from, to));
                            const line = Decoration.line({
                                class: 'cm-yLineSelection',
                                attributes,
                            });
                            for (
                                let n = first.number + 1;
                                n < last.number;
                                n++
                            ) {
                                ranges.push(line.range(state.doc.line(n).from));
                            }
                        }
                    }
                    ranges.push(
                        Decoration.widget({
                            side: head.index > anchor.index ? -1 : 1,
                            widget: new RemoteCaret(color, name, until > now),
                        }).range(head.index)
                    );
                });
                if (nextExpiry !== Infinity) {
                    this.timer = setTimeout(
                        () => this.view.dispatch({}),
                        nextExpiry - now
                    );
                }
                return Decoration.set(ranges, true);
            }
        },
        { decorations: (value) => value.decorations }
    );
    return [yRemoteSelectionsTheme, plugin];
}
