"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BookOpenCheck, Camera, Loader2, RotateCcw } from "lucide-react";
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
  const [unit, setUnit] = useState<Unit | null>(null);
  const [packText, setPackText] = useState("");
  const [metersText, setMetersText] = useState("");
  const [photo, setPhoto] = useState<{ blob: Blob; preview: string } | null>(
    null,
  );
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Preenche o card a cada item aberto.
  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setPriceText("");
    setCategoryName(matchCategory(item.suggestedCategoryKey, categories) ?? "");
    setUnit(null);
    setPackText(item.packQty && item.packQty > 1 ? String(item.packQty) : "");
    const meters = extractRollMeters(item.name);
    setMetersText(meters ? String(meters) : "");
    setPhoto(null);
    // categories fora das deps de propósito: não resetar o que a atendente
    // já digitou se a lista de categorias atualizar com o card aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.preview);
    },
    [photo],
  );

  if (!item) return null;
  const ribbon = isRibbonItem(item);
  const pending = item.status === "pendente";

  async function handlePhoto(file: File) {
    setProcessingPhoto(true);
    try {
      const { compressImage } = await import("@/lib/intake/compressImage");
      const blob = await compressImage(file);
      setPhoto({ blob, preview: URL.createObjectURL(blob) });
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
      unit: ribbon ? ("m" as Unit) : unit,
      packQty: unit === "pct" ? Number(packText) || null : null,
      photoUrl: photo ? "pending" : null,
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
      const photoUrl = await uploadIntakePhoto(item, photo!.blob);
      const productId = await publishIntakeItem(
        item,
        { ...input, photoUrl },
        userEmail,
      );
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
            <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <BookOpenCheck size={18} className="mt-0.5 shrink-0" />
              <span>
                <strong>Leia o nome inteiro</strong> e confira na embalagem: é
                pacote ou unidade? Quantas vêm? Se o nome e a embalagem não
                baterem, vale a embalagem.
              </span>
            </p>

            {/* Foto primeiro: é o passo que exige estar na frente do produto. */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={processingPhoto || saving}
              className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500"
            >
              {processingPhoto ? (
                <Loader2 className="animate-spin" size={28} />
              ) : photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.preview}
                  alt="Foto do produto"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="flex flex-col items-center gap-2">
                  <Camera size={32} />
                  <span className="font-medium">Tirar foto</span>
                </span>
              )}
              {photo && !processingPhoto && (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  Trocar foto
                </span>
              )}
            </button>
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
                  onChange={(e) => setCategoryName(e.target.value)}
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
