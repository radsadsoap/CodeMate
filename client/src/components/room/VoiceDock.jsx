import { HeadphonesIcon, MicrophoneIcon, MicrophoneSlashIcon, PhoneDisconnectIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { Button, IconButton } from '../ui/Button';

// Voice state and controls, docked above the account panel like a call bar.
export function VoiceDock({ voice, me, inVoice, roomTitle }) {
    const [joining, setJoining] = useState(false);
    const mutedByHost = Boolean(me?.voice.mutedByHost);

    const join = async () => {
        setJoining(true);
        await voice.join();
        setJoining(false);
    };

    let subtitle = roomTitle;
    if (!voice.joined) subtitle = inVoice > 0 ? `${inVoice} in voice now` : 'Nobody is in voice yet';
    else if (mutedByHost) subtitle = 'Muted by the TA';
    else if (!voice.micAvailable) subtitle = 'Listening only, no microphone';

    return (
        <div className="shrink-0 border-t border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 leading-tight">
                    <p className={voice.joined ? 'text-[13px] font-medium text-accent-text' : 'text-[13px] font-medium text-fg'}>
                        {voice.joined ? 'Voice connected' : 'Voice chat'}
                    </p>
                    <p className={mutedByHost ? 'truncate text-xs text-danger-text' : 'truncate text-xs text-fg-subtle'}>{subtitle}</p>
                </div>
                {voice.joined ? (
                    <>
                        <IconButton
                            size="sm"
                            label={voice.micOn ? 'Mute your microphone' : 'Unmute your microphone'}
                            disabled={mutedByHost || !voice.micAvailable}
                            onClick={() => voice.setMic(!voice.micOn)}
                            className={voice.micOn ? 'text-fg' : 'text-danger-text hover:text-danger-text'}
                        >
                            {voice.micOn ? (
                                <MicrophoneIcon aria-hidden size={17} weight="fill" />
                            ) : (
                                <MicrophoneSlashIcon aria-hidden size={17} />
                            )}
                        </IconButton>
                        <IconButton size="sm" label="Leave voice" onClick={voice.leave} className="hover:bg-danger-soft hover:text-danger-text">
                            <PhoneDisconnectIcon aria-hidden size={17} />
                        </IconButton>
                    </>
                ) : (
                    <Button variant="secondary" size="sm" loading={joining} onClick={join}>
                        {!joining && <HeadphonesIcon aria-hidden size={15} />}
                        {joining ? 'Joining…' : 'Join'}
                    </Button>
                )}
            </div>
            {voice.error && <p className="mt-2 text-xs text-warning-text">{voice.error}</p>}
        </div>
    );
}
