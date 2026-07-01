import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ElementType
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-slate-50 focus:bg-white px-5 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-slate-300 focus:ring-4 focus:ring-slate-100 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
            Icon ? "pl-12" : "",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
