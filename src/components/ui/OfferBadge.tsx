// src/components/ui/OfferBadge.tsx
import { cn } from "@/lib/utils";

interface OfferBadgeProps {
  className?: string;
}

export function OfferBadge({ className }: OfferBadgeProps) {
  return (
    <div
      className={cn(
        "relative w-10 h-10 flex items-center justify-center select-none pointer-events-none z-10",
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-yellow-400 drop-shadow-md animate-in zoom-in duration-300"
        fill="currentColor"
        stroke="rgb(220 38 38)"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        {/* Caminho de uma estrela/explosão de 12 pontas */}
        <path d="M50 2.5L63.3 32.5L95.5 34.6L70.4 55.9L78.5 87.5L50 70L21.5 87.5L29.6 55.9L4.5 34.6L36.7 32.5L50 2.5Z" />
      </svg>
    </div>
  );
}
