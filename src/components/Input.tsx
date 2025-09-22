import { FC } from 'hono/jsx'

export const Input: FC = props => 
    <input {...props} class={'min-w-0 placeholder:text-slate-800 font-medium block rounded border-2 placeholder-shown:border-slate-800 py-2 px-3 border-slate-200 focus:transition-all focus:outline-offset-4 '+(props?.['class']||'')}/>
