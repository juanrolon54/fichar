import { Hono } from 'hono'
import { authRoutes } from './auth'
import { landingRoutes } from './landing'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { dbMiddleware } from './middleware/db'
import { jwtAuthMiddleware } from './middleware/auth'
import { jsxRenderer } from 'hono/jsx-renderer'
import { studentRoutes } from './student'
import { teacherRoutes } from './teacher'

export type Env = {
    Bindings: {
        DB: D1Database
    }
    Variables: {
        db: DrizzleD1Database
        user?: { name: string; id: string }
        isAuthenticated: boolean
    }
}

const app = new Hono<Env>()
app.use(dbMiddleware)
app.use(jwtAuthMiddleware)
app.use(jsxRenderer())
app.route('/', landingRoutes)
app.route('/', authRoutes)
app.route('/', studentRoutes)
app.route('/', teacherRoutes)
app.get('/timezone/offset', c => {
    return c.text(new Date().getTimezoneOffset().toString())
})

export default app
