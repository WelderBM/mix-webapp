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
    if (typeof window === "undefined") return;

    // Aberta via window.open (ex: "Ver na Loja" no admin) — não há
    // histórico nesta aba pra voltar, e router.back() nunca alcança outra
    // aba. A "tela anterior" de verdade aqui é a aba que abriu esta, então
    // fechar a aba É o back — history.length por si só não detecta esse
    // caso (uma aba nova sempre começa com length 1, mas também fica em 1
    // em navegações comuns dependendo do navegador).
    if (window.opener) {
      window.close();
      return;
    }

    if (window.history.length > 1) {
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
