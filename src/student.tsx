import { Context, Hono } from 'hono'
import { Env } from './app'
import { Layout } from './components/Layout'
import { Input } from './components/Input'
import { Button } from './components/Button'
import { A } from './components/A'
import { FC, PropsWithChildren } from 'hono/jsx'
import { eq } from 'drizzle-orm'
import { clearJWTSession, DEFAULT_COOKIE_OPTIONS, setJWTSessionCookie } from './utils/cookie'
import { html } from 'hono/html'
import { UserCorner } from './components/UserCorner'
import { isValidCourseCode } from './utils/courseCode'
import { attendees, courses } from './db/schema'
import { getScheduleTupleStartTimestamp, isCourseCookieValid, withinSchedule } from './utils/courseSchedule'
import { getCookie, setCookie } from 'hono/cookie'

export const studentRoutes = new Hono<Env>()

const Course: FC<PropsWithChildren<{error?: 'courseNotFound' | 'invalidCourseCode'}>> = props => {
    return (
        <Layout>
            <section class="max-w-sm w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <form class="flex flex-col gap-2" method="post" autocomplete="off">
                    <h1 class="text-3xl font-bold">Ingresar a clase</h1>
                    <p class="text-slate-800 mb-8">Ingrese el código provisto por su profesor.</p>
                    {props.error === 'courseNotFound' && <p class="text-red-500">No se encontró el curso.</p>}
                        {props.error === 'invalidCourseCode' && <p class="text-red-500">El código es invalido.</p>}
                    <div class="flex gap-4">
                        <Input class="" minlength="11" maxlength="11" required placeholder="Código de clase" name="code" />
                        {html`<script>
                            const codeInput = document.querySelector('input[name=code]')

                            codeInput.addEventListener('input', e => {
                                let value = e.target.value.toUpperCase()
                                value = value.replace(/[^0-9A-Z]/g, '')
                                if (value.length > 3) {
                                    value = value.slice(0, 3) + '-' + value.slice(3)
                                }
                                if (value.length > 7) {
                                    value = value.slice(0, 7) + '-' + value.slice(7)
                                }
                                if (value.length > 11) {
                                    value = value.slice(0, 11)
                                }
                                if (value.length < 11) {
                                    e.target.setCustomValidity('Se require código completo.')
                                } else {
                                    e.target.setCustomValidity('')
                                }
                                e.target.value = value
                            })

                            codeInput.addEventListener('paste', e => {
                                setTimeout(() => {
                                    codeInput.dispatchEvent(new Event('input'))
                                }, 0)
                            })
                        </script>`}
                        <Button class="min-w-fit flex-1" type="submit">
                            Ir a la clase
                        </Button>
                    </div>
                </form>
                <div class="mt-16 flex justify-between flex-wrap">
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/">
                        Volver.
                    </A>
                    {/* <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/teacher/login">
                        ¿Ya tenes cuenta?
                    </A> */}
                </div>
            </section>
            {props.children}
        </Layout>
    )
}

studentRoutes.get('/course', c => {
    return c.render(<Course />)
})

studentRoutes.post('/course', async (c) => {
    const form = await c.req.formData()
    const courseCode = form.get('code') as string
    if (!courseCode || !isValidCourseCode(courseCode)) {
        return c.render(<Course error="invalidCourseCode" />)
    }
    
    const course = await c.var.db.select().from(courses).where(eq(courses.code, courseCode)).limit(1).get()
    
    if (!course) {
        return c.render(<Course error="courseNotFound" />)
    }


    return c.redirect(`/course/${courseCode}`, 303)
})

