import { Hono } from 'hono'
import { Env } from './app'
import { Layout } from './components/Layout'
import { A } from './components/A'
import { UserCorner } from './components/UserCorner'
import { html } from 'hono/html'

export const landingRoutes = new Hono<Env>()

landingRoutes.get('/', c => {
    return c.render(
        <Layout>
            <UserCorner />
            <section class="max-w-md w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <img class="h-16 w-16 -ml-2 mb-4 mx-auto" src="/calendar.svg"/>
                <h1 class="text-4xl font-bold text-pretty">Fichar</h1>
                <p class="text-slate-800 mb-24 mt-4">App de asistencias para profesores. Gestiona la asistencia de tus estudiantes de forma simple y eficaz.</p>
                <div class="flex gap-4 ml-auto">
                    <A href="/course">
                        Soy estudiante
                    </A>
                    <A class="!bg-transparent border-2 !py-1.5 !border-slate-600 !text-slate-800 !hover:text-black" href="/teacher/register">
                        Soy profesor
                    </A>
                </div>
            </section>
        </Layout>
    )
})
