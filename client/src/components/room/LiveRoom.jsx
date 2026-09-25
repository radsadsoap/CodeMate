import {
    CircleNotchIcon,
    HandIcon,
    LinkIcon,
    LockSimpleIcon,
    PlayIcon,
    StopCircleIcon,
    UserMinusIcon,
    UserPlusIcon,
    UsersIcon,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useSessions } from '../../context/SessionsContext';
import { useShell } from '../../context/ShellContext';
import { useToast } from '../../context/ToastContext';
import { useRoom } from '../../hooks/useRoom';
import { useVoice } from '../../hooks/useVoice';
import { api } from '../../lib/api';
import { cx } from '../../lib/cx';
import { modifierKey } from '../../lib/format';
import { LANGUAGES, languageById } from '../../lib/languages';
import { inviteLink } from '../../lib/roomCode';
import { runCode } from '../../lib/runner';
import { CollaborativeEditor } from '../editor/CollaborativeEditor';
import { PageHeader } from '../shell/PageHeader';
import { Badge } from '../ui/Badge';
import { Button, IconButton } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { Sheet } from '../ui/Sheet';
import { Skeleton } from '../ui/Skeleton';
import { MembersPanel } from './MembersPanel';
import { OutputPanel } from './OutputPanel';
import { VoiceDock } from './VoiceDock';

const NO_MEMBERS = [];
const CONNECTION_TEXT = {
    connecting: 'Connecting…',
    live: 'Connected',
    reconnecting: 'Reconnecting…',
    error: 'Disconnected',
    closed: 'Closed',
};

function MembersSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-4" aria-hidden>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
}

