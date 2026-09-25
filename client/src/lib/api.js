export class ApiError extends Error {
    constructor(status, message, fields = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fields = fields;
    }
}

async function request(path, { method = 'GET', body, signal } = {}) {
    let response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            signal,
            credentials: 'same-origin',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError(0, 'Could not reach CodeMate. Check your connection and try again.');
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(
            response.status,
            data?.error?.message ?? `The server answered with an error (${response.status}).`,
            data?.error?.fields
        );
    }
    return data;
}

const room = (roomId) => `/sessions/${encodeURIComponent(roomId)}`;

export const api = {
    me: (signal) => request('/auth/me', { signal }),
    register: (input) => request('/auth/register', { method: 'POST', body: input }),
    login: (input) => request('/auth/login', { method: 'POST', body: input }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    socketToken: () => request('/auth/socket-token'),

    listSessions: (signal) => request('/sessions', { signal }),
    createSession: (input) => request('/sessions', { method: 'POST', body: input }),
    getSession: (roomId, signal) => request(room(roomId), { signal }),
    joinSession: (roomId) => request(`${room(roomId)}/join`, { method: 'POST' }),
    endSession: (roomId) => request(`${room(roomId)}/end`, { method: 'POST' }),
    deleteSession: (roomId) => request(room(roomId), { method: 'DELETE' }),
};
