import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeBase =
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden"

const badgeVariants = cva(badgeBase, {
  variants: {
    variant: {
      default:
        "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
      secondary:
        "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
      destructive:
        "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
      outline:
        "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

// Tons semânticos para conceitos de domínio (status de pedido, tipo de
// produto etc). Eixo independente de `variant` — quando `tone` é informado,
// ele substitui `variant` por completo (evita as duas receitas de cor
// conflitarem na mesma badge). Ver status-badge.tsx para os usos mapeados.
const badgeTones = {
  neutral: "border-transparent bg-slate-100 text-slate-700",
  info: "border-transparent bg-blue-100 text-blue-800",
  success: "border-transparent bg-green-100 text-green-800",
  warning: "border-transparent bg-yellow-100 text-yellow-800",
  danger: "border-transparent bg-red-100 text-red-800",
  brand: "border-transparent bg-purple-100 text-purple-800",
  accent: "border-transparent bg-orange-100 text-orange-800",
  pink: "border-transparent bg-pink-100 text-pink-800",
  teal: "border-transparent bg-teal-100 text-teal-800",
} as const

export type BadgeTone = keyof typeof badgeTones

function Badge({
  className,
  variant,
  tone,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; tone?: BadgeTone }) {
  const Comp = asChild ? Slot : "span"

  const classes = tone
    ? cn(badgeBase, badgeTones[tone], className)
    : cn(badgeVariants({ variant }), className)

  return <Comp data-slot="badge" className={classes} {...props} />
}

export { Badge, badgeVariants }
