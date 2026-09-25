import {
    HandIcon,
    MicrophoneIcon,
    MicrophoneSlashIcon,
    PencilSimpleIcon,
    PencilSimpleSlashIcon,
} from '@phosphor-icons/react';
import { useToast } from '../../context/ToastContext';
import { IconButton } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { MemberRow } from './MemberRow';

function HostActions({ member, locked, run }) {
    const { voice } = member;
    return (
        <>
            {member.handRaisedAt && (
                <IconButton
                    size="sm"
                    label={`Lower ${member.name}'s hand`}
                    onClick={() => run((actions) => actions.lowerHand(member.id))}
                    className="text-warning-text hover:bg-warning-soft hover:text-warning-text"
                >
                    <HandIcon aria-hidden size={16} weight="fill" />
                </IconButton>
            )}
            {locked && (
                <IconButton
                    size="sm"
                    label={member.canEdit ? `Stop ${member.name} from editing` : `Let ${member.name} edit`}
                    onClick={() => run((actions) => actions.setCanEdit(member.id, !member.canEdit))}
                    className={member.canEdit ? 'text-accent-text hover:text-accent-text' : undefined}
                >
                    {member.canEdit ? (
                        <PencilSimpleIcon aria-hidden size={16} weight="bold" />
                    ) : (
                        <PencilSimpleSlashIcon aria-hidden size={16} />
                    )}
                </IconButton>
            )}
            {voice.joined && (
                <IconButton
                    size="sm"
                    label={voice.mutedByHost ? `Let ${member.name} talk` : `Mute ${member.name}`}
                    onClick={() => run((actions) => actions.muteUser(member.id, !voice.mutedByHost))}
                    className={voice.mutedByHost ? 'text-danger-text hover:text-danger-text' : undefined}
                >
                    {voice.mutedByHost ? (
                        <MicrophoneSlashIcon aria-hidden size={16} weight="bold" />
                    ) : (
                        <MicrophoneIcon aria-hidden size={16} />
                    )}
                </IconButton>
            )}
        </>
    );
}

function Group({ title, members, render }) {
    if (members.length === 0) return null;
    return (
        <section className="flex flex-col">
            <h3 className="px-3 pt-3 pb-1 text-xs font-medium text-fg-subtle">
                {title} <span className="tabular-nums">({members.length})</span>
            </h3>
            <ul className="flex flex-col">{members.map(render)}</ul>
        </section>
    );
}

export function MembersPanel({ room, userId, footer }) {
    const notify = useToast();
    const { snapshot, actions } = room;
    const isOwner = snapshot.ownerId === userId;
    const { members, editLocked } = snapshot;

    const hosts = members.filter((member) => member.isOwner);
    const waiting = members
        .filter((member) => !member.isOwner && member.handRaisedAt)
        .sort((a, b) => a.handRaisedAt - b.handRaisedAt);
    const others = members.filter((member) => !member.isOwner && !member.handRaisedAt);

    const run = async (task) => {
        try {
            await task(actions);
        } catch (error) {
            notify({ title: error.message, tone: 'error' });
        }
    };

    const render = (member) => (
        <MemberRow
            key={member.id}
            member={member}
            isSelf={member.id === userId}
            locked={editLocked}
            actions={isOwner && !member.isOwner ? <HostActions member={member} locked={editLocked} run={run} /> : null}
        />
    );

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
                <h2 className="text-[13px] font-semibold text-fg">People</h2>
                <span className="text-xs text-fg-subtle tabular-nums">{members.length} in the room</span>
            </div>

            {isOwner && (
                <div className="shrink-0 border-b border-border px-4 py-3">
                    <Switch
                        checked={editLocked}
                        onChange={(locked) => run((a) => a.setLocked(locked))}
                        label="Lock editing"
                        description={editLocked ? 'Only you and people you allow can type.' : 'Everyone in the room can type.'}
                    />
                </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto pb-3">
                <Group title="Host" members={hosts} render={render} />
                <Group title="Raised hands" members={waiting} render={render} />
                <Group title="Participants" members={others} render={render} />
            </div>

            {footer}
        </div>
    );
}