const CourseAttend: FC<PropsWithChildren<{
    course: typeof courses.$inferSelect, status?: 'yes' | 'alreadyAttended' | 'notWithinSchedule' | 'success', attendee?: typeof attendees.$inferSelect
}>> = props => {
    
    return (
        <Layout>
            <section class="max-w-sm w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                {props.status === undefined || props.status === 'yes' && 
                    <form class="flex flex-col gap-2" method="post" autocomplete="off">
                        <h1 class="text-3xl font-bold">Dar presente en<br/>"{props.course.name}".</h1>
                        {props.course.description && <p class="text-slate-600">{props.course.description}</p>}
                        <p class="text-slate-600 mb-2 mt-6">Complete el formulario.</p>
                        <Input class="" maxlength="32" required placeholder="Nombre" name="firstname" />
                        <Input class="" maxlength="32" required placeholder="Apellido" name="surname" />
                        <Input class="" maxlength="32" required placeholder="D.N.I" name="government_document_id" type="number" />
                        <div class="mt-8 flex justify-between flex-wrap items-end">
                            <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/course">
                                Volver.
                            </A>
                            <Button class="" type="submit">
                                Dar presente
                            </Button>
                        </div>
                    </form>
                }
                {(props.status === 'success' && props.attendee) && <div class="flex flex-col gap-2">
                    <h1 class="text-3xl font-bold">¡Muy bien {props.attendee.firstname}!</h1>
                    <p class="text-slate-600 mb-2">Diste el presente en "{props.course.name} exitosamente."</p>
                        <div class="mt-16 flex justify-between flex-wrap items-end">
                            <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/course">
                                Volver.
                            </A>
                        </div>
                </div>}
                {props.status === 'notWithinSchedule' && <div class="flex flex-col gap-2">
                    <h1 class="text-3xl font-bold">No podes dar presente en "{props.course.name}".</h1>
                    {props.course.description && <p class="text-slate-600 mb-2">{props.course.description}</p>}
                        <p class="text-slate-600 mb-8">No estas dentro del horario, volvé a intentarlo mas tarde.</p>
                        <div class="mt-16 flex justify-between flex-wrap items-end">
                            <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/course">
                                Volver.
                            </A>
                        </div>
                </div>}
                {props.status === 'alreadyAttended' && <div class="flex flex-col gap-2">
                    <h1 class="text-3xl font-bold">Ya diste el presente en "{props.course.name}".</h1>
                    {props.course.description && <p class="text-slate-600 mb-2">{props.course.description}</p>}
                        <p class="text-slate-600 mb-8">Tenes que esperar al proximo horario.</p>
                        <div class="mt-16 flex justify-between flex-wrap items-end">
                            <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/course">
                                Volver.
                            </A>
                        </div>
                    </div>}
            </section>
            {props.children}
        </Layout>
    )
}

studentRoutes.get('/course/:code',  async (c) => {
    const courseCode = c.req.param().code
    if (!courseCode || !isValidCourseCode(courseCode)) {
        return c.redirect('/course', 303)
    }
    
    const course = await c.var.db.select().from(courses).where(eq(courses.code, courseCode)).limit(1).get()
    if (!course) {
        return c.redirect('/course', 303)
    }
    const scheduleTuple = withinSchedule(course.schedule, course.start, course.end, new Date())

    const existingCookie = getCookie(c, `attendance_${courseCode}`)
    if (existingCookie && scheduleTuple && !isCourseCookieValid(existingCookie, courseCode, scheduleTuple)) {
        return c.render(<CourseAttend status='alreadyAttended' course={course}/>)
    }

    return c.render(<CourseAttend status={scheduleTuple === null ? 'notWithinSchedule' : 'yes'} course={course}/>)
})

studentRoutes.post('/course/:code', async (c) => {
    const courseCode = c.req.param().code
    
    if (!courseCode || !isValidCourseCode(courseCode)) {
        return c.redirect('/course', 303)
    }
    
    const course = await c.var.db.select().from(courses).where(eq(courses.code, courseCode)).limit(1).get()
    if (!course) {
        return c.redirect('/course', 303)
    }

    const form = await c.req.formData()
    const firstname = form.get('firstname') as string
    const surname = form.get('surname') as string
    const government_document_id = form.get('government_document_id') as string
    
    if (!firstname || !surname || !government_document_id) {
        return c.redirect('/course/'+courseCode, 303)
    }
    const scheduleTuple = withinSchedule(course.schedule, course.start, course.end)

    if (scheduleTuple === null) {
        return c.render(<CourseAttend status='notWithinSchedule' course={course} />)
    }

    const existingCookie = getCookie(c, `attendance_${courseCode}`)
    if (existingCookie && !isCourseCookieValid(existingCookie, courseCode, scheduleTuple)) {
        return c.render(<CourseAttend status='alreadyAttended' course={course}/>)
    }

    const flooredTimestampToStart = getScheduleTupleStartTimestamp(scheduleTuple)

    const newAttendee = await c.var.db.insert(attendees).values({
        course: course.id,
        firstname,
        government_document_id,
        surname,
        created: flooredTimestampToStart
    }).returning().get()

    const cookieKey = `attendance_${courseCode}`
    const cookieValue = `${courseCode}|${flooredTimestampToStart.toISOString()}`

    setCookie(c, cookieKey, cookieValue, {
        ...DEFAULT_COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: `/course/${courseCode}` 
    })

    return c.render(<CourseAttend status='success' attendee={newAttendee} course={course}/>)
})
