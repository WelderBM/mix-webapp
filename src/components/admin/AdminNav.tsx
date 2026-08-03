"use client";

import { ShoppingBag, Package, Layout, PartyPopper, Scissors, Settings2 } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type AdminViewMode = "orders" | "inventory";

const LEVEL2_ITEMS = [
  { value: "products", label: "Produtos", Icon: Package },
  { value: "sections", label: "Vitrine", Icon: Layout },
  { value: "balloons", label: "Balões", Icon: PartyPopper },
  { value: "ribbons", label: "Fitas", Icon: Scissors },
  { value: "config", label: "Configurações", Icon: Settings2 },
] as const;

// Estilo compartilhado por nível 1 e nível 2: aba ativa vira underline +
// cor, nunca uma caixa/moldura própria — as duas fileiras de pílulas
// emolduradas (issue #76) somavam peso visual e quebravam em duas linhas
// no mobile.
const NAV_ITEM_BASE =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors";
const NAV_ITEM_INACTIVE =
  "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700";

function level1Class(active: boolean) {
  return cn(
    NAV_ITEM_BASE,
    active ? "border-blue-600 font-semibold text-blue-700" : NAV_ITEM_INACTIVE
  );
}

// Reset das classes padrão do shadcn TabsTrigger (bg/border/shadow de
// "pílula") pra reaproveitar o mesmo estilo underline do nível 1.
const LEVEL2_TRIGGER_CLASS = cn(
  NAV_ITEM_BASE,
  "flex-none rounded-none bg-transparent p-3 shadow-none",
  "data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-purple-700 data-[state=active]:shadow-none",
  "data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500",
  "dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-purple-300"
);

interface AdminNavProps {
  viewMode: AdminViewMode;
  onViewModeChange: (mode: AdminViewMode) => void;
}

/**
 * Navegação unificada do admin (issue #76): nível 1 (Pedidos/Estoque) e
 * nível 2 (Produtos/Vitrine/Balões/Fitas/Configurações) numa barra única,
 * sem molduras concorrentes. Quando "Estoque" está ativo, o nível 2
 * aparece na mesma linha, separado por um divisor — deixando clara a
 * hierarquia (nível 2 é sub-navegação de Estoque) sem duas fileiras de
 * caixa. `overflow-x-auto` + `whitespace-nowrap` garantem uma linha só no
 * mobile em vez de quebrar em duas.
 */
export function AdminNav({ viewMode, onViewModeChange }: AdminNavProps) {
  return (
    <nav
      aria-label="Navegação do painel administrativo"
      className="mt-6 flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-slate-200 pb-px"
    >
      <button
        type="button"
        aria-current={viewMode === "orders" ? "page" : undefined}
        onClick={() => onViewModeChange("orders")}
        className={level1Class(viewMode === "orders")}
      >
        <ShoppingBag size={16} /> Pedidos
      </button>
      <button
        type="button"
        aria-current={viewMode === "inventory" ? "page" : undefined}
        onClick={() => onViewModeChange("inventory")}
        className={level1Class(viewMode === "inventory")}
      >
        <Package size={16} /> Gerenciar Estoque
      </button>

      {viewMode === "inventory" && (
        <>
          <span
            aria-hidden
            className="mx-1 h-5 w-px shrink-0 bg-slate-200"
          />
          <TabsList className="h-auto w-auto flex-nowrap justify-start gap-1 rounded-none bg-transparent p-0">
            {LEVEL2_ITEMS.map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={LEVEL2_TRIGGER_CLASS}
              >
                <Icon size={16} /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </>
      )}
    </nav>
  );
}
