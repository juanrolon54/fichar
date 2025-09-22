import { Context, Hono } from 'hono'
import { Env } from './app'
import { Layout } from './components/Layout'
import { Input } from './components/Input'
import { Button } from './components/Button'
import { A } from './components/A'
import { FC, PropsWithChildren } from 'hono/jsx'
import { attendees, courses, registerValidator, teachers } from './db/schema'
import { hashPassword, verifyPassword } from './utils/crypto'
import { and, asc, desc, eq } from 'drizzle-orm'
import { clearJWTSession, setJWTSessionCookie } from './utils/cookie'
import { html, raw } from 'hono/html'
import { UserCorner } from './components/UserCorner'
import { Textarea } from './components/Textarea'
import { requireAuth } from './middleware/auth'
import { generateCourseCode, isValidCourseCode } from './utils/courseCode'
import { convertTimeToUTCWithMinutes, type Schedule } from './utils/courseSchedule'
import { useRequestContext } from 'hono/jsx-renderer'

export const teacherRoutes = new Hono<Env>()

teacherRoutes.all('/teacher', c => {
    return c.redirect('/teacher/courses', 303)
})

const TeacherDash: FC<PropsWithChildren<{courses: typeof courses.$inferSelect[]}>> = props => {
    const courseCards = []
    for (let course of props.courses) {
        courseCards.push(
            <article class="p-4 pt-3 border-2 border-slate-600 rounded-md">
                <h1 class="font-bold text-lg text-black mb-2">{course.name}</h1>
                <h2 class="font-extrabold text-slate-400 text-sm">Código de clase:<br/><span class="select-all decoration-2 underline underline-offset-2">{course.code}</span></h2>
                <div class="flex flex-col items-end">    
                    <A class="!bg-transparent !text-red-600 !hover:text-black !p-0" href={"/teacher/courses/"+ course.code +"/delete"}>
                        Borrar
                    </A>
                    <A class="!bg-transparent !text-slate-800 !hover:text-black !p-0" href={"/teacher/courses/"+ course.code +"/share"}>
                        Compartir
                    </A>
                    <A class="!bg-transparent !text-slate-800 !hover:text-black !p-0" href={"/teacher/courses/"+ course.code +"/attendance"}>
                        Resultados
                    </A>
                </div>
            </article>
        )
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
                                        if (!isTouchDevice) {
                                            e.preventDefault()
                                        }
                                        
                                        const option = e.target

                                        if (option.tagName === 'OPTION') {
                                            option.selected = !option.selected

                                            if (!isTouchDevice) {
                                                updateExpectedCourseCount()
                                            }   
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

                    <span>Clases: <span id="expected-course-count">--</span></span>
                    {html`
                        <script>
                            const courseCount = document.querySelector('#expected-course-count')

                            selectInput.addEventListener('input', updateExpectedCourseCount)
                            startDateInput.addEventListener('input', updateExpectedCourseCount)
                            endDateInput.addEventListener('input', updateExpectedCourseCount)
                            
                            function updateExpectedCourseCount() {
                                const selectedDays = Array.from(document.querySelectorAll('select[name="simple_schedule_days"] option:checked'))
                                .map(option => parseInt(option.value))

                                if (!startDateInput.value || !endDateInput.value) {
                                    courseCount.textContent = '--'
                                    return
                                }

                                const start = new Date(startDateInput.value)
                                const end = new Date(endDateInput.value)

                                let totalCourses = 0
                                for (const day of selectedDays) {
                                    const current = new Date(start)

                                    // Find first date
                                    while (current.getDay() !== day && current <= end) {
                                        current.setDate(current.getDate() + 1)
                                    }

                                    // Count occurrences of this day within the range
                                    while (current <= end) {
                                        totalCourses++
                                        current.setDate(current.getDate() + 7) // Next week
                                    }
                                }
                                
                                courseCount.textContent = totalCourses
                            }
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

    const schedule: Schedule = []

    // Convert time strings to UTC and handle day wrapping

    // Process each selected day
    // Process each selected day
    simpleScheduleDays.forEach(day => {
        const startMinutes = convertTimeToUTCWithMinutes(simpleScheduleHoursStart, timezoneOffset, day)
        const endMinutes = convertTimeToUTCWithMinutes(simpleScheduleHoursEnd, timezoneOffset, day)
        
        // Calculate duration (handle potential week wrapping)
        let duration = endMinutes - startMinutes
        if (duration < 0) {
            duration += 7 * 24 * 60 // Add a full week if we wrapped around
        }
        
        schedule.push([startMinutes, duration])
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

const ConfirmDelete: FC<PropsWithChildren<{course: typeof courses.$inferSelect}>> = props => {
    return (
        <Layout>
            <UserCorner />
            <section class="max-w-sm w-full py-20 mx-auto p-4 min-h-screen flex flex-col justify-center">
                <div class="flex items-end mb-8 justify-between">
                    
                </div>
                <h1 class="font-bold text-lg text-pretty mb-2">¿Seguro que quieres borrar "{props.course.name}"?</h1>
                <p class="text-slate-600">Esto no se puede deshacer.</p>
                
                <div class="mt-16 flex justify-between flex-wrap">
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/teacher/courses">
                        Volver.
                    </A>
                    <form class="flex flex-col gap-2" method="post" autocomplete="off">
                        <Button id="delete-button" disabled class="!bg-transparent disabled:!opacity-50 !text-red-600 !hover:text-black !p-0" type="submit">
                            Borrar
                        </Button>
                        {html`
                            <script defer>
                                    setTimeout(() => {
                                        const deleteButton = document.querySelector('#delete-button')
                                        deleteButton.disabled = false
                                    }, 1000)
                                
                            </script>
                        `}
                    </form>
                </div>
            </section>
        </Layout>
    )
}

teacherRoutes.get('/teacher/courses/:code/delete', requireAuth('/teacher/login'), async c => {
    const code = c.req.param().code

    if (!isValidCourseCode(code)) {
        return c.redirect('/teacher/courses', 303)
    }

    const existingCourse = await c.var.db.select().from(courses).where(
        and(
            eq(courses.code, code),
            eq(courses.teacher, parseInt(c.var.user!.id)),
        ))
        .get()
    
    if (!existingCourse) {
        return c.redirect('/teacher/courses', 303)
    }

    return c.render(<ConfirmDelete course={existingCourse}/>)
})

teacherRoutes.post('/teacher/courses/:code/delete', requireAuth('/teacher/login'), async c => {
    const code = c.req.param().code

    if (!isValidCourseCode(code)) {
        return c.redirect('/teacher/courses', 303)
    }

    const existingCourse = await c.var.db.select().from(courses).where(
        and(
            eq(courses.code, code),
            eq(courses.teacher, parseInt(c.var.user!.id)),
        ))
        .get()
    
    if (!existingCourse) {
        return c.redirect('/teacher/courses', 303)
    }

    await c.var.db.delete(courses).where( and(
            eq(courses.code, code),
            eq(courses.teacher, parseInt(c.var.user!.id)),
        ))

    return c.redirect('/teacher/courses', 303)
})

const ShareCourse: FC<PropsWithChildren<{ course: typeof courses.$inferSelect }>> = props => {
    const c = useRequestContext()
    return (
        <Layout>
            <UserCorner />
            <section class="max-w-sm w-full py-20 mx-auto p-4 min-h-screen flex flex-col justify-center">
                <div class="flex items-end mb-8 justify-between">
                    
                </div>
                <h1 class="font-bold text-xl text-pretty mb-2">Compartir "{props.course.name}"</h1>
                <p class="text-slate-600">Compartí el código de la clase con tus alumnos.</p>

                <span class="mb-4 mt-8 p-4 text-center rounded border-2 border-slate-600 text-2xl font-bold select-all">
                        {props.course.code}
                </span>
                
                <div class="flex justify-between flex-wrap">
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/teacher/courses">
                        Volver.
                    </A>

                    <Button id="share-code" value={props.course.code} class="!bg-transparent !text-slate-800 !hover:text-black !p-0">
                        Copiar código
                    </Button>
                    {html`
                    <script>
                        async function shareOrCopy({ text, url }) {
                        try {
                            if (navigator.share) {
                                await navigator.share({
                                    title: 'Compartir curso',
                                    url
                                });
                            } else {
                                const toCopy = url || text;
                                await navigator.clipboard.writeText(toCopy);
                                alert('Se copió el codigo al portapapeles.');
                            }
                        } catch (err) {
                            console.error('Share failed:', err);
                            const toCopy = url || text;
                            await navigator.clipboard.writeText(toCopy);
                        }
                        }

                        const shareButton = document.getElementById('share-code')
                        shareButton.addEventListener('click', () => {
                            shareOrCopy({
                                text: "${raw(props.course.code)}",
                                url: "${raw(new URL('/course/'+props.course.code, c.env.DOMAIN).toString())}"
                            });
                        });
                    </script>
                    `}
                </div>
            </section>
        </Layout>
    )
}

teacherRoutes.get('/teacher/courses/:code/share', requireAuth('/teacher/login'), async c => {
     const code = c.req.param().code

    if (!isValidCourseCode(code)) {
        return c.redirect('/teacher/courses', 303)
    }

    const existingCourse = await c.var.db.select().from(courses).where(
        and(
            eq(courses.code, code),
            eq(courses.teacher, parseInt(c.var.user!.id)),
        ))
        .get()
    
    if (!existingCourse) {
        return c.redirect('/teacher/courses', 303)
    }
    return c.render(<ShareCourse course={existingCourse} />)
})


type AttendanceData = {
    government_document_id: string
    firstname: string
    surname: string
    attendanceDates: Date[]
}

const CourseAttendance: FC<{
    course: typeof courses.$inferSelect
    attendanceData: AttendanceData[]
    scheduleDates: Date[]
}> = ({ course, attendanceData, scheduleDates }) => {
    return (
        <Layout>
            <UserCorner />
            <section class="max-w-6xl w-full py-20 mx-auto p-4 min-h-screen">
                <h1 class="font-bold text-2xl text-pretty mb-2">Resultados "{course.name}"</h1>
                <div class="flex items-end mb-8 justify-between">
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/teacher/courses">
                        Volver
                    </A>
                 
                </div>

                {attendanceData.length === 0 ? (
                    <div class="text-center py-16">
                        <p class="text-slate-500">No hay estudiantes inscriptos todavía.</p>
                    </div>
                ) : (
                    <div class="overflow-x-visible">
                        <table class="border-collapse text-left" style="width: max-content;">
                            {/* Header row with dates */}
                            <thead>
                                <tr>
                                    <th class="bg-slate-50 p-2 font-bold text-sm">
                                        Estudiante
                                    </th>
                                    {scheduleDates.map(date => (
                                        <th class="bg-slate-50 p-2 pb-1 pt-4 font-medium text-xs relative">
                                            <div class="transform whitespace-nowrap" style="writing-mode: vertical-lr; text-orientation: mixed;">
                                                {date.toLocaleDateString('es-AR', { 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.map(student => (
                                    <tr>
                                        <td class="border-y-2 border-slate-400 p-2 font-medium text-sm bg-white">
                                            <div class="flex flex-col">
                                                <span>{student.firstname} {student.surname}</span>
                                                <span class="text-xs text-slate-500">{student.government_document_id}</span>
                                            </div>
                                        </td>
                                        {scheduleDates.map(scheduleDate => {
                                            const attended = student.attendanceDates.some(attendanceDate => 
                                                attendanceDate.toDateString() === scheduleDate.toDateString()
                                            )
                                            return (
                                                <td class={attended ? "border-y-2 border-slate-400 text-center text-white uppercase text-xs font-bold bg-slate-800": "border-y-2 border-slate-400 text-center bg-white"}>
                                                    {attended ? "Si" :""}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </Layout>
    )
}

// Helper function to generate all schedule dates within course period
function generateScheduleDates(course: typeof courses.$inferSelect): Date[] {
    const schedule: Schedule = course.schedule
    const startDate = new Date(course.start)
    const endDate = new Date(course.end)
    const scheduleDates: Date[] = []
    
    // For each schedule tuple, generate all dates in the course period
    schedule.forEach(([startMinutes, duration]) => {
        let currentWeek = new Date(startDate)
        
        // Go to start of week (Sunday)
        currentWeek.setUTCDate(currentWeek.getUTCDate() - currentWeek.getUTCDay())
        currentWeek.setUTCHours(0, 0, 0, 0)
        
        // Find first occurrence of this schedule slot
        const firstSlot = new Date(currentWeek.getTime() + (startMinutes * 60 * 1000))
        
        // Adjust to first occurrence within course period
        while (firstSlot < startDate) {
            firstSlot.setUTCDate(firstSlot.getUTCDate() + 7)
        }
        
        // Generate all occurrences until end date
        const currentSlot = new Date(firstSlot)
        while (currentSlot <= endDate) {
            scheduleDates.push(new Date(currentSlot))
            currentSlot.setUTCDate(currentSlot.getUTCDate() + 7)
        }
    })
    
    // Sort dates chronologically
    return scheduleDates.sort((a, b) => a.getTime() - b.getTime())
}

teacherRoutes.get('/teacher/courses/:code/attendance', requireAuth('/teacher/login'), async c => {
    const code = c.req.param().code

    if (!isValidCourseCode(code)) {
        return c.redirect('/teacher/courses', 303)
    }

    const existingCourse = await c.var.db.select().from(courses).where(
        and(
            eq(courses.code, code),
            eq(courses.teacher, parseInt(c.var.user!.id)),
        ))
        .get()
    
    if (!existingCourse) {
        return c.redirect('/teacher/courses', 303)
    }

    // Get all attendees for this course
    const allAttendees = await c.var.db.select().from(attendees)
        .where(eq(attendees.course, existingCourse.id))
    
    // Generate all scheduled dates for this course
    const scheduleDates = generateScheduleDates(existingCourse)
    
    // Group attendees by government_document_id and collect their attendance dates
    const attendanceMap = new Map<string, AttendanceData>()
    
    allAttendees.forEach(attendee => {
        const key = attendee.government_document_id
        
        if (!attendanceMap.has(key)) {
            attendanceMap.set(key, {
                government_document_id: attendee.government_document_id,
                firstname: attendee.firstname,
                surname: attendee.surname,
                attendanceDates: []
            })
        }
        
        attendanceMap.get(key)!.attendanceDates.push(new Date(attendee.created))
    })
    
    // Convert map to array and sort by name
    const attendanceData = Array.from(attendanceMap.values()).sort((a, b) => 
        a.surname.localeCompare(b.surname) || a.firstname.localeCompare(b.firstname)
    )

    return c.render(<CourseAttendance 
        course={existingCourse} 
        attendanceData={attendanceData}
        scheduleDates={scheduleDates}
    />)
})