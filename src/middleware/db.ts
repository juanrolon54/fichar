import { createMiddleware } from 'hono/factory'
import { Env } from '../app'
import { drizzle } from 'drizzle-orm/d1'

export const dbMiddleware = createMiddleware<Env>(async (c, next) => {
    const db = drizzle(c.env.DB)

    c.set('db', db)

    await next()
})
