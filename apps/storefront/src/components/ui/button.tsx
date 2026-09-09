import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background shadow-sm hover:bg-graphite hover:shadow-md",
        ember: "bg-ember-action text-white shadow-sm hover:bg-ember-ink hover:shadow-[0_8px_20px_rgba(217,45,32,0.22)]",
        outline: "border border-divider bg-white text-foreground shadow-sm hover:border-foreground/20 hover:bg-surface-subtle",
        ghost: "bg-transparent text-foreground hover:bg-muted active:bg-surface-strong",
      },
      size: {
        default: "h-12",
        sm: "h-11 min-h-11 px-4",
        lg: "h-13 min-h-13 px-7",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
