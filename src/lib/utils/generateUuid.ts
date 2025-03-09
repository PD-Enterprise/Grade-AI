export async function generateUuid(input: string): Promise<string> {
    // Create a SHA-256 hash of the input string
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert the hash buffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Format the hex string as a UUID
    return (
        hashHex.substring(0, 8) +
        '-' +
        hashHex.substring(8, 12) +
        '-' +
        '4' +
        hashHex.substring(13, 16) +
        '-' + // UUID version 4
        hashHex.substring(16, 20) +
        '-' +
        hashHex.substring(20, 32)
    );
}