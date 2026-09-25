import { LockSimpleIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { formatDateTime } from '../../lib/format';
import { LANGUAGES } from '../../lib/languages';
import { ReadOnlyEditor } from '../editor/ReadOnlyEditor';
import { PageHeader } from '../shell/PageHeader';
import { StateMessage } from '../StateMessage';
import { Badge } from '../ui/Badge';
import { Tabs, TabPanel } from '../ui/Tabs';

export function EndedSession({ session }) {
    const idBase = useId();
    const [language, setLanguage] = useState(session.language);

    return (
        <>
            <PageHeader>
                <h1 className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-fg">{session.title}</h1>
                <Badge>Ended</Badge>
                <p className="ml-auto hidden truncate text-xs text-fg-subtle md:block">
                    {session.endedAt ? `Ended ${formatDateTime(session.endedAt)}. ` : ''}Hosted by {session.owner.name}.
                </p>
            </PageHeader>
            {session.code ? (
                <main id="main" className="flex min-h-0 flex-1 flex-col">
                    <div className="flex h-10 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
                        <Tabs
                            idBase={idBase}
                            label="Language"
                            value={language}
                            onChange={setLanguage}
                            tabs={LANGUAGES.map(({ id, label }) => ({ id, label }))}
                        />
                        <span className="ml-auto hidden text-xs text-fg-subtle sm:block">Read-only copy of the final code</span>
                    </div>
                    {LANGUAGES.map(({ id, label }) => (
                        <TabPanel key={id} idBase={idBase} id={id} value={language} className="min-h-0 flex-1 bg-editor-bg">
                            {language === id && (
                                <ReadOnlyEditor value={session.code[id] ?? ''} language={id} label={`${label} code from ${session.title}`} />
                            )}
                        </TabPanel>
                    ))}
                </main>
            ) : (
                <main id="main" className="min-h-0 flex-1 overflow-y-auto">
                    <StateMessage
                        icon={LockSimpleIcon}
                        title="This session has ended"
                        description="Only people who joined it while it was live can open its final code."
                    />
                </main>
            )}
        </>
    );
}
