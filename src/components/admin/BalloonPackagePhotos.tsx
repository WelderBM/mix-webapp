"use client";

import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ImageSearchDialog } from "@/components/admin/ImageSearchDialog";
import { baseTypeId } from "@/lib/intake/balloonCatalog";
import type { BalloonConfig, BalloonTypeConfig } from "@/types/balloon";

// Foto do pacote de cada tipo de balão (dono, 23/10): a arte desenhada se
// repetia em quase todos os cartões do montador. Cada tipo ganha a foto
// do saco de balões dele, buscada na internet com a MESMA forma de busca
// para todos (fotos parecidas entre si). A atendente confere e escolhe;
// o servidor baixa. Vale depois de "Salvar Configurações".

const MATERIAL: Record<string, string> = {
  simples: "liso",
  metalico: "metallic",
  candy: "candy colors",
  cintilante: "cintilante",
  canudo: "canudo 260",
  uniq: "uniq",
  neon: "neon",
  foil_numeros: "metalizado número letra",
};

export function packageQuery(t: BalloonTypeConfig): string {
  const base = baseTypeId(t.id);
  const size = t.sizes[0]?.size;
  const sizeText = size && base !== "canudo" && base !== "foil_numeros" ? ` n${size}` : "";
  return `pacote balão ${MATERIAL[base] ?? t.name}${t.brand ? ` ${t.brand}` : ""}${sizeText}`.trim();
}

interface Props {
  config: BalloonConfig;
  onChange: (next: BalloonConfig) => void;
}

export function BalloonPackagePhotos({ config, onChange }: Props) {
  const [searching, setSearching] = useState<BalloonTypeConfig | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  if (config.types.length === 0) return null;
  // Agrupados por marca, na ordem do catálogo.
  const byBrand = new Map<string, BalloonTypeConfig[]>();
  for (const t of config.types) byBrand.set(t.brand ?? "", [...(byBrand.get(t.brand ?? "") ?? []), t]);
  const missing = config.types.filter((t) => !t.imageUrl).length;

  const setPhoto = (id: string, url: string | null) =>
    onChange({
      ...config,
      types: config.types.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t };
        if (url) next.imageUrl = url;
        else delete next.imageUrl; // o Firestore recusa undefined
        return next;
      }),
    });

  async function pick(t: BalloonTypeConfig, blob: Blob) {
    setUploading(t.id);
    try {
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const snap = await uploadBytes(ref(storage, `balloons/types/${t.id}-${Date.now()}.${ext}`), blob, {
        contentType: blob.type,
      });
      setPhoto(t.id, await getDownloadURL(snap.ref));
      toast.success(`Foto de ${t.name} pronta. Toque em Salvar Configurações.`);
    } catch {
      toast.error("Não foi possível enviar a foto. Tente de novo.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-800">Fotos dos pacotes</h3>
        <p className="text-sm text-slate-500">
          A foto do pacote aparece no cartão do tipo (e no da marca) no montador da loja.
          Prefira o pacote de frente, em fundo branco. {missing > 0 && <strong>{missing} sem foto.</strong>}
        </p>
      </div>
      {[...byBrand.entries()].map(([brand, types]) => (
        <div key={brand || "-"}>
          <h4 className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            {brand || "Sem marca"}
          </h4>
          <ul className="divide-y divide-slate-100">
            {types.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-2">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {uploading === t.id ? (
                    <Loader2 className="animate-spin text-slate-400" size={20} />
                  ) : t.imageUrl ? (
                    <img src={t.imageUrl} alt={`Pacote ${t.name}`} className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-center text-[11px] text-slate-400">sem foto</span>
                  )}
                </div>
                <span className="min-w-24 flex-1 font-semibold text-slate-800">{t.name}</span>
                <Button variant="outline" className="h-11 gap-2" onClick={() => setSearching(t)}>
                  <Search size={16} /> {t.imageUrl ? "Trocar foto" : "Buscar foto do pacote"}
                </Button>
                {t.imageUrl && (
                  <Button
                    variant="ghost"
                    className="h-11 w-11 p-0 text-red-600"
                    aria-label={`Tirar a foto de ${t.name}`}
                    onClick={() => setPhoto(t.id, null)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {/* key: a busca abre já com o texto do tipo certo. */}
      {searching && (
        <ImageSearchDialog
          key={searching.id}
          open
          onOpenChange={(o) => !o && setSearching(null)}
          initialQuery={packageQuery(searching)}
          onPick={(blob) => {
            const t = searching;
            setSearching(null);
            void pick(t, blob);
          }}
        />
      )}
    </section>
  );
}
