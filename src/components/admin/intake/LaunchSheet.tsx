"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BookOpenCheck, Camera, History, Loader2, Plus, RotateCcw, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Category, Unit } from "@/types";
import type { IntakeItem, IntakeWorkflowStatus } from "@/types/intake";
import {
  extractRollMeters,
  isRibbonItem,
  matchCategory,
  parsePrice,
  validateLaunch,
} from "@/lib/intake/publish";
import { pricePerUnit } from "@/lib/intake/pack";
import { matchSubcategory } from "@/lib/intake/subcategories";
import {
  DRAFT_VERSION,
  deleteDraft,
  isWorthSaving,
  loadDraft,
  saveDraft,
  saveDraftPhotos,
  type LaunchDraftFields,
} from "@/lib/intake/draft";

// Card de lançamento (#200): tudo que veio do Noturno já preenchido; a
// atendente só digita o preço da etiqueta, tira a foto e publica.
// "Vende como" começa SEM escolha de propósito: o nome do Noturno nem
// sempre diz a verdade sobre pacote × unidade, então a atendente precisa
// olhar a embalagem e decidir — a sugestão do nome aparece só como dica.

const UNIT_LABEL: Record<Unit, string> = {
  pct: "Pacote",
  un: "Unidade",
  m: "Metro",
};

const PRICE_LABEL: Record<Unit, string> = {
  pct: "Preço do pacote (etiqueta)",
  un: "Preço da unidade (etiqueta)",
  m: "Preço do metro (etiqueta)",
};

// Até 5 fotos por produto (#201); a primeira é a capa.
const MAX_PHOTOS = 5;
type Photo = { blob: Blob; preview: string };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  item: IntakeItem | null;
  categories: Category[];
  userEmail: string | null;
  onClose: () => void;
  onChanged: (item: IntakeItem) => void;
}

