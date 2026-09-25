import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { cx } from '../../lib/cx';
import { LANGUAGES } from '../../lib/languages';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { TextField } from '../ui/TextField';

function CreateSessionForm({ onCancel }) {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('python');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        try {
            const { session } = await api.createSession({ title, language });
            navigate(`/session/${session.roomId}`);
        } catch (error) {
            setErrors({
                ...error.fields,
                form: error.fields?.title ? undefined : error.message,
            });
            setSubmitting(false);
            if (error.fields?.title) event.target.elements.title?.focus();
        }
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
            <TextField
                label="Title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Week 6: Dynamic programming…"
                maxLength={80}
                autoComplete="off"
                data-autofocus
                required
                error={errors.title}
                hint="Students see this in their session list."
            />

            <fieldset className="flex flex-col gap-2">
                <legend className="text-fg mb-1.5 text-sm font-medium">
                    Language
                </legend>
                <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((option) => (
                        <label
                            key={option.id}
                            className={cx(
                                'has-focus-visible:outline-focus flex cursor-pointer flex-col border px-3 py-2.5 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                                language === option.id
                                    ? 'border-accent bg-accent-soft'
                                    : 'border-border-strong hover:bg-surface-2'
                            )}
                        >
                            <input
                                type="radio"
                                name="language"
                                value={option.id}
                                checked={language === option.id}
                                onChange={() => setLanguage(option.id)}
                                className="sr-only"
                            />
                            <span className="text-fg text-sm font-medium">
                                {option.label}
                            </span>
                            <span className="text-fg-subtle text-xs">
                                {option.runtime}
                            </span>
                        </label>
                    ))}
                </div>
                <p className="text-fg-subtle text-[13px]">
                    You can switch languages inside the session at any time.
                </p>
            </fieldset>

            {errors.form && (
                <p
                    role="alert"
                    className="text-danger-text text-sm font-medium"
                >
                    {errors.form}
                </p>
            )}

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
                    {submitting ? 'Creating…' : 'Create session'}
                </Button>
            </div>
        </form>
    );
}

export function CreateSessionDialog({ open, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="New session"
            description="You get a code to share. Anyone with it can join while the session is live."
        >
            {open && <CreateSessionForm onCancel={onClose} />}
        </Dialog>
    );
}
