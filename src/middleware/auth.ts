import { createMiddleware } from 'hono/factory'
import { clearJWTSession, getJWTPayload } from '../utils/cookie'
import { Env } from '../app'

/**
 * JWT Authentication middleware - makes user available globally
 */
export const jwtAuthMiddleware = createMiddleware<Env>(async (c, next) => {
    const payload = await getJWTPayload(c)

    if (payload) {
        // JWT is valid, set user info
        c.set('user', {
            id: payload.sub as string,
            name: payload.name as string,
        })
        c.set('isAuthenticated', true)
    } else {
        // Invalid or missing JWT
        c.set('isAuthenticated', false)

        // Clear invalid cookie if it exists
        const cookieHeader = c.req.header('Cookie')
        if (cookieHeader && cookieHeader.includes('session=')) {
            clearJWTSession(c)
        }
    }

    await next()
})

/**
 * Require authentication - redirect to login if not authenticated
 */
export const requireAuth = (redirectLocation: string | URL) => {
    return createMiddleware<Env>(async (c, next) => {
        if (!c.var.isAuthenticated) {
            return c.redirect(redirectLocation, 303)
        }
        await next()
    })
}

/**
 * Redirect authenticated users (for login/register pages)
 */
// export const redirectIfAuth = createMiddleware<Env>(async (c, next) => {
//     if (c.var.isAuthenticated) {
//         return c.redirect('/teacher/notes', 303)
//     }
//     await next()
// })
