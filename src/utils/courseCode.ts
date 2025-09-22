/**
 * Generate a unique 9-character base36 class code in format XXX-XXX-XXX
 * @param collisionChecker - Async function that returns true if code already exists
 * @returns Promise<string> - Unique formatted class code like "A7B-K2M-9X4"
 */
export async function generateCourseCode(collisionChecker: (code: string) => Promise<boolean>): Promise<string> {
    const maxAttempts = 20

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate 9 cryptographically secure base36 characters
        const array = new Uint8Array(9)
        crypto.getRandomValues(array)

        let code = ''
        for (let i = 0; i < 9; i++) {
            const randomValue = array[i] % 36
            code += randomValue.toString(36).toUpperCase()
        }

        // Format as XXX-XXX-XXX
        const formatted = `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`

        // Check if code already exists
        const exists = await collisionChecker(formatted)

        if (!exists) {
            return formatted
        }
    }

    throw new Error('Failed to generate unique class code after 20 attempts')
}

/**
 * Validates a course code format and characters
 * @param code - The course code to validate
 * @returns boolean - True if valid, false otherwise
 */
export function isValidCourseCode(code: string): boolean {
    if (typeof code !== 'string' || !code) {
        return false
    }

    if (code.length !== 11) {
        return false
    }

    if (code[3] !== '-' || code[7] !== '-') {
        return false
    }

    for (const segment of code.split('-')) {
        if (segment.length !== 3) return false
        if (!/^[0-9A-Z]{3}$/.test(segment)) return false
    }

    return true
}
