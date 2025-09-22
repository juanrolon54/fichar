import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import z from 'zod'

export const teachers = sqliteTable('teachers', {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull().unique(),
    password: text().notNull(),
    created: int({ mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
})

export const registerValidator = z.object({
    name: z.string().nonempty().max(64),
    password: z.string().nonempty().min(10).max(64),
})

export const loginValidator = z.object({
    name: z.string().nonempty().max(64),
    password: z.string().nonempty().min(10).max(64),
})

export const courses = sqliteTable('courses', {
    id: int().primaryKey({ autoIncrement: true }),
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    schedule: text({ mode: 'json' }).notNull().$type<{ [key: string]: [string, string] }>(),
    start: int({ mode: 'timestamp' }).notNull(),
    end: int({ mode: 'timestamp' }).notNull(),
    created: int({ mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch())`),
    teacher: int()
        .notNull()
        .references(() => teachers.id, { onDelete: 'cascade' }),
})

export const attendees = sqliteTable('attendees', {
    id: int().primaryKey({ autoIncrement: true }),
    firstname: text().notNull(),
    surname: text().notNull(),
    government_document_id: text().notNull(),
    course: int()
        .notNull()
        .references(() => courses.id, { onDelete: 'cascade' }),
})
