import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SectionLabelProps {
  children: ReactNode
  icon?: ReactNode
  className?: string
}

// Padrão "etiqueta" (text-[10px] uppercase font-black tracking-widest),
// hoje reescrito por extenso 22x, só no admin, sempre com pequenas variações
// de cor/espaçamento. Uso: rótulos de campo, contadores de meta-informação
// ("3 tamanhos", "5 cores"), cabeçalhos de bloco.
function SectionLabel({ children, icon, className }: SectionLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400",
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export { SectionLabel }