export function LaunchSheet({
  item,
  categories,
  userEmail,
  onClose,
  onChanged,
}: Props) {
  const [name, setName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [packText, setPackText] = useState("");
  const [metersText, setMetersText] = useState("");
  // Várias fotos (#201): a primeira é a capa.
  const [photos, setPhotos] = useState<Photo[]>([]);
  const hasPhotos = photos.length > 0;
  const prevPhotosRef = useRef<Photo[]>([]);
  // Mesmo papel do skipNextSaveRef, para as fotos recuperadas do rascunho.
  const skipPhotosSaveRef = useRef(false);
  // Foto já enviada nesta abertura do card → URL. Numa nova tentativa de
  // publicar (falha de rede), não sobe de novo nem deixa arquivo órfão.
  const uploadedRef = useRef(new Map<Blob, string>());
  // Aviso "Foto removida · Desfazer": fechado ao trocar de item, senão o
  // desfazer poria a foto no card de OUTRO produto.
  const undoToastRef = useRef<string | number | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Rascunho (#233): valores com que o card abriu, e de qual item o
  // rascunho já foi carregado — antes disso não salva (senão gravaria o
  // card vazio por cima do rascunho que ainda está sendo lido).
  const defaultsRef = useRef<LaunchDraftFields | null>(null);
  const hydratedRef = useRef<string | null>(null);
  // A primeira passada depois de carregar o rascunho só repete o que já
  // está gravado — não regrava (nem renova o prazo) por só ter aberto.
  const skipNextSaveRef = useRef(false);
  // Gravação pendente (dentro da folga de 400 ms): executada ao fechar o
  // card, trocar de item ou a tela ir pro fundo — nunca se perde.
  const pendingSaveRef = useRef<(() => void) | null>(null);
  const flushPending = () => pendingSaveRef.current?.();
  const [restored, setRestored] = useState(false);

  function applyFields(f: LaunchDraftFields) {
    setName(f.name);
    setPriceText(f.priceText);
    setCategoryName(f.categoryName);
    setSubcategoryName(f.subcategoryName ?? "");
    setUnit(f.unit);
    setPackText(f.packText);
    setMetersText(f.metersText);
  }

  // Preenche o card a cada item aberto e recupera o rascunho, se houver.
  useEffect(() => {
    if (!item) return;
    const meters = extractRollMeters(item.name);
    const suggestedCategory =
      matchCategory(item.suggestedCategoryKey, categories) ?? "";
    const defaults: LaunchDraftFields = {
      name: item.name,
      priceText: "",
      categoryName: suggestedCategory,
      subcategoryName:
        matchSubcategory(item.suggestedSubcategory, suggestedCategory, categories) ?? "",
      unit: null,
      packText: item.packQty && item.packQty > 1 ? String(item.packQty) : "",
      metersText: meters ? String(meters) : "",
    };
    defaultsRef.current = defaults;
    hydratedRef.current = null;
    applyFields(defaults);
    setPhotos([]);
    uploadedRef.current = new Map();
    if (undoToastRef.current != null) toast.dismiss(undoToastRef.current);
    setRestored(false);
    if (item.status !== "pendente") return flushPending;
    let alive = true;
    loadDraft(item.id).then((d) => {
      if (!alive) return;
      if (d) {
        applyFields(d);
        if (d.photos.length > 0) skipPhotosSaveRef.current = true;
        setPhotos(
          d.photos.map((blob) => ({ blob, preview: URL.createObjectURL(blob) })),
        );
        setRestored(true);
        skipNextSaveRef.current = true;
      }
      hydratedRef.current = item.id;
    });
    return () => {
      alive = false;
      flushPending();
    };
    // categories fora das deps de propósito: não resetar o que a atendente
    // já digitou se a lista de categorias atualizar com o card aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Guarda o rascunho enquanto a atendente preenche (com folga de 400 ms).
  useEffect(() => {
    if (!item || hydratedRef.current !== item.id || !defaultsRef.current) return;
    const id = item.id;
    const fields: LaunchDraftFields = {
      name, priceText, categoryName, subcategoryName, unit, packText, metersText,
    };
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const defaults = defaultsRef.current;
    const flush = () => {
      if (pendingSaveRef.current === flush) pendingSaveRef.current = null;
      else return; // já gravado ou substituído por uma edição mais nova
      if (hydratedRef.current !== id) return;
      if (isWorthSaving(fields, defaults, hasPhotos)) {
        saveDraft(id, { ...fields, v: DRAFT_VERSION, savedAt: Date.now() });
      } else {
        deleteDraft(id);
      }
    };
    pendingSaveRef.current = flush;
    const t = setTimeout(flush, 400);
    return () => clearTimeout(t);
  }, [item, name, priceText, categoryName, subcategoryName, unit, packText, metersText, hasPhotos]);

  // Fotos: gravadas à parte, só quando a lista muda.
  useEffect(() => {
    if (!item || hydratedRef.current !== item.id) return;
    if (skipPhotosSaveRef.current) {
      skipPhotosSaveRef.current = false;
      return;
    }
    saveDraftPhotos(item.id, photos.map((ph) => ph.blob));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // Celular bloqueando / aba indo pro fundo: grava o pendente já.
  // (Publicar/pular zeram hydratedRef antes, então não ressuscita
  // rascunho apagado.)
  useEffect(() => {
    const onHide = () => pendingSaveRef.current?.();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, []);

  function discardDraft() {
    if (!item || !defaultsRef.current) return;
    deleteDraft(item.id);
    applyFields(defaultsRef.current);
    setPhotos([]);
    setRestored(false);
  }

  // Libera a memória das prévias que saíram da lista (e todas ao sair).
  useEffect(() => {
    const keep = new Set(photos.map((ph) => ph.preview));
    for (const ph of prevPhotosRef.current) {
      if (!keep.has(ph.preview)) URL.revokeObjectURL(ph.preview);
    }
    prevPhotosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => prevPhotosRef.current.forEach((ph) => URL.revokeObjectURL(ph.preview)),
    [],
  );

  if (!item) return null;
  const ribbon = isRibbonItem(item);
  const pending = item.status === "pendente";

  function removePhoto(i: number) {
    const removed = photos[i];
    setPhotos((list) => list.filter((_, j) => j !== i));
    undoToastRef.current = toast("Foto removida", {
      action: {
        label: "Desfazer",
        onClick: () =>
          setPhotos((list) =>
            list.includes(removed) ? list : [...list.slice(0, i), removed, ...list.slice(i)],
          ),
      },
    });
  }

  async function handlePhoto(file: File) {
    setProcessingPhoto(true);
    try {
      const { compressImage } = await import("@/lib/intake/compressImage");
      const blob = await compressImage(file);
      setPhotos((list) =>
        list.length >= MAX_PHOTOS
          ? list
          : [...list, { blob, preview: URL.createObjectURL(blob) }],
      );
    } catch {
      toast.error("Não foi possível usar essa foto. Tente de novo.");
    } finally {
      setProcessingPhoto(false);
    }
  }

  async function publish() {
    if (!item) return;
    const input = {
      name,
      price: parsePrice(priceText),
      categoryName,
      subcategoryName: subcategoryName || null,
      unit: ribbon ? ("m" as Unit) : unit,
      packQty: unit === "pct" ? Number(packText) || null : null,
      // Só pra validação; as URLs reais vêm do envio abaixo.
      photoUrls: photos.map(() => "pending"),
      rollMeters: ribbon ? parsePrice(metersText) : null,
    };
    const error = validateLaunch(input, ribbon);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      const { uploadIntakePhoto, publishIntakeItem } =
        await import("@/lib/intake/actions");
      const photoUrls = await Promise.all(
        photos.map(async (ph, i) => {
          const done = uploadedRef.current.get(ph.blob);
          if (done) return done;
          const url = await uploadIntakePhoto(item, ph.blob, i);
          uploadedRef.current.set(ph.blob, url);
          return url;
        }),
      );
      const productId = await publishIntakeItem(
        item,
        { ...input, photoUrls },
        userEmail,
      );
      hydratedRef.current = null;
      deleteDraft(item.id);
      toast.success("Publicado na loja!");
      onChanged({ ...item, name: input.name, status: "publicado", productId });
      onClose();
    } catch (err) {
      toast.error(
        "Não foi possível publicar. Verifique a conexão e tente de novo.",
      );
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(
    to: Exclude<IntakeWorkflowStatus, "publicado">,
    message: string,
  ) {
    if (!item) return;
    setSaving(true);
    try {
      const { setIntakeStatus } = await import("@/lib/intake/actions");
      await setIntakeStatus(item, to, userEmail);
      hydratedRef.current = null;
      deleteDraft(item.id);
      toast.success(message);
      onChanged({ ...item, status: to });
      onClose();
    } catch (err) {
      toast.error("Não foi possível salvar. Verifique a conexão.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b border-slate-100 px-4 pb-3 pt-4 text-left">
          <SheetTitle className="pr-8 text-base leading-snug">
            {item.name}
          </SheetTitle>
          <SheetDescription>
            Cód. {item.sourceCode}
            {item.brand && ` · ${item.brand}`} ·{" "}
            {item.stock.toLocaleString("pt-BR")} em estoque
          </SheetDescription>
        </SheetHeader>

        {!pending ? (
          <div className="space-y-3 p-4">
            <p className="text-sm text-slate-600">
              {item.status === "publicado"
                ? "Este produto já está publicado na loja."
                : item.status === "pulado"
                  ? "Este produto foi pulado."
                  : "Este produto foi marcado para não vender online."}
            </p>
            {item.status !== "publicado" && (
              <Button
                variant="outline"
                className="h-12 w-full"
                disabled={saving}
                onClick={() =>
                  changeStatus("pendente", "Voltou para os pendentes.")
                }
              >
                <RotateCcw size={16} className="mr-2" /> Voltar para pendentes
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {restored && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900"
              >
                <History size={18} className="shrink-0" />
                <span className="flex-1">
                  Rascunho recuperado: continue de onde parou.
                </span>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="min-h-11 shrink-0 px-2 font-medium underline"
                >
                  Descartar
                </button>
              </div>
            )}
            <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <BookOpenCheck size={18} className="mt-0.5 shrink-0" />
              <span>
                <strong>Leia o nome inteiro</strong> e confira na embalagem: é
                pacote ou unidade? Quantas vêm? Se o nome e a embalagem não
                baterem, vale a embalagem.
              </span>
            </p>

            {/* Foto primeiro: é o passo que exige estar na frente do produto. */}
            {photos.length === 0 ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={processingPhoto || saving}
                className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500"
              >
                {processingPhoto ? (
                  <Loader2 className="animate-spin" size={28} />
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <Camera size={32} />
                    <span className="font-medium">Tirar foto</span>
                  </span>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => photos.length < MAX_PHOTOS && fileRef.current?.click()}
                  disabled={processingPhoto || saving}
                  aria-label={photos.length < MAX_PHOTOS ? "Adicionar outra foto" : "Foto de capa"}
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photos[0].preview}
                    alt="Foto de capa do produto"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                    Capa
                  </span>
                  {photos.length < MAX_PHOTOS && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                      + foto
                    </span>
                  )}
                </button>
                <div className="flex flex-wrap gap-2">
                  {photos.map((ph, i) => (
                    <div key={ph.preview} className="flex w-16 flex-col items-center">
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos((list) => [list[i], ...list.filter((_, j) => j !== i)])
                        }
                        disabled={saving}
                        aria-label={i === 0 ? "Foto de capa" : `Usar foto ${i + 1} como capa`}
                        className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                          i === 0 ? "border-purple-600" : "border-slate-200"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ph.preview} alt="" className="h-full w-full object-cover" />
                      </button>
                      {/* Fora da miniatura: tocar na foto para virar capa
                          nunca remove (revisão do #251). */}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        disabled={saving}
                        aria-label={`Remover foto ${i + 1}`}
                        className="flex h-11 w-16 items-center justify-center gap-1 text-xs text-slate-500"
                      >
                        <X size={14} /> Remover
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={processingPhoto || saving}
                      aria-label="Adicionar foto"
                      className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500"
                    >
                      {processingPhoto ? <Loader2 className="animate-spin" size={20} /> : <Plus size={22} />}
                    </button>
                  )}
                </div>
                {photos.length > 1 && (
                  <p className="text-xs text-slate-500">
                    Toque numa miniatura para ela virar a capa.
                  </p>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhoto(f);
                e.target.value = "";
              }}
            />

            {!ribbon && (
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium text-slate-700">
                  Vende como
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(UNIT_LABEL) as Unit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={unit === u}
                      onClick={() => setUnit(u)}
                      className={`h-12 rounded-xl border text-base font-medium transition-colors ${
                        unit === u
                          ? "border-purple-600 bg-purple-600 text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      {UNIT_LABEL[u]}
                    </button>
                  ))}
                </div>
                {item.packEvidence && (
                  <p className="text-xs text-slate-500">
                    O nome diz &ldquo;{item.packEvidence}&rdquo;
                    {item.packQty && item.packQty > 1
                      ? ` (pacote com ${item.packQty}?)`
                      : " (unidade?)"}{" "}
                    — confira na embalagem.
                  </p>
                )}
              </fieldset>
            )}

            {unit === "pct" && !ribbon && (
              <Field label="Unidades no pacote">
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  value={packText}
                  onChange={(e) =>
                    setPackText(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Ex.: 100"
                  className="h-12 w-full rounded-xl border border-slate-300 px-3 text-lg outline-none focus:border-purple-500"
                />
              </Field>
            )}

            <Field
              label={
                ribbon
                  ? "Preço do rolo (etiqueta)"
                  : unit
                    ? PRICE_LABEL[unit]
                    : "Preço (etiqueta)"
              }
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  R$
                </span>
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  value={priceText}
                  onChange={(e) =>
                    setPriceText(e.target.value.replace(/[^\d.,]/g, ""))
                  }
                  placeholder="0,00"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-lg outline-none focus:border-purple-500"
                />
              </div>
              {(() => {
                const price = parsePrice(priceText);
                const each =
                  unit === "pct" && price
                    ? pricePerUnit(price, Number(packText))
                    : null;
                return each ? (
                  <span className="text-xs text-slate-500">
                    {brl(price!)} o pacote = {brl(each)} a unidade
                  </span>
                ) : null;
              })()}
            </Field>

            {ribbon && (
              <Field label="Metros no rolo">
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  value={metersText}
                  onChange={(e) =>
                    setMetersText(e.target.value.replace(/[^\d.,]/g, ""))
                  }
                  placeholder="Ex.: 100"
                  className="h-12 w-full rounded-xl border border-slate-300 px-3 text-lg outline-none focus:border-purple-500"
                />
              </Field>
            )}

            <Field label="Nome na loja">
              <textarea
                value={name}
                onChange={(e) => setName(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:border-purple-500"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <select
                  value={categoryName}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCategoryName(next);
                    // Troca de categoria: reaplica a sugestão na nova (ou limpa).
                    setSubcategoryName(
                      matchSubcategory(item.suggestedSubcategory, next, categories) ?? "",
                    );
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
                >
                  <option value="">Escolha…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              {(() => {
                const subs =
                  categories.find((c) => c.name === categoryName)?.subcategories ?? [];
                if (subs.length === 0) return null;
                return (
                  <Field label="Subcategoria">
                    <select
                      value={subcategoryName}
                      onChange={(e) => setSubcategoryName(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
                    >
                      <option value="">Nenhuma</option>
                      {[...subs]
                        .sort((a, b) => a.order - b.order)
                        .map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                );
              })()}
            </div>

            <div className="space-y-2 pb-[env(safe-area-inset-bottom)] pt-2">
              <Button
                className="h-14 w-full text-base"
                disabled={saving || processingPhoto}
                onClick={publish}
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Publicar na loja"
                )}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12"
                  disabled={saving}
                  onClick={() =>
                    changeStatus(
                      "pulado",
                      "Pulado. Ele continua na lista de pulados.",
                    )
                  }
                >
                  Pular
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  disabled={saving}
                  onClick={() =>
                    changeStatus(
                      "fora_da_loja",
                      "Marcado para não vender online.",
                    )
                  }
                >
                  Não vender online
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