export function LiveRoom({ session, onClosed }) {
    const { user, expire } = useAuth();
    const { patch: patchSession } = useSessions();
    const { isDesktop, voiceSlot } = useShell();
    const notify = useToast();
    const languageId = useId();
    const [membersOpen, setMembersOpen] = useState(
        () => window.matchMedia('(min-width: 80rem)').matches
    );
    const [membersSheetOpen, setMembersSheetOpen] = useState(false);
    const [confirmEnd, setConfirmEnd] = useState(false);
    const [ending, setEnding] = useState(false);
    const [stdin, setStdin] = useState('');
    const isOwner = session.isOwner;

    const onEvent = useCallback(
        (event) => {
            if (event.type === 'error')
                notify({ title: event.message, tone: 'error' });
            if (!isOwner) return;
            if (event.type === 'hand') {
                notify({
                    title: `${event.member.name} raised a hand`,
                    tone: 'warning',
                    icon: HandIcon,
                });
            }
            if (event.type === 'joined')
                notify({
                    title: `${event.member.name} joined`,
                    icon: UserPlusIcon,
                    duration: 3000,
                });
            if (event.type === 'left')
                notify({
                    title: `${event.member.name} left`,
                    icon: UserMinusIcon,
                    duration: 3000,
                });
        },
        [notify, isOwner]
    );

    const room = useRoom(session.roomId, user, {
        onEvent,
        onUnauthorized: expire,
    });
    const { snapshot, me, doc, awareness, running, lastRun, status, actions } =
        room;
    const voice = useVoice({
        socket: room.socket,
        iceServers: room.iceServers,
        members: snapshot?.members ?? NO_MEMBERS,
        me,
    });

    const language = snapshot?.language ?? session.language;
    const ytext = useMemo(
        () => doc?.getText(language) ?? null,
        [doc, language]
    );
    const canEdit = Boolean(me?.canEdit);
    const handRaised = Boolean(me?.handRaisedAt);
    const members = snapshot?.members ?? NO_MEMBERS;
    const inVoice = members.filter((member) => member.voice.joined).length;
    const raisedHands = members.filter((member) => member.handRaisedAt).length;
    const hasSnapshot = Boolean(snapshot);

    useEffect(() => {
        if (status === 'closed') onClosed(room.closedReason);
    }, [status, room.closedReason, onClosed]);

    useEffect(() => {
        if (hasSnapshot)
            patchSession(session.roomId, { language, raisedHands });
    }, [hasSnapshot, patchSession, session.roomId, language, raisedHands]);

    const run = useCallback(async () => {
        if (!ytext || running || status !== 'live') return;
        const code = ytext.toString();
        if (!code.trim()) {
            notify({ title: 'There is no code to run yet.' });
            return;
        }
        let runId;
        try {
            ({ runId } = await actions.startRun(language));
        } catch (error) {
            notify({ title: error.message, tone: 'warning' });
            return;
        }
        const result = await runCode({ language, code, stdin });
        actions.finishRun(runId, result);
    }, [ytext, running, status, language, stdin, actions, notify]);

    const copyInvite = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink(session.roomId));
            notify({
                title: 'Invite link copied',
                description: 'Send it to students so they can join.',
                tone: 'success',
            });
        } catch {
            notify({
                title: `Share this code: ${session.roomId}`,
                tone: 'neutral',
                duration: 8000,
            });
        }
    };

    const toggleHand = () =>
        (handRaised ? actions.lowerHand() : actions.raiseHand()).catch(
            (error) => notify({ title: error.message, tone: 'error' })
        );

    const changeLanguage = (next) => {
        actions
            .setLanguage(next)
            .catch((error) => notify({ title: error.message, tone: 'error' }));
    };

    const endSession = async () => {
        setEnding(true);
        try {
            await api.endSession(session.roomId);
            onClosed('ended');
        } catch (error) {
            notify({ title: error.message, tone: 'error' });
            setEnding(false);
            setConfirmEnd(false);
        }
    };

    const ready = Boolean(snapshot && ytext && awareness);
    const peopleShown = isDesktop ? membersOpen : membersSheetOpen;
    const voiceDock = ready ? (
        <VoiceDock
            voice={voice}
            me={me}
            inVoice={inVoice}
            roomTitle={session.title}
        />
    ) : null;
    const membersPanel = ready ? (
        <MembersPanel
            room={room}
            userId={user.id}
            footer={isDesktop ? null : voiceDock}
        />
    ) : (
        <MembersSkeleton />
    );

    return (
        <>
            <div className="flex min-h-0 flex-1">
                <main id="main" className="flex min-w-0 flex-1 flex-col">
                    <PageHeader>
                        <h1 className="text-fg min-w-0 truncate text-[15px] font-semibold tracking-tight">
                            {session.title}
                        </h1>
                        {ready && !canEdit && (
                            <Badge className="hidden sm:inline-flex">
                                <LockSimpleIcon
                                    aria-hidden
                                    size={12}
                                    weight="bold"
                                />
                                View only
                            </Badge>
                        )}
                        <span
                            role="status"
                            className={
                                status === 'live'
                                    ? 'sr-only'
                                    : 'text-warning-text shrink-0 text-xs font-medium'
                            }
                        >
                            {CONNECTION_TEXT[status] ??
                                CONNECTION_TEXT.connecting}
                        </span>

                        <div className="ml-auto flex shrink-0 items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyInvite}
                                title="Copy invite link"
                                className="hidden font-mono md:inline-flex"
                            >
                                <LinkIcon aria-hidden size={15} />
                                <span translate="no">{session.roomId}</span>
                                <span className="sr-only">
                                    , copy invite link
                                </span>
                            </Button>
                            <IconButton
                                size="sm"
                                label="Copy invite link"
                                onClick={copyInvite}
                                className="md:hidden"
                            >
                                <LinkIcon aria-hidden size={16} />
                            </IconButton>

                            <label htmlFor={languageId} className="sr-only">
                                Language
                            </label>
                            <Select
                                id={languageId}
                                size="sm"
                                value={language}
                                disabled={!canEdit || status !== 'live'}
                                onChange={(event) =>
                                    changeLanguage(event.target.value)
                                }
                            >
                                {LANGUAGES.map(({ id, label }) => (
                                    <option key={id} value={id}>
                                        {label}
                                    </option>
                                ))}
                            </Select>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={run}
                                disabled={
                                    !ready ||
                                    Boolean(running) ||
                                    status !== 'live'
                                }
                                title={`Run ${languageById[language]?.label ?? ''} (${modifierKey} Enter)`}
                            >
                                {running ? (
                                    <CircleNotchIcon
                                        aria-hidden
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <PlayIcon
                                        aria-hidden
                                        size={15}
                                        weight="fill"
                                    />
                                )}
                                Run
                            </Button>

                            {!isOwner && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={toggleHand}
                                    disabled={!ready || status !== 'live'}
                                    className={
                                        handRaised
                                            ? 'border-warning-text/50 bg-warning-soft text-warning-text hover:bg-warning-soft'
                                            : undefined
                                    }
                                >
                                    <HandIcon
                                        aria-hidden
                                        size={15}
                                        weight={handRaised ? 'fill' : 'regular'}
                                    />
                                    <span className="hidden sm:inline">
                                        {handRaised
                                            ? 'Lower hand'
                                            : 'Raise hand'}
                                    </span>
                                    <span className="sr-only sm:hidden">
                                        {handRaised
                                            ? 'Lower hand'
                                            : 'Raise hand'}
                                    </span>
                                </Button>
                            )}

                            {isOwner && (
                                <Button
                                    variant="quiet"
                                    size="sm"
                                    onClick={() => setConfirmEnd(true)}
                                >
                                    <StopCircleIcon aria-hidden size={16} />
                                    <span className="hidden sm:inline">
                                        End session
                                    </span>
                                    <span className="sr-only sm:hidden">
                                        End session
                                    </span>
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                aria-pressed={peopleShown}
                                aria-label={`${peopleShown ? 'Hide' : 'Show'} people, ${members.length} in the room`}
                                title={
                                    peopleShown ? 'Hide people' : 'Show people'
                                }
                                onClick={() =>
                                    isDesktop
                                        ? setMembersOpen((open) => !open)
                                        : setMembersSheetOpen(true)
                                }
                                className={cx(
                                    'px-2.5',
                                    peopleShown && 'bg-surface-3 text-fg'
                                )}
                            >
                                <UsersIcon aria-hidden size={16} />
                                <span className="tabular-nums">
                                    {members.length}
                                </span>
                            </Button>
                        </div>
                    </PageHeader>

                    <div className="bg-editor-bg min-h-0 flex-1">
                        {ready ? (
                            <CollaborativeEditor
                                ytext={ytext}
                                awareness={awareness}
                                language={language}
                                readOnly={!canEdit}
                                onRun={run}
                                label={`${languageById[language]?.label} code for ${session.title}`}
                            />
                        ) : (
                            <div
                                className="flex flex-col gap-3 p-6"
                                aria-busy="true"
                            >
                                <span className="sr-only">
                                    Loading the shared code…
                                </span>
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-3/5" />
                                <Skeleton className="h-4 w-1/3" />
                            </div>
                        )}
                    </div>
                    <OutputPanel
                        running={running}
                        lastRun={lastRun}
                        stdin={stdin}
                        onStdinChange={setStdin}
                        className="h-[34%] min-h-40"
                    />
                </main>

                {isDesktop && membersOpen && (
                    <aside
                        aria-label="People"
                        className="border-border bg-surface flex w-72 shrink-0 flex-col border-l"
                    >
                        {membersPanel}
                    </aside>
                )}
            </div>

            {!isDesktop && (
                <Sheet
                    side="right"
                    label="People"
                    open={membersSheetOpen}
                    onClose={() => setMembersSheetOpen(false)}
                >
                    {membersPanel}
                </Sheet>
            )}
            {isDesktop &&
                voiceSlot &&
                voiceDock &&
                createPortal(voiceDock, voiceSlot)}

            <Dialog
                open={confirmEnd}
                onClose={() => !ending && setConfirmEnd(false)}
                title="End this session?"
                description="Editing stops for everyone. People who joined can still open a read-only copy of the final code."
            >
                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setConfirmEnd(false)}
                        disabled={ending}
                    >
                        Keep it running
                    </Button>
                    <Button
                        variant="danger"
                        size="lg"
                        onClick={endSession}
                        loading={ending}
                    >
                        {ending ? 'Ending…' : 'End session'}
                    </Button>
                </div>
            </Dialog>
        </>
    );
}
