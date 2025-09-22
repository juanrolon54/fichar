import { Context, Hono } from 'hono'
import { Env } from './app'
import { Layout } from './components/Layout'
import { Input } from './components/Input'
import { Button } from './components/Button'
import { A } from './components/A'
import { FC, PropsWithChildren } from 'hono/jsx'
import { registerValidator, teachers } from './db/schema'
import { hashPassword, verifyPassword } from './utils/crypto'
import { eq } from 'drizzle-orm'
import { clearJWTSession, setJWTSessionCookie } from './utils/cookie'
import { html } from 'hono/html'
import { UserCorner } from './components/UserCorner'

export const authRoutes = new Hono<Env>()

const Register: FC<PropsWithChildren<{name?: string; password?: string; passwordConfirm?: string; error?: 'validation' | 'userAlreadyExists' |'passwordsDoNotMatch' }>> = props => {
    return (
        <Layout>
            <UserCorner/>
            <section class="max-w-sm w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <form class="flex flex-col gap-2" method="post" autocomplete="off">
                    <h1 class="text-3xl font-bold mb-4">Registrar profesor</h1>
                    {props.error === 'userAlreadyExists' && (
                        <p class="text-red-500 font-medium">
                            ¡El nombre ya existe! Busca otro ó{' '}
                            <A class="!bg-transparent !hover:text-red-800 !text-red-500 !decoration-current !p-0" href={"/teacher/login?user_name="+encodeURIComponent(String(props?.name))}>
                                logueate.
                            </A>
                            {html`<script>
                                document.addEventListener('DOMContentLoaded', ()=>{
                                    document.querySelector('input[name=name]').focus()
                                })
                            </script>`}
                        </p>
                    )}
                    <Input maxlength="64" required placeholder="Nombre" name="name" value={props.name ?? ''} />
                    <Input minlength="10" maxlength="64" required type="password" placeholder="Contraseña" name="password" value={props.password ?? ''} />
                    {props.error === 'passwordsDoNotMatch' && (
                        <p class="text-red-500 font-medium mt-2">
                            ¡Las contraseñas no coinciden!
                            {html`<script>
                                document.addEventListener('DOMContentLoaded', ()=>{
                                    document.querySelector('input[name=passwordConfirm]').focus()
                                })
                            </script>`}
                        </p>
                    )}
                    <Input minlength="10" maxlength="64" required type="password" placeholder="Confirmar Contraseña" name="passwordConfirm" value={props.passwordConfirm ?? ''} />
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
                </div>
            </section>
            {props.children}
        </Layout>
    )
}

authRoutes.get('/teacher/register', c => {
    if (c.var.user) return c.redirect('/teacher', 303)
    return c.render(<Register />)
})

authRoutes.post('/teacher/register', async c => {
    const form = await c.req.formData()
    const name = (form.get('name') as string) ?? ''
    const password = (form.get('password') as string) ?? ''
    const passwordConfirm = (form.get('passwordConfirm') as string) ?? ''

    const validatedForm = registerValidator.safeParse({ name, password })

    if (!validatedForm.success) {
        c.status(400)
        return c.render(<Register name={name} password={password} passwordConfirm={passwordConfirm} error="validation" />)
    }

    const userAlreadyExists = await c.var.db.select().from(teachers).where(eq(teachers.name, name)).limit(1).get()

    if (userAlreadyExists) {
        c.status(400)
        return c.render(<Register name={name} password={password} passwordConfirm={passwordConfirm} error="userAlreadyExists" />)
    }

    const passwordsMatch = password === passwordConfirm

    if (!passwordsMatch) {
        c.status(400)
        return c.render(<Register name={name} password={password} passwordConfirm={''} error="passwordsDoNotMatch" />)
    }

    validatedForm.data.password = await hashPassword(validatedForm.data.password)
    const user = await c.var.db.insert(teachers).values(validatedForm.data).returning().get()

    // await setJWTSessionCookie(c, String(user.id), user.name)
    return c.redirect('/teacher/login?new_user=true&user_name='+encodeURIComponent(name), 303)
})

const Login: FC<PropsWithChildren<{ name?: string; password?: string; newUser?:boolean; error?: 'userDoesNotExist' | 'invalidPassword' }>> = props => {
    return (
        <Layout>
            <UserCorner/>
            <section class="max-w-sm w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <form class="flex flex-col gap-2" method="post">
                    <h1 class="text-3xl font-bold mb-4">Loguear profesor</h1>
                    {props.error === 'userDoesNotExist' && (
                        <p class="text-red-500 font-medium">
                            ¡El nombre no existe! Checkea el campo o{' '}
                            <A class="!bg-transparent !hover:text-red-800 !text-red-500 !decoration-current !p-0" href="/teacher/register">
                                registrate.
                            </A>
                            {html`<script>
                                document.addEventListener('DOMContentLoaded', ()=>{
                                    document.querySelector('input[name=name]').focus()
                                })
                            </script>`}
                        </p>
                    )}
                    {props.newUser && <p class="mb-4 font-medium text-slate-600">¡Usuario <span class="underline-offset-2 underline decoration-2">creado existosamente</span>! Ahora logueate.</p>}
                    <Input maxlength="64" required placeholder="Nombre" name="name" value={props.name ?? ''}/>

                    {props.error === 'invalidPassword' && (
                        <p class="text-red-500 font-medium mt-4">
                            La contraseña es incorrecta. Vuelva a intentarlo.
                            {html`<script>
                                document.addEventListener('DOMContentLoaded', ()=>{
                                    document.querySelector('input[name=password]').focus()
                                })
                            </script>`}
                        </p>
                    )}
                    <Input minlength="10" maxlength="64" required type="password" placeholder="Contraseña" name="password" value={props.password ?? ''} />
                    <Button class="mt-2 ml-auto" type="submit">
                        Ingresemos
                    </Button>
                </form>
                <div class="mt-16 flex justify-between flex-wrap">
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/">
                        Volver.
                    </A>
                    <A class="!bg-transparent !text-slate-600 !hover:text-black !p-0" href="/teacher/register">
                        ¿No tenes cuenta?
                    </A>
                </div>
            </section>
            {props.children}
        </Layout>
    )
}

authRoutes.get('/teacher/login', c => {
    const newUser = !!c.req.query('new_user')
    if (c.var.user) return c.redirect('/teacher', 303)
    if (newUser) {
        const name = c.req.query('user_name')
        return c.render(<Login  newUser={newUser} name={name} />)
    }
    return c.render(<Login />)
})

authRoutes.post('/teacher/login', async (c) => {
    const form = await c.req.formData()
    const name = form.get('name') as string ?? ''
    const password = form.get('password') as string ?? ''
    const newUser = !!c.req.query('new_user')

    const user = await c.var.db.select().from(teachers).where(eq(teachers.name, name)).get()

    if (!user) {
        c.status(400)
        return c.render(<Login  name={name} password={password} error='userDoesNotExist'/>)
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
        c.status(400)
        return c.render(<Login  name={name} password={password} error='invalidPassword'/>)
    }

    await setJWTSessionCookie(c, String(user.id), user.name)

    if (newUser) c.redirect('/teacher/courses/create', 303)
    return c.redirect('/teacher', 303)
})

authRoutes.get('/logout', c => {
    clearJWTSession(c)
    return c.redirect('/teacher/login', 303)
})
