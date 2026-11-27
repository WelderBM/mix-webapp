"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";
import { suggestMeterPrice, hasMeterPrice } from "@/lib/ribbon-pricing";
import { formatCurrency } from "@/lib/utils";
import {
  activePerMeterFor,
  buildPerMeterProduct,
  perMeterName,
} from "@/lib/ribbonOpenRoll";

interface OpenRibbonRollModalProps {
  fita: Product | null;
  // Catálogo do admin: trava de um "p/ metro" ativo por rolo (#413).
  products: Product[];
  onOpenChange: (open: boolean) => void;
  onOpened: () => void;
}

// Sempre pede confirmação — mesmo caminho de código quando já existe um
// preço por metro salvo (só pré-preenche com ele) e quando não existe
// (pré-preenche com a sugestão rollPrice/totalRollMeters). Um portão só,
// não dois fluxos divergentes.
export function OpenRibbonRollModal({
  fita,
  products,
  onOpenChange,
  onOpened,
}: OpenRibbonRollModalProps) {
  const [priceInput, setPriceInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fita) return;
    const prefill = hasMeterPrice(fita) ? fita.price : suggestMeterPrice(fita);
    setPriceInput(prefill != null ? String(prefill) : "");
    setNameInput(perMeterName(fita));
  }, [fita]);

  if (!fita) return null;

  const price = Number(priceInput);
  const priceValid =
    priceInput.trim() !== "" && Number.isFinite(price) && price > 0;
  const totalMeters = fita.ribbonInventory?.totalRollMeters || 0;
  const impliedRollTotal = priceValid ? price * totalMeters : null;

  const nameValid = nameInput.trim() !== "";
  const alreadyOpen = activePerMeterFor(fita.id, products);

  const handleConfirm = async () => {
    if (!priceValid || !nameValid || alreadyOpen) return;
    setSaving(true);
    try {
      // Cria o "p/ metro" e NÃO mexe no rolo fechado (#413): o estoque de
      // rolos lacrados continua vindo do Noturno.
      await addDoc(collection(db, "products"), {
        ...buildPerMeterProduct(fita, nameInput, price),
        createdAt: serverTimestamp(),
      });
      toast.success("Rolo aberto: a fita já está à venda por metro.");
      onOpened();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao abrir o rolo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!fita}
      onOpenChange={(open) => !saving && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors size={18} className="text-purple-500" /> Abrir Rolo —{" "}
            {fita.name}
          </DialogTitle>
          <DialogDescription>
            Cria a fita por metro deste rolo. O rolo fechado continua como
            está (o Noturno já dá a baixa de 1 rolo).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {alreadyOpen && (
            <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Já existe um rolo aberto desta fita ({alreadyOpen.name}, com{" "}
              {alreadyOpen.ribbonInventory?.remainingMeters} m). Encerre ele
              antes de abrir outro.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="open-roll-name">Nome na loja</Label>
            <Input
              id="open-roll-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="open-roll-price">Preço por Metro</Label>
            <Input
              id="open-roll-price"
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              inputMode="decimal"
            />
          </div>
          {priceValid && (
            <p className="text-xs text-slate-500">
              Isso equivale a vender o rolo inteiro ({totalMeters}m) por{" "}
              <strong>{formatCurrency(impliedRollTotal!)}</strong>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!priceValid || !nameValid || !!alreadyOpen || saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Scissors size={16} />
            )}
            Confirmar abertura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
