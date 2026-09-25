import { randomInt } from 'node:crypto';

// No "l" or "o" so codes survive being read aloud or copied by hand.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz';

const pick = (length) =>
    Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export const ROOM_CODE_PATTERN = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

export function generateRoomCode() {
    return `${pick(3)}-${pick(4)}-${pick(3)}`;
}
