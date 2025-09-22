// Password hashing utilities for Cloudflare Workers
// Uses Web Crypto API (built-in, fast, secure)

const SALT_ROUNDS = 4 // Adjust based on your security needs vs performance

/**
 * Hash a password using PBKDF2 with Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16))

    // Convert password to bytes
    const encoder = new TextEncoder()
    const passwordBytes = encoder.encode(password)

    // Import password as cryptographic key
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits']
    )

    // Derive key using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: Math.pow(2, SALT_ROUNDS), // 2^12 = 4096 iterations
            hash: 'SHA-256',
        },
        keyMaterial,
        256 // 32 bytes
    )

    // Combine salt + hash for storage
    const hashBytes = new Uint8Array(derivedBits)
    const combined = new Uint8Array(salt.length + hashBytes.length)
    combined.set(salt, 0)
    combined.set(hashBytes, salt.length)

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    storedHash: string
): Promise<boolean> {
    try {
        // Decode the stored hash
        const combined = new Uint8Array(
            atob(storedHash)
                .split('')
                .map(char => char.charCodeAt(0))
        )

        // Extract salt (first 16 bytes) and hash (remaining bytes)
        const salt = combined.slice(0, 16)
        const originalHash = combined.slice(16)

        // Hash the provided password with the same salt
        const encoder = new TextEncoder()
        const passwordBytes = encoder.encode(password)

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBytes,
            'PBKDF2',
            false,
            ['deriveBits']
        )

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: Math.pow(2, SALT_ROUNDS),
                hash: 'SHA-256',
            },
            keyMaterial,
            256
        )

        const newHash = new Uint8Array(derivedBits)

        // Compare hashes using constant-time comparison
        return constantTimeEqual(originalHash, newHash)
    } catch (error) {
        console.error('Password verification error:', error)
        return false
    }
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i]
    }

    return result === 0
}
