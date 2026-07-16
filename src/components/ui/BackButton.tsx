"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  // Destino se não houver histórico dentro do site pra voltar (ex: link
  // direto, aba nova) — nesse caso não dá pra "voltar" de verdade.
  fallbackHref?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

export function BackButton({
  fallbackHref = "/",
  className,
  variant = "ghost",
  size = "sm",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("gap-2", className)}
    >
      <ArrowLeft size={16} /> Voltar
    </Button>
  );
}
