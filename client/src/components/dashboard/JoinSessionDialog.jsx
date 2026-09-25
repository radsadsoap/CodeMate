import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { parseRoomCode } from '../../lib/roomCode';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { TextField } from '../ui/TextField';

function JoinSessionForm({ initialCode, onCancel }) {
    const navigate = useNavigate();
    const [value, setValue] = useState(initialCode ?? '');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const code = parseRoomCode(value);
        if (!code) {
            setError(
                'That is not a session code. Codes look like abc-defg-hij.'
            );
            event.target.elements.code?.focus();
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await api.joinSession(code);
            navigate(`/session/${code}`);
        } catch (joinError) {
            setError(joinError.message);
            setSubmitting(false);
            event.target.elements.code?.focus();
        }
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <TextField
                label="Session code"
                name="code"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="abc-defg-hij…"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                data-autofocus
                inputClassName="font-mono"
                error={error}
                hint="Paste the code or the whole invite link your TA shared."
            />
            <div className="flex justify-end gap-2">
                <Button variant="secondary" size="lg" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                >
                    {submitting ? 'Joining…' : 'Join session'}
                </Button>
            </div>
        </form>
    );
}

export function JoinSessionDialog({ open, onClose, initialCode }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Join a session"
            description="Enter the code your TA gave you."
        >
            {open && (
                <JoinSessionForm initialCode={initialCode} onCancel={onClose} />
            )}
        </Dialog>
    );
}
