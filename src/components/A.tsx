import { FC } from 'hono/jsx'

export const A: FC = props => 
    <a 
    {...props} 
    class={'text-slate-300 bg-slate-800 rounded py-2 px-3 font-medium hover:text-white hover:bg-black decoration-2 decoration-transparent underline underline-offset-2 hover:decoration-current focus:transition-all focus:outline-offset-4 ' + (props?.['class']||'')}>
        {props.children}
    </a>
