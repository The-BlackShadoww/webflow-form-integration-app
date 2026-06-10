import * as React from 'react'
import { cn } from '@/lib/utils'

/* ── DESIGN.md text-input ──────────────────────────────────────
   bg-surface-card, text-ink, 1px hairline, rounded-full, h-11 (44px),
   padding 12px 20px, focus ring 3px ring-focus.
*/
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'flex h-11 w-full min-w-0 rounded-full border border-hairline bg-surface-card px-5 py-3 text-base text-ink transition-[color,box-shadow] outline-none selection:bg-primary selection:text-on-primary file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink placeholder:text-ash disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-hairline-strong focus-visible:ring-[3px] focus-visible:ring-ring-focus',
        className
      )}
      {...props}
    />
  )
}

export { Input }
