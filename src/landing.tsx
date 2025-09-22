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
            <section class="max-w-4xl w-full mx-auto p-4 min-h-screen flex flex-col justify-center">
                <h1 class="text-4xl font-bold text-pretty">Fichar</h1>
                <p class="text-slate-800 mb-8">App de asistencias para profesores.</p>
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
