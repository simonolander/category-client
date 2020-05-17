export function randomString(length = 16) {
    if (length < 0) {
        return "";
    }
    const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ0123456789";
    const characters = Array.from(crypto.getRandomValues(new Uint8Array(length)).values())
        .map((value) => alphabet[value % alphabet.length]);
    return "".concat(...characters);
}

export async function digestMessage(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}
