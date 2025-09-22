import { Context, Hono } from 'hono'
import { Env } from './app'
import { Layout } from './components/Layout'
import { Input } from './components/Input'
import { Button } from './components/Button'
import { A } from './components/A'
import { FC, PropsWithChildren } from 'hono/jsx'
import { eq } from 'drizzle-orm'
import { clearJWTSession, setJWTSessionCookie } from './utils/cookie'
import { html } from 'hono/html'
import { UserCorner } from './components/UserCorner'
import { isValidCourseCode } from './utils/courseCode'
import { courses } from './db/schema'

export const studentRoutes = new Hono<Env>()

const Course: FC<PropsWithChildren> = props => {
    return (
        <Layout>
            <section class="max-w-sm w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <form class="flex flex-col gap-2" method="post" autocomplete="off">
                    <h1 class="text-3xl font-bold">Ingresar a clase</h1>
                    <p class="text-slate-800 mb-8">Ingrese el código provisto por su profesor.</p>
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

    if (!courseCode || isValidCourseCode(courseCode)) {
        return c.render(<Course />)
    }

    const course = await c.var.db.select().from(courses).where(eq(courses.code, courseCode)).limit(1).get()
    
    if (!course) {
        return c.render(<Course />)
    }

    return c.redirect(`/course/${courseCode}`, 303)
})

const CourseAttend: FC<PropsWithChildren> = props => {
    return (
        <Layout>
            <section class="max-w-sm w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <form class="flex flex-col gap-2" method="post" autocomplete="off">
                    <h1 class="text-3xl font-bold">Ingresar a clase</h1>
                    <p class="text-slate-800 mb-8">Ingrese el código provisto por su profesor.</p>
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

studentRoutes.get('/course/:code', (c) => {
    return c.render(<CourseAttend/>)
})
