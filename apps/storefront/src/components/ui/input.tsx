import * as React from "react"
import { cn } from "@/lib/utils"

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex min-h-12 w-full rounded-lg border border-divider bg-white px-4 py-3 text-base text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-subtle/80 hover:border-foreground/25 focus:border-foreground focus:ring-2 focus:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-error aria-invalid:ring-2 aria-invalid:ring-error/20 sm:text-[15px]",
        className,
      )}
      {...props}
    />
  )
}
