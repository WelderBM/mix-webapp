"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { ImageSearchDialog } from "@/components/admin/ImageSearchDialog";
import { googleImagesUrl, photoSearchQueries } from "@/lib/imageSearch/suggestions";

// Sugestões de busca de foto dentro do modal de imagem (#347). Com a chave
// do Serper, a sugestão abre a busca do app (a busca só roda ao tocar em
// Buscar); sem ela, abre o Google Imagens numa aba nova.
export function PhotoSearchSuggestions({
  hint,
  folder,
  disabled,
  onUploaded,
}: {
  hint?: string;
  folder: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
}) {
  const queries = photoSearchQueries(hint);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (queries.length === 0) return;
    let alive = true;
    import("@/lib/imageSearch/client")
      .then(({ imageSearchEnabled }) => imageSearchEnabled())
      .then((ok) => alive && setEnabled(ok))
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, [queries.length]);

  if (queries.length === 0) return null;

  async function upload(photo: Blob) {
    setUploading(true);
    try {
      const [{ ref, uploadBytes, getDownloadURL }, { storage }] = await Promise.all([
        import("firebase/storage"),
        import("@/lib/firebase"),
      ]);
      const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
      const snap = await uploadBytes(ref(storage, `${folder}/${Date.now()}-busca.${ext}`), photo);
      onUploaded(await getDownloadURL(snap.ref));
      toast.success("Foto da busca enviada!");
    } catch {
      toast.error("Falha ao enviar a foto da busca.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Search size={16} className="text-purple-600" aria-hidden="true" />
        Buscar foto na internet
        {uploading && <Loader2 size={14} className="animate-spin" aria-label="Enviando" />}
      </p>
      <div className="flex flex-wrap gap-2">
        {queries.map((q) =>
          enabled === false ? (
            <a
              key={q}
              href={googleImagesUrl(q)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:border-purple-500"
            >
              {q} <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : (
            <button
              key={q}
              type="button"
              disabled={disabled || uploading || enabled === null}
              onClick={() => setQuery(q)}
              className="min-h-11 rounded-full border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:border-purple-500 disabled:opacity-50"
            >
              {q}
            </button>
          ),
        )}
      </div>
      {enabled === false && (
        <p className="mt-2 text-[11px] text-slate-500">
          Abre o Google Imagens. Salve a foto e envie por Arquivo ou cole o Link.
        </p>
      )}
      {enabled && (
        <ImageSearchDialog
          open={query !== null}
          onOpenChange={(open) => !open && setQuery(null)}
          initialQuery={query ?? ""}
          onPick={(photo) => {
            setQuery(null);
            void upload(photo);
          }}
        />
      )}
    </div>
  );
}
