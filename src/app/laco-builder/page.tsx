"use client";

import { useState, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product, CartItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  Loader2,
  Package,
  Ruler,
  Gift,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { LACO_SIZES, LACO_STYLES_OPTIONS, LacoSize } from "@/lib/ribbon_config";
import { cn } from "@/lib/utils";
import { SelectWithImage } from "@/components/ui/SelectWithImage";
import { useRouter } from "next/navigation";

interface RibbonForm {
  fitaSelecionada: Product | null;
  tamanhoLaco: LacoSize | null;
  quantidadeLacos: number;
  tipoLaco: string;
}

export default function LacoBuilderPage() {
  const router = useRouter();
  const { allProducts } = useProductStore();
  const { addItem, openCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RibbonForm>({
    fitaSelecionada: null,
    tamanhoLaco: null,
    quantidadeLacos: 1,
    tipoLaco: LACO_STYLES_OPTIONS[0].value,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Busca a descrição do estilo selecionado
  const currentStyleDescription = useMemo(() => {
    return (
      LACO_STYLES_OPTIONS.find((o) => o.value === form.tipoLaco)?.description ||
      "Selecione um estilo para ver a descrição."
    );
  }, [form.tipoLaco]);

  // Filtra apenas fitas vendidas por metro ('m')
  const availableRibbons = useMemo(
    () =>
      allProducts.filter(
        (p) => p.type === "RIBBON" && p.unit === "m" && p.inStock
      ),
    [allProducts]
  );

  // Adaptação para o SelectWithImage
  const ribbonOptions = useMemo(
    () =>
      availableRibbons.map((p) => ({
        value: p.id,
        label: p.name,
        imageUrl: p.imageUrl,
        disabled: !p.inStock,
      })),
    [availableRibbons]
  );

  const calculateTotalPrice = useMemo(() => {
    if (form.fitaSelecionada && form.tamanhoLaco) {
      // Preço final é apenas o preço fixo do serviço
      const precoServicoFixo = form.tamanhoLaco.servicePrice;
      return precoServicoFixo * form.quantidadeLacos;
    }
    return 0;
  }, [form.fitaSelecionada, form.tamanhoLaco, form.quantidadeLacos]);

  const handleFinish = () => {
    if (!form.fitaSelecionada || !form.tamanhoLaco) {
      return toast.warning("Complete a seleção de fita e tamanho.");
    }

    setIsProcessing(true);

    // Metragem consumida (mantida no objeto do carrinho para estoque, mas invisível)
    const metragemTotalCalculada =
      form.tamanhoLaco.metragem * form.quantidadeLacos;

    const newItem: CartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_RIBBON",
      quantity: form.quantidadeLacos,
      kitName: `${form.tipoLaco} ${form.tamanhoLaco.size} - ${form.fitaSelecionada.name}`,
      kitTotalAmount: calculateTotalPrice,
      ribbonDetails: {
        fitaSelecionada: form.fitaSelecionada,
        metragemTotal: metragemTotalCalculada,
        tamanhoLaco: form.tamanhoLaco.size,
        quantidadeLacos: form.quantidadeLacos,
        tipoLaco: form.tipoLaco,
      },
    };

    addItem(newItem);
    setIsProcessing(false);
    toast.success(
      `${form.quantidadeLacos} Laços prontos adicionados ao carrinho!`
    );
    openCart();

    setForm({
      fitaSelecionada: null,
      tamanhoLaco: null,
      quantidadeLacos: 1,
      tipoLaco: LACO_STYLES_OPTIONS[0].value,
    });
    setStep(1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Etapa 1: Fita e Tamanho do Laço
            </h3>

            <Label htmlFor="fitaSelecionada">Fita (Tamanho e Cor)</Label>

            <SelectWithImage
              items={ribbonOptions}
              placeholder="Selecione a fita..."
              value={form.fitaSelecionada?.id}
              onValueChange={(id) =>
                setForm((prev) => ({
                  ...prev,
                  fitaSelecionada:
                    availableRibbons.find((p) => p.id === id) || null,
                }))
              }
            />

            {form.fitaSelecionada && (
              <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Label
                  htmlFor="tamanhoLaco"
                  className="flex items-center gap-2 text-lg font-bold"
                >
                  <Ruler size={18} /> Escolha o Tamanho do Laço
                </Label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {LACO_SIZES.map((laco) => (
                    <div
                      key={laco.size}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, tamanhoLaco: laco }))
                      }
                      className={cn(
                        "border-2 rounded-xl p-4 cursor-pointer transition-all relative",
                        form.tamanhoLaco?.size === laco.size
                          ? "border-purple-600 bg-purple-50 ring-2 ring-purple-300 shadow-md"
                          : "border-slate-200 hover:border-purple-300 bg-white"
                      )}
                    >
                      {form.tamanhoLaco?.size === laco.size && (
                        <div className="absolute top-2 right-2 text-white bg-purple-600 rounded-full p-1">
                          <Check size={14} />
                        </div>
                      )}
                      <div className="font-extrabold text-xl">{laco.size}</div>
                      <div className="text-sm text-slate-700 font-medium">
                        {laco.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Preço:{" "}
                        {laco.servicePrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">
                        {laco.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Etapa 2: Estilo e Quantidade
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tipoLaco">Estilo do Laço (Montagem)</Label>
                <Select
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, tipoLaco: v }))
                  }
                  value={form.tipoLaco}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LACO_STYLES_OPTIONS.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 mt-1">
                  {currentStyleDescription}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="quantidadeLacos"
                  className="flex items-center gap-2"
                >
                  <Gift size={16} /> Quantidade de Laços Prontos
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={form.quantidadeLacos}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantidadeLacos: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="font-bold text-lg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Total de itens que serão adicionados ao seu carrinho.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        const precoUnitarioServico = form.tamanhoLaco?.servicePrice || 0;

        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Etapa 3: Revisão e Finalização
            </h3>

            <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-lg space-y-4">
              <p className="text-xs font-semibold text-purple-600 uppercase">
                Resumo do Pedido:
              </p>

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Serviço Solicitado:</span>
                <span className="font-semibold">
                  {form.tipoLaco} - {form.tamanhoLaco?.size}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-600">Fita (Material):</span>
                <span className="font-semibold">
                  {form.fitaSelecionada?.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Laços Montados:</span>
                <span className="font-bold text-lg text-purple-700">
                  {form.quantidadeLacos} unidades
                </span>
              </div>

              <div className="flex justify-between text-sm text-slate-600 pt-2 border-t border-dashed">
                <span>Preço por Unidade (Serviço):</span>
                <span className="font-medium">
                  {precoUnitarioServico.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>

              {/* REMOVIDO: Bloco de Metragem Consumida (Interna) */}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <span className="text-2xl font-bold text-slate-900">
                Total Final:
              </span>
              <span className="text-3xl font-extrabold text-green-600">
                {calculateTotalPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!form.fitaSelecionada && !!form.tamanhoLaco;
      case 2:
        return form.quantidadeLacos > 0 && form.tipoLaco;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Scissors className="text-purple-600" size={32} /> Serviço Laço
            Rápido
          </h1>
          <div className="flex justify-between items-center mt-3">
            <p className="text-slate-500">
              Personalize seu pedido de fitas e laços prontos.
            </p>
            <Badge variant="outline" className="text-sm">
              Etapa {step} / 3
            </Badge>
          </div>
        </header>

        {renderStep()}

        <footer className="mt-8 pt-6 border-t">
          <div className="flex justify-between items-center">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm text-slate-500 hover:text-purple-600 p-0 h-auto"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar ao Início
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
              </Button>

              {step < 3 ? (
                <Button
                  onClick={() => setStep((prev) => prev + 1)}
                  disabled={!isStepValid()}
                >
                  Próximo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-12"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Package className="mr-2 h-5 w-5" /> Adicionar Pedido Laço
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
