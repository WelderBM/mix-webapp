"use client";

import { Dispatch, SetStateAction } from "react";
import { StoreSettings } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DEFAULT_IMPORT_PERIOD_DAYS } from "@/lib/noturnoImport";

interface ConfigTabProps {
  settings: StoreSettings;
  setSettings: Dispatch<SetStateAction<StoreSettings>>;
}

export function ConfigTab({ settings, setSettings }: ConfigTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Configurações Gerais
          </h2>
          <p className="text-sm text-slate-500">
            Ajuste informações gerais da loja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Nome da Loja</Label>
            <Input
              value={settings.storeName}
              onChange={(e) =>
                setSettings({ ...settings, storeName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Número do WhatsApp (Admin)</Label>
            <Input
              value={settings.whatsappNumber}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  whatsappNumber: e.target.value,
                })
              }
              placeholder="55999999999"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Link do Grupo WhatsApp (Pós-Venda)</Label>
            <div className="flex gap-2">
              <Input
                value={settings.whatsappGroupLink || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    whatsappGroupLink: e.target.value,
                  })
                }
                placeholder="https://chat.whatsapp.com/..."
              />
              <Button
                variant="secondary"
                onClick={() =>
                  window.open(settings.whatsappGroupLink, "_blank")
                }
                disabled={!settings.whatsappGroupLink}
              >
                Testar
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Este link será exibido no modal de agradecimento após a compra.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="noturno-period">
              Lembrar de importar o Excel do Noturno a cada (dias)
            </Label>
            <Input
              id="noturno-period"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder={String(DEFAULT_IMPORT_PERIOD_DAYS)}
              value={settings.noturnoImport?.periodDays ?? ""}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                // Vazio vira {} (não `undefined`): o Firestore recusa campo
                // undefined no setDoc do "Salvar Configurações".
                setSettings({
                  ...settings,
                  noturnoImport: Number.isFinite(n) && n >= 1 ? { periodDays: n } : {},
                });
              }}
            />
            <p className="text-xs text-slate-600">
              O aviso no topo do painel some quando um Excel é importado e volta
              depois desse prazo. Vazio = {DEFAULT_IMPORT_PERIOD_DAYS} dias.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="card-on-delivery"
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3"
            >
              <input
                id="card-on-delivery"
                type="checkbox"
                className="size-5 accent-purple-700"
                checked={settings.payment?.cardOnDelivery === true}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, cardOnDelivery: e.target.checked },
                  })
                }
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  O motoboy tem maquininha
                </span>
                <span className="block text-xs text-slate-600">
                  Ligado: o cliente pode pagar com cartão também na entrega.
                  Desligado: na entrega só Pix ou dinheiro (cartão só na retirada).
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
