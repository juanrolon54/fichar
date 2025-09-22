import { html } from "hono/html"
import { FC } from "hono/jsx"

export const Layout: FC = props => 
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <title>Fichar</title>
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

