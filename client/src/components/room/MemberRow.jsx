import { HandIcon, MicrophoneIcon, MicrophoneSlashIcon } from '@phosphor-icons/react';
import { cx } from '../../lib/cx';
import { roleLabel } from '../../lib/format';
import { Avatar } from '../ui/Avatar';

function VoiceStatus({ voice }) {
    if (!voice.joined) return null;
    if (voice.mutedByHost) {
        return (
            <span className="text-danger-text" title="Muted by the TA">
                <MicrophoneSlashIcon aria-hidden size={16} weight="bold" />
                <span className="sr-only">Muted by the TA</span>
            </span>
        );
    }
    return voice.micOn ? (
        <span className="text-accent-text" title="Microphone on">
            <MicrophoneIcon aria-hidden size={16} weight="fill" />
            <span className="sr-only">Microphone on</span>
        </span>
    ) : (
        <span className="text-fg-subtle" title="In voice, microphone off">
            <MicrophoneSlashIcon aria-hidden size={16} />
            <span className="sr-only">In voice, microphone off</span>
        </span>
    );
}

export function MemberRow({ member, isSelf, locked, actions, className }) {
    const details = [member.isOwner ? 'Host' : roleLabel(member.role)];
    if (locked && !member.isOwner) details.push(member.canEdit ? 'can edit' : 'view only');

    return (
        <li
            className={cx(
                'group relative flex min-h-11 items-center gap-2.5 px-3 py-1.5 transition-colors duration-150 hover:bg-surface-2',
                className
            )}
        >
            <Avatar name={member.name} color={member.color} size={28} />
            <div className="min-w-0 flex-1 leading-tight">
                <p className="flex min-w-0 items-baseline gap-1.5 text-[13px] font-medium text-fg">
                    <span className="truncate">{member.name}</span>
                    {isSelf && <span className="shrink-0 text-xs font-normal text-fg-subtle">you</span>}
                </p>
                <p className="truncate text-xs text-fg-subtle">{details.join(', ')}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 pr-1">
                {member.handRaisedAt && (
                    <span className="text-warning-text" title="Hand raised">
                        <HandIcon aria-hidden size={16} weight="fill" />
                        <span className="sr-only">Hand raised</span>
                    </span>
                )}
                <VoiceStatus voice={member.voice} />
            </div>
            {actions && (
                // Stays focusable while hidden, so keyboard users reveal it by tabbing in.
                <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 bg-surface-2 px-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100">
                    {actions}
                </div>
            )}
        </li>
    );
}
