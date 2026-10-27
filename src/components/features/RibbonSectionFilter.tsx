import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RibbonSection } from "@/lib/ribbon-sections";

// Seções por linha + busca da loja de fitas (#345). As seções rolam de
// lado no celular, para não ocupar várias linhas da tela.
export function RibbonSectionFilter({
  sections,
  total,
  section,
  onSection,
  query,
  onQuery,
}: {
  sections: RibbonSection[];
  total: number;
  section: string;
  onSection: (key: string) => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  const chip = (key: string, label: string, count: number) => (
    <button
      key={key || "todas"}
      type="button"
      aria-pressed={section === key}
      onClick={() => onSection(key)}
      className={cn(
        "min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
        section === key
          ? "border-primary bg-primary text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-primary",
      )}
    >
      {label} <span className={section === key ? "text-white" : "text-slate-500"}>({count})</span>
    </button>
  );
  return (
    <div className="mb-4 space-y-3">
      <label className="relative block">
        <span className="sr-only">Buscar fita</span>
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar cor ou estampa (ex.: rosa, xadrez)"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-base outline-none focus:border-primary"
        />
      </label>
      {sections.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Linhas de fita">
          {chip("", "Todas", total)}
          {sections.map((s) => chip(s.key, s.label, s.count))}
        </div>
      )}
    </div>
  );
}
