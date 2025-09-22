import { Context, Hono } from 'hono'
import { Env } from './app'
import { Layout } from './components/Layout'
import { Input } from './components/Input'
import { Button } from './components/Button'
import { A } from './components/A'
import { FC, PropsWithChildren } from 'hono/jsx'
import { courses, registerValidator, teachers } from './db/schema'
import { hashPassword, verifyPassword } from './utils/crypto'
import { asc, desc, eq } from 'drizzle-orm'
import { clearJWTSession, setJWTSessionCookie } from './utils/cookie'
import { html } from 'hono/html'
import { UserCorner } from './components/UserCorner'
import { Textarea } from './components/Textarea'
import { requireAuth } from './middleware/auth'
import { generateCourseCode } from './utils/courseCode'

export const teacherRoutes = new Hono<Env>()

teacherRoutes.all('/teacher', c => {
    return c.redirect('/teacher/courses', 303)
})

const TeacherDash: FC<PropsWithChildren<{courses: typeof courses.$inferSelect[]}>> = props => {
    const courseCards = []
    for (let course of props.courses) {
        courseCards.push(<article class="p-4 border-2 border-slate-300 rounded-md">
            <h1 class="font-bold text-black">{course.name}</h1>
        </article>)
    }
    return (
        <Layout>
            <UserCorner />
            <section class="max-w-sm w-full py-20 mx-auto p-4 min-h-screen flex flex-col justify-center">
                <div class="flex items-end mb-8 justify-between">
                    <h1 class="text-3xl font-bold">Mis clases</h1>
                    <A class="!bg-transparent !text-slate-800 !hover:text-black !p-0" href="/teacher/courses/create">
                        Crear clase
                    </A>
                </div>
                <div class="flex flex-col gap-4">
                    {courseCards}
                </div>
                {/* <form class="flex flex-col gap-2" method="post" autocomplete="off">
                    <Input maxlength="64" required placeholder="Nombre" name="name" />
                    <Input minlength="10" maxlength="64" required type="password" placeholder="Contraseña" name="password"  />
                    <Input minlength="10" maxlength="64" required type="password" placeholder="Confirmar Contraseña" name="passwordConfirm" />
                    <Button class="mt-2 ml-auto" type="submit">
                        Arranquemos
                    </Button>
                </form>
                <div class="mt-16 flex justify-between flex-wrap">
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/">
                        Volver.
                    </A>
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/teacher/login">
                        ¿Ya tenes cuenta?
                    </A>
                </div> */}
            </section>
            {props.children}
        </Layout>
    )
}

teacherRoutes.get('/teacher/courses', requireAuth('/teacher/login'), async (c) => {
    const teacherCourses = await c.var.db.select().from(courses).where(eq(courses.teacher, parseInt(c.var.user!.id))).orderBy(desc(courses.created))
    return c.render(<TeacherDash courses={teacherCourses} />)
})

