import { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

export interface CookieOptions {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
    maxAge?: number // in seconds
    path?: string
    domain?: string
}

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
}

/**
 * JWT Session management utilities
 */
export const SESSION_COOKIE_NAME = 'session'

/**
 * Create and set JWT session cookie
 */
export async function setJWTSessionCookie(
    c: Context,
    userId: string,
    userName: string
): Promise<void> {
    const secret = c.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required')
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
        sub: userId,
        name: userName,
        iat: now,
        exp: now + 60 * 60 * 24 * 30, // 30 days
    }

    const token = await sign(payload, secret)

    setCookie(c, SESSION_COOKIE_NAME, token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
    })
}

/**
 * Get and verify JWT from session cookie
 */
export async function getJWTPayload(c: Context) {
    const token = getCookie(c, SESSION_COOKIE_NAME)
    if (!token) return null

    const secret = c.env.JWT_SECRET
    if (!secret) {
        console.error('JWT_SECRET environment variable is required')
        return null
    }

    try {
        const payload = await verify(token, secret)

        // Check if token is expired (extra safety)
        if (payload.exp! < Math.floor(Date.now() / 1000)) {
            return null
        }

        return payload
    } catch (error) {
        console.error('JWT verification failed:', error)
        return null
    }
}

/**
 * Clear JWT session
 */
export function clearJWTSession(c: Context): void {
    deleteCookie(c, SESSION_COOKIE_NAME)
}
