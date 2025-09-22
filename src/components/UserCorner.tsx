import { FC } from 'hono/jsx'
import { A } from './A'
import { useRequestContext } from 'hono/jsx-renderer'

export const UserCorner: FC = props => {
    const c = useRequestContext()
    return (
        <div class="absolute top-4 right-4 flex flex-col z-10">
            {c.var.isAuthenticated && (
                <div class="flex items-center gap-4">
                    <h2 class="font-bold">
                        Prof.: <a class="underline decoration-2 underline-offset-2" href='/teacher'>{c.var.user?.name}</a>
                    </h2>
                    <A class="!bg-transparent !text-red-500 !decoration-current !hover:text-red-800 !p-0" href="/logout">
                        Salir
                    </A>
                </div>
            )}
            {props.children}
        </div>
    )
}
