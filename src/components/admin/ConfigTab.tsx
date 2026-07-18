"use client";

import { Dispatch, SetStateAction } from "react";
import { StoreSettings } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        </div>
      </div>
    </div>
  );
}
