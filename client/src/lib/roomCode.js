const CODE = /([a-z]{3})-?([a-z]{4})-?([a-z]{3})(?![a-z])/g;

// Accepts "abc-defg-hij", "ABCDEFGHIJ" or a full invite link and returns the canonical code.
export function parseRoomCode(input) {
    const matches = [...input.trim().toLowerCase().matchAll(CODE)];
    const last = matches.at(-1);
    return last ? `${last[1]}-${last[2]}-${last[3]}` : null;
}

export const inviteLink = (roomId) => `${window.location.origin}/session/${roomId}`;
