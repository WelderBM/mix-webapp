"use client";

import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
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

interface OpenRibbonRollModalProps {
  fita: Product | null;
  onOpenChange: (open: boolean) => void;
  onOpened: () => void;
}

// Sempre pede confirmação — mesmo caminho de código quando já existe um
// preço por metro salvo (só pré-preenche com ele) e quando não existe
// (pré-preenche com a sugestão rollPrice/totalRollMeters). Um portão só,
// não dois fluxos divergentes.
export function OpenRibbonRollModal({
  fita,
  onOpenChange,
  onOpened,
}: OpenRibbonRollModalProps) {
  const [priceInput, setPriceInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fita) return;
    const prefill = hasMeterPrice(fita) ? fita.price : suggestMeterPrice(fita);
    setPriceInput(prefill != null ? String(prefill) : "");
  }, [fita]);

  if (!fita) return null;

  const price = Number(priceInput);
  const priceValid =
    priceInput.trim() !== "" && Number.isFinite(price) && price > 0;
  const totalMeters = fita.ribbonInventory?.totalRollMeters || 0;
  const impliedRollTotal = priceValid ? price * totalMeters : null;

  const handleConfirm = async () => {
    if (!priceValid) return;
    setSaving(true);
    try {
      // remainingMeters NÃO é resetado pro total aqui — se esse rolo já foi
      // aberto antes e fechado manualmente com sobra, reabrir preservando o
      // que sobrou evita fabricar estoque que não existe fisicamente.
      const updated: Product = {
        ...fita,
        price,
        ribbonInventory: {
          status: "ABERTO",
          remainingMeters: fita.ribbonInventory?.remainingMeters ?? 0,
          totalRollMeters: fita.ribbonInventory?.totalRollMeters ?? 0,
        },
      };
      await setDoc(doc(db, "products", fita.id), updated);
      toast.success("Rolo aberto para venda por metro!");
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
            Confirme o preço por metro antes de liberar essa fita pra venda ao
            metro/laço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="open-roll-price">Preço por Metro</Label>
            <Input
              id="open-roll-price"
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              autoFocus
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
            disabled={!priceValid || saving}
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
