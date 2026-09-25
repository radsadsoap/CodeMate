import { languageById } from './languages';

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
// Wandbox stops runaway programs itself after about 30 seconds, so no answer by 45 means it stalled.
const TIMEOUT_MS = 45_000;
const MAX_OUTPUT = 64_000;

// Wandbox compiles Java as prog.java, so a public top-level type named anything else fails to
// compile. Dropping `public` keeps the program identical; Wandbox launches the class with main().
const PUBLIC_TYPE =
    /^(\s*)public\s+((?:(?:abstract|final|sealed|non-sealed|strictfp)\s+)*)(class|interface|enum|record)\b/gm;

const clip = (text = '') =>
    text.length > MAX_OUTPUT
        ? `${text.slice(0, MAX_OUTPUT)}\n[output truncated]`
        : text;

const outcome = (status, fields = {}) => ({
    status,
    exitCode: null,
    stdout: '',
    stderr: '',
    compileOutput: '',
    durationMs: 0,
    ...fields,
});

export async function runCode({ language, code, stdin = '' }) {
    const { compiler } = languageById[language];
    const source =
        language === 'java' ? code.replace(PUBLIC_TYPE, '$1$2$3') : code;
    const startedAt = performance.now();
    const elapsed = () => Math.round(performance.now() - startedAt);

    let response;
    let data;
    try {
        response = await fetch(WANDBOX_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                compiler,
                code: source,
                stdin,
                save: false,
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) data = await response.json();
    } catch (error) {
        return outcome('unavailable', {
            durationMs: elapsed(),
            message:
                error.name === 'TimeoutError'
                    ? 'Wandbox did not answer within 45 seconds. It is a free shared service and sometimes stalls, so run the code again.'
                    : 'Could not reach the Wandbox runner. Check your connection and try again.',
        });
    }

    if (response.status === 429) {
        return outcome('rate_limited', {
            durationMs: elapsed(),
            message:
                'Wandbox allows 10 runs a minute from one network. Wait a few seconds and run again.',
        });
    }
    if (!response.ok) {
        return outcome('unavailable', {
            durationMs: elapsed(),
            message: `The Wandbox runner answered with an error (${response.status}). Try again shortly.`,
        });
    }

    const exitCode = Number.parseInt(data.status, 10);
    const stdout = clip(data.program_output);
    const stderr = clip(data.program_error);
    const compileOutput = clip(
        [data.compiler_output, data.compiler_error].filter(Boolean).join('')
    );
    const fields = {
        exitCode: Number.isNaN(exitCode) ? null : exitCode,
        stdout,
        stderr,
        compileOutput,
        durationMs: elapsed(),
    };

    if (exitCode === 137 || data.signal === 'Killed') {
        return outcome('timeout', {
            ...fields,
            message:
                'Wandbox stopped the program for running longer than about 30 seconds or using too much memory. Look for an infinite loop.',
        });
    }
    if (exitCode !== 0 && data.compiler_error && !stdout && !stderr) {
        return outcome('compile_error', fields);
    }
    return outcome(exitCode === 0 ? 'ok' : 'error', fields);
}