const CreateCourse: FC<PropsWithChildren> = props => {
    return (
        <Layout>
            <UserCorner />
            <section class="max-w-sm w-full py-20 mx-auto p-4 min-h-screen flex flex-col justify-center">
                <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0 mb-2" href="/teacher/courses">
                    Volver.
                </A>
                <h1 class="text-2xl font-bold mb-8">Crear clase</h1>

                <form class="flex flex-col gap-2" method="post" autocomplete="off">
                    <Input class="font-semibold" maxlength="64" required placeholder="Nombre de la clase" name="name" />
                    <Textarea class="resize-none text-slate-600" maxlength="128" placeholder="Descripción corta de la clase." rows="3" name="description" />

                    <p class="text-slate-800 font-medium leading-[2.5] my-8">
                        Los dias
                        <span class="inline-flex h-[1em] max-h-[1em] mx-2 z-20">
                            <select size={4} placeholder="dias" class="h-8 text-slate border-2 invalid:border-slate-800 z-20 rounded" rows="7" multiple required name="simple_schedule_days">
                                <option value="1" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Lunes
                                </option>
                                <option value="2" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Martes
                                </option>
                                <option value="3" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Miercoles
                                </option>
                                <option value="4" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Jueves
                                </option>
                                <option value="5" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Viernes
                                </option>
                                <option value="6" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Sabado
                                </option>
                                <option value="0" class="p-2 text-slate-600 font-medium rounded-sm checked:(bg-slate-800 text-white)">
                                    Domingo
                                </option>
                            </select>
                            {html`
                                <script>
                                    const selectInput = document.currentScript.parentElement.querySelector('select')
                                    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

                                    selectInput.addEventListener('mousedown', function (e) {
                                        if (!isTouchDevice) e.preventDefault()
                                        const option = e.target

                                        if (option.tagName === 'OPTION') {
                                            option.selected = !option.selected
                                        }
                                    })
                                </script>
                                <style>
                                    select[multiple]:active,
                                    select[multiple]:hover {
                                        vertical-align: top;
                                        min-height: 2em;
                                        height: max-content;
                                    }
                                </style>
                            `}
                        </span>{' '}
                        entre <br />
                        las
                        <span class="inline-flex h-[1em] max-h-[1em] mx-2">
                            <Input required class="h-8 text-slate border-2 invalid:border-slate-800" name="simple_schedule_hours_start" type="time" />
                        </span>
                        y las
                        <span class="inline-flex h-[1em] max-h-[1em] mx-2">
                            <Input required class="h-8 text-slate border-2 invalid:border-slate-800" name="simple_schedule_hours_end" type="time" />
                        </span>{' '}
                        hs.
                    </p>

                    <div class="grid grid-cols-2 gap-4">
                        <label class="flex flex-col">
                            <span class="font-medium text-slate-800">Inicio de la cursada</span>
                            <Input class="invalid:border-slate-800" name="start" required type="date" />
                        </label>
                        <label class="flex flex-col">
                            <span class="font-medium text-slate-800">Fin de la cursada</span>
                            <Input class="invalid:border-slate-800" name="end" required type="date" />
                        </label>
                    </div>
                    {html`
                        <script>
                            const startDateInput = document.querySelector('input[name=start]')
                            const endDateInput = document.querySelector('input[name=end]')

                            const today = new Date()
                            const todayString = today.toISOString().split('T')[0]

                            const oneYearFromNow = new Date()
                            oneYearFromNow.setFullYear(today.getFullYear() + 1)
                            const maxDateString = oneYearFromNow.toISOString().split('T')[0]

                            startDateInput.setAttribute('min', todayString)
                            startDateInput.setAttribute('max', maxDateString)
                            endDateInput.setAttribute('min', todayString)
                            endDateInput.setAttribute('max', maxDateString)
                        </script>
                    `}

                    <input type="hidden" name="timezone_offset" />
                    {html`
                        <script>
                            const hiddenTimezoneInput = document.querySelector('input[name=timezone_offset]')
                            hiddenTimezoneInput.value = new Date().getTimezoneOffset()
                        </script>
                    `}

                    <Button class="mt-8 !p-5 ml-auto" type="submit">
                        Crear clase
                    </Button>
                </form>
                <div class="mt-16 flex justify-between flex-wrap"></div>
            </section>
        </Layout>
    )
}

teacherRoutes.get('/teacher/courses/create', requireAuth('/teacher/login'), c => {
    return c.render(<CreateCourse />)
})

