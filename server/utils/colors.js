// Each hue keeps white labels above 4.5:1 and stays visible as a caret on the dark editor.
const PALETTE = ['#d1343a', '#c2410c', '#a16207', '#1a7f37', '#0f766e', '#0969da', '#8250df', '#bf3989'];

// FNV-1a: ObjectIds created close together share long prefixes, so a weak hash collides a lot.
function hash(value) {
    let result = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
        result ^= value.charCodeAt(index);
        result = Math.imul(result, 0x01000193);
    }
    return result >>> 0;
}

// Starts from the user's own hue so it stays stable across visits, then skips colors already in the room.
export function colorFor(userId, taken = new Set()) {
    const start = hash(String(userId)) % PALETTE.length;
    for (let offset = 0; offset < PALETTE.length; offset += 1) {
        const color = PALETTE[(start + offset) % PALETTE.length];
        if (!taken.has(color)) return color;
    }
    return PALETTE[start];
}
