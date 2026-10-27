// Botão de "Mostrar mais" das listas da loja (#345). Some quando acabou.
export function ShowMoreButton({
  remaining,
  pageSize,
  onClick,
}: {
  remaining: number;
  pageSize: number;
  onClick: () => void;
}) {
  if (remaining <= 0) return null;
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="min-h-11 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary"
      >
        Mostrar mais {Math.min(pageSize, remaining)}{" "}
        <span className="font-normal text-slate-500">(faltam {remaining})</span>
      </button>
    </div>
  );
}
