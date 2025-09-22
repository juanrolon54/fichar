import { html } from "hono/html"
import { FC } from "hono/jsx"
import { useRequestContext } from "hono/jsx-renderer"

export const Layout: FC = props => {
    const c = useRequestContext()
    return <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
             <title>Fichar - App de asistencias para profesores</title>
            <meta name="description" content="App de asistencias para profesores. Gestiona la asistencia de tus estudiantes de forma simple y eficaz." />
            <meta property="og:title" content="Fichar - App de asistencias para profesores" />
            <meta property="og:description" content="App de asistencias para profesores. Gestiona la asistencia de tus estudiantes de forma simple y eficaz." />
            <meta property="og:type" content="website" />
            <meta property="og:locale" content="es_AR" />
            <meta property="og:image" content={new URL('/og.png', c.env.DOMAIN).toString()} />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            {html`
                <style>
                    html {
                        scrollbar-width: none;
                    }
                </style>
            `}
            <script src="/static/twind.js"></script>
            {html`<script>
                twind.install({
                    hash: false,
                })
            </script>`}
        </head>
        <body>{props.children}</body>
        <script src="/static/noresubmit.js"></script>
    </html>
}

