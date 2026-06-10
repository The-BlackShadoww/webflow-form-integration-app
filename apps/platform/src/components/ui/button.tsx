import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* ── DESIGN.md button variants ────────────────────────────────
   button-primary  → bg-primary, text-on-primary, rounded-full, h-11
   button-dark     → bg-surface-dark, text-on-dark, rounded-full
   button-outline  → bg-surface-card, border hairline-strong, rounded-full
   button-ghost    → bg-canvas, no border, rounded-full
*/
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring-focus cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-on-primary hover:bg-primary-deep active:bg-primary-deep',
        dark:
          'bg-surface-dark text-on-dark hover:bg-surface-deep',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90',
        outline:
          'border border-hairline-strong bg-surface-card text-ink hover:bg-surface-bone',
        secondary:
          'bg-surface-bone text-ink hover:bg-hairline',
        ghost:
          'bg-transparent text-ink hover:bg-surface-bone',
        link: 'text-link underline-offset-4 hover:underline rounded-none',
      },
      size: {
        default: 'h-11 px-6 py-2 text-base has-[>svg]:px-5',
        sm: 'h-9 gap-1.5 px-4 has-[>svg]:px-3 text-sm',
        lg: 'h-12 px-8 has-[>svg]:px-6 text-base',
        icon: 'size-9 rounded-full border border-hairline bg-surface-card text-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
