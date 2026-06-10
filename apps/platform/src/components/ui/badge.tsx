import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* ── DESIGN.md badge styles ────────────────────────────────────
   badge-status → bg-badge-success, text-on-dark, rounded-full, px-2.5 py-0.5
   badge-tag    → bg-canvas, text-ink, 1px hairline, rounded-full
*/
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-on-primary',
        secondary:
          'border-transparent bg-surface-bone text-ink',
        success:
          'border-transparent bg-badge-success text-on-dark',
        destructive:
          'border-transparent bg-destructive text-white',
        outline:
          'border-hairline bg-canvas text-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot='badge'
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
