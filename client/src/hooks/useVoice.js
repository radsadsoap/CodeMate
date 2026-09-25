import { useCallback, useEffect, useRef, useState } from 'react';

const AUDIO_CONSTRAINTS = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

/**
 * Mesh voice chat over WebRTC. Socket.IO only carries signaling, and only between people
 * in the same room. Each receiver also silences anyone the TA has muted, so a modified
 * client cannot talk over a mute.
 */
export function useVoice({ socket, iceServers, members, me }) {
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [micAvailable, setMicAvailable] = useState(true);
    const [error, setError] = useState(null);

    const streamRef = useRef(null);
    const peersRef = useRef(new Map());
    const joinedRef = useRef(false);
    const iceRef = useRef(iceServers);
    const membersRef = useRef(members);

    useEffect(() => {
        iceRef.current = iceServers;
    }, [iceServers]);

    const applyHostMutes = useCallback(() => {
        const muted = new Set(membersRef.current.filter((m) => m.voice.mutedByHost).map((m) => m.id));
        for (const peer of peersRef.current.values()) peer.audio.muted = muted.has(peer.userId);
    }, []);

    useEffect(() => {
        membersRef.current = members;
        applyHostMutes();
    }, [members, applyHostMutes]);

    const closePeer = useCallback((socketId) => {
        const peer = peersRef.current.get(socketId);
        if (!peer) return;
        peer.pc.close();
        peer.audio.srcObject = null;
        peersRef.current.delete(socketId);
    }, []);

    const createPeer = useCallback(
        (socketId, userId) => {
            const pc = new RTCPeerConnection({ iceServers: iceRef.current });
            const audio = new Audio();
            audio.autoplay = true;
            const peer = { pc, audio, userId, polite: socket.id < socketId, makingOffer: false, ignoreOffer: false };
            peersRef.current.set(socketId, peer);

            const stream = streamRef.current;
            if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            else pc.addTransceiver('audio', { direction: 'recvonly' });

            pc.ontrack = ({ streams }) => {
                audio.srcObject = streams[0];
                audio.play().catch(() => {});
                applyHostMutes();
            };
            pc.onicecandidate = ({ candidate }) => {
                socket.emit('voice:signal', { to: socketId, candidate: candidate ? candidate.toJSON() : null });
            };
            pc.onnegotiationneeded = async () => {
                try {
                    peer.makingOffer = true;
                    await pc.setLocalDescription();
                    const { type, sdp } = pc.localDescription;
                    socket.emit('voice:signal', { to: socketId, description: { type, sdp } });
                } catch (negotiationError) {
                    console.warn('Voice negotiation failed', negotiationError);
                } finally {
                    peer.makingOffer = false;
                }
            };
            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed') pc.restartIce();
            };
            return peer;
        },
        [socket, applyHostMutes]
    );

    // Perfect negotiation: the polite side yields when both sides offer at once.
    const handleSignal = useCallback(
        async ({ from, description, candidate }) => {
            if (!joinedRef.current) return;
            const peer = peersRef.current.get(from);
            if (!peer) return;
            const { pc } = peer;
            try {
                if (description) {
                    const collision = description.type === 'offer' && (peer.makingOffer || pc.signalingState !== 'stable');
                    peer.ignoreOffer = !peer.polite && collision;
                    if (peer.ignoreOffer) return;
                    await pc.setRemoteDescription(description);
                    if (description.type === 'offer') {
                        await pc.setLocalDescription();
                        const { type, sdp } = pc.localDescription;
                        socket.emit('voice:signal', { to: from, description: { type, sdp } });
                    }
                } else if (candidate !== undefined) {
                    await pc.addIceCandidate(candidate ?? undefined).catch((candidateError) => {
                        if (!peer.ignoreOffer) throw candidateError;
                    });
                }
            } catch (signalError) {
                console.warn('Voice signaling failed', signalError);
            }
        },
        [socket]
    );

    useEffect(() => {
        if (!socket) return undefined;
        const onPeerJoined = ({ socketId, userId }) => {
            if (joinedRef.current && !peersRef.current.has(socketId)) createPeer(socketId, userId);
        };
        const onPeerLeft = ({ socketId }) => closePeer(socketId);
        socket.on('voice:peer-joined', onPeerJoined);
        socket.on('voice:peer-left', onPeerLeft);
        socket.on('voice:signal', handleSignal);
        return () => {
            socket.off('voice:peer-joined', onPeerJoined);
            socket.off('voice:peer-left', onPeerLeft);
            socket.off('voice:signal', handleSignal);
        };
    }, [socket, createPeer, closePeer, handleSignal]);

    const teardown = useCallback(() => {
        for (const socketId of [...peersRef.current.keys()]) closePeer(socketId);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        joinedRef.current = false;
        setJoined(false);
        setMicOn(false);
    }, [closePeer]);

    const join = useCallback(async () => {
        if (!socket?.connected || joinedRef.current) return;
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS });
            stream.getAudioTracks().forEach((track) => {
                track.enabled = false;
            });
            streamRef.current = stream;
            setMicAvailable(true);
        } catch {
            // Joining still works without a microphone; you can listen but not talk.
            streamRef.current = null;
            setMicAvailable(false);
            setError('Microphone access is blocked, so you joined as a listener. Allow the mic in your browser to talk.');
        }

        const response = await socket.timeout(8_000).emitWithAck('voice:join').catch(() => null);
        if (!response || response.error) {
            teardown();
            setError(response?.error?.message ?? 'Could not join voice. Try again.');
            return;
        }
        joinedRef.current = true;
        setJoined(true);
        for (const { socketId, userId } of response.peers) createPeer(socketId, userId);
    }, [socket, createPeer, teardown]);

    const leave = useCallback(() => {
        if (!joinedRef.current) return;
        socket?.emit('voice:leave');
        teardown();
    }, [socket, teardown]);

    const setMic = useCallback(
        (on) => {
            const track = streamRef.current?.getAudioTracks()[0];
            if (!track || (on && me?.voice.mutedByHost)) return;
            track.enabled = on;
            setMicOn(on);
            socket?.emit('voice:mic', { on });
        },
        [socket, me?.voice.mutedByHost]
    );

    useEffect(() => {
        if (!me?.voice.mutedByHost) return;
        const track = streamRef.current?.getAudioTracks()[0];
        if (track) track.enabled = false;
        setMicOn(false);
    }, [me?.voice.mutedByHost]);

    // A reconnect gives the socket a new id, so voice has to be joined again.
    useEffect(() => {
        if (!socket) return undefined;
        const onDisconnect = () => teardown();
        socket.on('disconnect', onDisconnect);
        return () => socket.off('disconnect', onDisconnect);
    }, [socket, teardown]);

    useEffect(() => () => teardown(), [teardown]);

    return { joined, micOn, micAvailable, error, join, leave, setMic };
}