// {
//     name: 'Clase de juan',
//     description: 'la clase dada por el teacher juan.',
//     simpleScheduleDays: [ '1', '4', '0' ],
//     simpleScheduleHoursStart: '16:00',
//     simpleScheduleHoursEnd: '20:00',
//     start: '2025-09-22',
//     end: '2025-11-14',
//     timezoneOffset: '180'
// }
teacherRoutes.post('/teacher/courses/create', requireAuth('/teacher/login'), async c => {
    const form = await c.req.formData()
    const name = form.get('name') as string
    const description = form.get('description') as string | null

    const simpleScheduleDays = form.getAll('simple_schedule_days') as string[]
    const simpleScheduleHoursStart = form.get('simple_schedule_hours_start') as string
    const simpleScheduleHoursEnd = form.get('simple_schedule_hours_end') as string

    const start = form.get('start') as string
    const end = form.get('end') as string
    const timezoneOffset = parseInt(form.get('timezone_offset') as string)

    // Validation
    if (!name || !start || !end || !simpleScheduleHoursStart || !simpleScheduleHoursEnd || !simpleScheduleDays.length) {
        return c.render(<CreateCourse />)
    }

    // Get teacher ID from auth context (assuming it's stored in c.var.user)
    const teacherId = parseInt(c.var.user!.id) // Adjust this based on how you store the authenticated teacher
    if (!teacherId && teacherId !== 0) return c.redirect('/teacher/login', 303)

    // console.log({
    //     name,
    //     description,
    //     simpleScheduleDays,
    //     simpleScheduleHoursStart,
    //     simpleScheduleHoursEnd,
    //     start,
    //     end,
    //     timezoneOffset,
    // })

    // Generate unique course code
    const code = await generateCourseCode(async code => {
        const existingCourseWithThatCode = await c.var.db.select({ code: courses.code }).from(courses).where(eq(courses.code, code)).limit(1)
        return existingCourseWithThatCode.length > 0
    })

    const schedule: { [key: string]: [string, string] } = {}

    // Convert time strings to UTC and handle day wrapping
    const convertTimeToUTCWithDayWrap = (timeString: string, offsetMinutes: number, originalDay: string): { utcTime: string; actualDay: string } => {
        const [hours, minutes] = timeString.split(':').map(Number)
        const date = new Date()
        date.setHours(hours, minutes, 0, 0)

        // Subtract timezone offset to get UTC
        date.setMinutes(date.getMinutes() - offsetMinutes)

        // Calculate how many days we shifted
        const dayShift = Math.floor((hours * 60 + minutes - offsetMinutes) / (24 * 60))

        // Calculate the actual UTC day
        let actualDayNum = parseInt(originalDay) + dayShift

        // Handle week wrapping (0=Sunday, 6=Saturday)
        if (actualDayNum < 0) {
            actualDayNum += 7
        } else if (actualDayNum > 6) {
            actualDayNum -= 7
        }

        return {
            utcTime: date.toTimeString().slice(0, 5),
            actualDay: actualDayNum.toString(),
        }
    }

    // Process each selected day
    simpleScheduleDays.forEach(day => {
        const startResult = convertTimeToUTCWithDayWrap(simpleScheduleHoursStart, timezoneOffset, day)
        const endResult = convertTimeToUTCWithDayWrap(simpleScheduleHoursEnd, timezoneOffset, day)

        // Both start and end should map to the same day after conversion
        // If they don't, we have a schedule that spans midnight
        if (startResult.actualDay === endResult.actualDay) {
            // Simple case: schedule doesn't cross midnight
            schedule[startResult.actualDay] = [startResult.utcTime, endResult.utcTime]
        } else {
            // Complex case: schedule crosses midnight
            // Split into two entries: one ending at 23:59, one starting at 00:00
            schedule[startResult.actualDay] = [startResult.utcTime, '23:59']
            schedule[endResult.actualDay] = ['00:00', endResult.utcTime]
        }
    })

    // Convert date strings to UTC timestamps
    // Browser gives us local time, so we subtract the timezone offset to get UTC
    const startDate = new Date(start + 'T00:00:00')
    startDate.setMinutes(startDate.getMinutes() - timezoneOffset)

    const endDate = new Date(end + 'T23:59:59')
    endDate.setMinutes(endDate.getMinutes() - timezoneOffset)

    // Insert the course into the database
    const newCourse = await c.var.db
        .insert(courses)
        .values({
            code,
            name,
            description: description || null,
            schedule: schedule,
            start: startDate,
            end: endDate,
            teacher: teacherId,
        })
        .get()

    return c.redirect('/teacher/courses', 303)
})
