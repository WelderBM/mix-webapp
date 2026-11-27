import Link from "next/link";

// Aparece para o CLIENTE quando a home não tem nenhuma seção ativa: em vez
// de um aviso para o admin, leva direto para as páginas que vendem.
const LINKS = [
  { href: "/fitas", label: "Fitas e laços" },
  { href: "/baloes", label: "Balões" },
  { href: "/natura", label: "Natura" },
];

export const EmptyStoreState = () => {
  return (
    <div className="md:col-span-2 text-center py-16 px-4 bg-white rounded-xl border border-slate-200">
      <p className="text-lg font-semibold text-slate-800">
        Estamos arrumando a vitrine.
      </p>
      <p className="text-slate-600 mt-1">Enquanto isso, veja o que tem na loja:</p>
      <nav aria-label="Seções da loja" className="mt-6 flex flex-wrap justify-center gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex min-h-11 items-center rounded-full bg-purple-700 px-5 font-semibold text-white hover:bg-purple-800"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
