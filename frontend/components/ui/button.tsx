import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger"
  size?: "default" | "sm" | "lg"
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading, children, disabled, ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/20",
      outline: "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-800",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20"
    }

    const sizes = {
      default: "h-12 px-6 py-2",
      sm: "h-9 px-4 text-xs",
      lg: "h-14 px-8 text-lg"
    }

    return (
      <button
        ref={ref}
        disabled={loading || disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-[1.2rem] font-bold transition-all disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
