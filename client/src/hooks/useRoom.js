import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as Y from 'yjs';
import { createSocket } from '../lib/socket';

const REMOTE = 'remote';
const ACK_TIMEOUT_MS = 8_000;

function createDocument() {
    const doc = new Y.Doc();
    return { doc, awareness: new awarenessProtocol.Awareness(doc) };
}

/**
 * Live session state: the Socket.IO connection, the shared Yjs document and cursors,
 * presence, raised hands, run results and moderation actions.
 */
export function useRoom(roomId, user, { onEvent, onUnauthorized } = {}) {
    const [status, setStatus] = useState('connecting');
    const [error, setError] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [running, setRunning] = useState(null);
    const [lastRun, setLastRun] = useState(null);
    const [savedAt, setSavedAt] = useState(null);
    const [iceServers, setIceServers] = useState([]);
    const [closedReason, setClosedReason] = useState(null);
    const [shared, setShared] = useState(null);
    const [socket, setSocket] = useState(null);

    const callbacks = useRef({ onEvent, onUnauthorized });
    useEffect(() => {
        callbacks.current = { onEvent, onUnauthorized };
    }, [onEvent, onUnauthorized]);

    useEffect(() => {
        const client = createSocket();
        const emitEvent = (event) => callbacks.current.onEvent?.(event);
        let current = createDocument();
        let joined = false;
        let disposed = false;

        const sendUpdate = (update, origin) => {
            if (origin !== REMOTE && joined && client.connected) client.emit('yjs:update', update);
        };
        const sendAwareness = ({ added, updated, removed }, origin) => {
            if (origin === REMOTE || !joined || !client.connected) return;
            const changed = [...added, ...updated, ...removed];
            client.emit('awareness:update', awarenessProtocol.encodeAwarenessUpdate(current.awareness, changed));
        };
        const bind = ({ doc, awareness }) => {
            doc.on('update', sendUpdate);
            awareness.on('update', sendAwareness);
            // The server replaces this with the verified account name and color before relaying it.
            awareness.setLocalStateField('user', { name: user.name });
        };
        const release = ({ doc, awareness }) => {
            doc.off('update', sendUpdate);
            awareness.off('update', sendAwareness);
            awareness.destroy();
            doc.destroy();
        };

        const join = async () => {
            let response;
            try {
                response = await client.timeout(ACK_TIMEOUT_MS).emitWithAck('room:join', { roomId });
            } catch {
                if (!disposed) setStatus('reconnecting');
                return;
            }
            if (disposed) return;

            if (response?.error) {
                const missing = response.error.code === 'not_found';
                setError(response.error.message);
                setClosedReason(missing ? 'missing' : null);
                setStatus(missing ? 'closed' : 'error');
                client.disconnect();
                return;
            }

            const { doc, awareness } = current;
            const serverState = new Uint8Array(response.doc);
            Y.applyUpdate(doc, serverState, REMOTE);
            if (response.awareness) {
                awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(response.awareness), REMOTE);
            }
            joined = true;

            // Edits typed while the connection was down get pushed once the server's state is known.
            const me = response.state.members.find((member) => member.id === user.id);
            const offlineEdits = Y.encodeStateAsUpdate(doc, Y.encodeStateVectorFromUpdate(serverState));
            if (me?.canEdit && offlineEdits.byteLength > 2) client.emit('yjs:update', offlineEdits);
            client.emit('awareness:update', awarenessProtocol.encodeAwarenessUpdate(awareness, [doc.clientID]));

            setSnapshot(response.state);
            setRunning(response.state.running);
            setLastRun(response.lastRun);
            setIceServers(response.iceServers ?? []);
            setError(null);
            setStatus('live');
        };

        // The server rejected an edit, so the local copy is ahead of it. Start again from the server's copy.
        const resync = () => {
            const previous = current;
            awarenessProtocol.removeAwarenessStates(previous.awareness, [previous.doc.clientID], 'local');
            current = createDocument();
            bind(current);
            setShared(current);
            release(previous);
            joined = false;
            join();
        };

        client.on('connect', join);
        client.on('disconnect', (reason) => {
            joined = false;
            const { doc, awareness } = current;
            const others = [...awareness.getStates().keys()].filter((id) => id !== doc.clientID);
            if (others.length) awarenessProtocol.removeAwarenessStates(awareness, others, REMOTE);
            if (!disposed && reason !== 'io client disconnect') setStatus('reconnecting');
        });
        client.on('connect_error', (connectError) => {
            if (connectError.message === 'unauthorized') {
                setStatus('error');
                setError('Your sign-in expired. Sign in again to rejoin the session.');
                callbacks.current.onUnauthorized?.();
                return;
            }
            setStatus('reconnecting');
        });

        client.on('yjs:update', (update) => Y.applyUpdate(current.doc, new Uint8Array(update), REMOTE));
        client.on('awareness:update', (update) =>
            awarenessProtocol.applyAwarenessUpdate(current.awareness, new Uint8Array(update), REMOTE)
        );
        client.on('room:state', (next) => {
            setSnapshot(next);
            setRunning(next.running);
        });
        client.on('room:resync', resync);
        client.on('room:error', ({ message }) => emitEvent({ type: 'error', message }));
        client.on('room:member-joined', (member) => emitEvent({ type: 'joined', member }));
        client.on('room:member-left', (member) => emitEvent({ type: 'left', member }));
        client.on('hand:raised', (member) => emitEvent({ type: 'hand', member }));
        client.on('doc:saved', ({ at }) => setSavedAt(at));
        client.on('run:started', (run) => setRunning(run));
        client.on('run:finished', (result) => {
            setRunning(null);
            setLastRun(result);
        });
        client.on('room:closed', ({ reason }) => {
            joined = false;
            setClosedReason(reason);
            setStatus('closed');
            client.disconnect();
        });

        bind(current);
        setShared(current);
        setSocket(client);
        client.connect();

        return () => {
            disposed = true;
            client.removeAllListeners();
            client.disconnect();
            release(current);
        };
    }, [roomId, user.id, user.name]);

    const request = useCallback(
        async (event, payload) => {
            if (!socket?.connected) throw new Error('You are offline. Wait for the connection to come back.');
            const response = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload);
            if (response?.error) throw new Error(response.error.message);
            return response;
        },
        [socket]
    );

    const actions = useMemo(
        () => ({
            setLanguage: (language) => request('room:language', { language }),
            setLocked: (locked) => request('room:lock', { locked }),
            setCanEdit: (userId, allowed) => request('room:grant', { userId, allowed }),
            raiseHand: () => request('hand:raise'),
            lowerHand: (userId) => request('hand:lower', userId ? { userId } : {}),
            muteUser: (userId, muted) => request('voice:mute', { userId, muted }),
            startRun: (language) => request('run:start', { language }),
            finishRun: (runId, result) => socket?.emit('run:finish', { runId, result }),
        }),
        [request, socket]
    );

    const me = snapshot?.members.find((member) => member.id === user.id) ?? null;

    return {
        status,
        error,
        closedReason,
        snapshot,
        me,
        running,
        lastRun,
        savedAt,
        iceServers,
        socket,
        doc: shared?.doc ?? null,
        awareness: shared?.awareness ?? null,
        actions,
    };
}
