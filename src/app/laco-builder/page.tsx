// src/app/laco-builder/page.tsx (VERSÃO FINAL CONSOLIDADA)

"use client";

import { useState, useMemo } from "react";
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { Product, CartItem, LacoModelType } from "@/lib/types";
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
  PlusCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  LACO_SIZES,
  LACO_STYLES_OPTIONS,
  LacoSize,
  LacoSizeType,
} from "@/lib/ribbon_config";
import { cn } from "@/lib/utils";
import { SelectWithImage } from "@/components/ui/SelectWithImage";
import { useRouter } from "next/navigation";

// ATUALIZADO: Incluindo a segunda fita
interface RibbonForm {
  fitaPrincipalSelecionada: Product | null;
  fitaSecundariaSelecionada: Product | null; // Para laço misto
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
    fitaPrincipalSelecionada: null,
    fitaSecundariaSelecionada: null,
    tamanhoLaco: null,
    quantidadeLacos: 1,
    tipoLaco: LACO_STYLES_OPTIONS[0].value,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSecondaryRibbon, setUseSecondaryRibbon] = useState(false); // Flag para ativar a segunda fita

  // Busca a descrição do estilo selecionado
  const currentStyleDescription = useMemo(() => {
    return (
      LACO_STYLES_OPTIONS.find((o) => o.value === form.tipoLaco)?.description ||
      "Selecione um estilo para ver a descrição."
    );
  }, [form.tipoLaco]);

  // FILTRO: Fitas abertas que podem ser usadas para laço customizado
  const availableRibbons = useMemo(
    () =>
      allProducts.filter(
        (p) => p.type === "RIBBON" && p.unit === "m" && p.inStock // Filtragem simplificada
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

  // CÁLCULO: Preço final é o preço FIXO DO SERVIÇO (R$2/3/5) * Quantidade
  const calculateTotalPrice = useMemo(() => {
    if (form.tamanhoLaco) {
      const precoServicoFixo = form.tamanhoLaco.servicePrice;
      return precoServicoFixo * form.quantidadeLacos;
    }
    return 0;
  }, [form.tamanhoLaco, form.quantidadeLacos]);

  const handleFinish = () => {
    if (!form.fitaPrincipalSelecionada || !form.tamanhoLaco) {
      return toast.warning("Complete a seleção de fita principal e tamanho.");
    }

    if (useSecondaryRibbon && !form.fitaSecundariaSelecionada) {
      return toast.warning("Selecione a fita secundária para laço misto.");
    }

    setIsProcessing(true);

    const metragemPorLaço = form.tamanhoLaco.metragem;

    // Metragem total GASTA para fins de controle de estoque interno
    const metragemGastaPrincipal = metragemPorLaço * form.quantidadeLacos;
    const metragemGastaSecundaria = useSecondaryRibbon
      ? metragemPorLaço * form.quantidadeLacos
      : 0;

    // O 'product' no CartItem será a fita principal, mas o tipo é CUSTOM_RIBBON
    const newItem: CartItem = {
      cartId: crypto.randomUUID(),
      type: "CUSTOM_RIBBON",
      quantity: form.quantidadeLacos,
      kitName: `Laço Customizado ${form.tipoLaco} ${form.tamanhoLaco.size} - ${
        form.fitaPrincipalSelecionada.name
      }${
        useSecondaryRibbon && form.fitaSecundariaSelecionada
          ? " e " + form.fitaSecundariaSelecionada.name
          : ""
      }`,
      kitTotalAmount: calculateTotalPrice,
      ribbonDetails: {
        fitaPrincipalId: form.fitaPrincipalSelecionada.id, // ID da fita principal
        fitaSecundariaId: form.fitaSecundariaSelecionada?.id, // ID da fita secundária
        cor: form.fitaPrincipalSelecionada.name, // Usando o nome da fita principal como cor no resumo, se necessário
        modelo: form.tipoLaco as LacoModelType, // BOLA ou BORBOLETA
        tamanho: form.tamanhoLaco.size as LacoSizeType, // P, M ou G
        metragemGasta: metragemGastaPrincipal + metragemGastaSecundaria, // Soma de toda a metragem
        assemblyCost: calculateTotalPrice, // Custo total do serviço
      },
    };

    addItem(newItem);
    setIsProcessing(false);
    toast.success(
      `${form.quantidadeLacos} Laços personalizados adicionados ao carrinho!`
    );
    openCart();

    // Reset
    setForm({
      fitaPrincipalSelecionada: null,
      fitaSecundariaSelecionada: null,
      tamanhoLaco: null,
      quantidadeLacos: 1,
      tipoLaco: LACO_STYLES_OPTIONS[0].value,
    });
    setUseSecondaryRibbon(false);
    setStep(1);
  };

  // Funções auxiliares para manipulação do formulário
  const setPrincipalRibbon = (id: string) => {
    setForm((prev) => ({
      ...prev,
      fitaPrincipalSelecionada:
        availableRibbons.find((p) => p.id === id) || null,
    }));
    // Limpar secundária se a principal for alterada
    setForm((prev) => ({ ...prev, fitaSecundariaSelecionada: null }));
    setUseSecondaryRibbon(false); // Resetar opção de mista
  };

  const setSecondaryRibbon = (id: string) => {
    setForm((prev) => ({
      ...prev,
      fitaSecundariaSelecionada:
        availableRibbons.find((p) => p.id === id) || null,
    }));
  };

  const clearSecondaryRibbon = () => {
    setForm((prev) => ({ ...prev, fitaSecundariaSelecionada: null }));
    setUseSecondaryRibbon(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Etapa 1: Fitas (Principal e Opcional)
            </h3>

            {/* SELEÇÃO DA FITA PRINCIPAL */}
            <div className="space-y-2">
              <Label
                htmlFor="fitaPrincipalSelecionada"
                className="text-lg font-bold"
              >
                1. Fita Principal
              </Label>
              <SelectWithImage
                items={ribbonOptions}
                placeholder="Selecione a fita principal..."
                value={form.fitaPrincipalSelecionada?.id}
                onValueChange={setPrincipalRibbon}
              />
            </div>

            {/* NOVO: OPÇÃO DE FITA SECUNDÁRIA (MISTO) */}
            {form.fitaPrincipalSelecionada && (
              <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Label className="flex items-center gap-2 text-lg font-bold">
                  <PlusCircle size={18} /> Laço Misto (Opcional)
                </Label>

                <div className="flex items-center space-x-4">
                  <Button
                    variant={useSecondaryRibbon ? "outline" : "default"}
                    onClick={() => setUseSecondaryRibbon(true)}
                    disabled={!form.fitaPrincipalSelecionada}
                    className={cn(
                      useSecondaryRibbon
                        ? "border-purple-600 text-purple-600 hover:bg-purple-50"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    )}
                  >
                    {useSecondaryRibbon ? "Fita Mista Ativa" : "Ativar 2ª Fita"}
                  </Button>

                  {useSecondaryRibbon && (
                    <Button
                      variant="ghost"
                      onClick={clearSecondaryRibbon}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <XCircle size={16} className="mr-1" /> Remover Fita Mista
                    </Button>
                  )}
                </div>

                {useSecondaryRibbon && (
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="fitaSecundariaSelecionada">
                      2. Fita Secundária
                    </Label>
                    <SelectWithImage
                      items={ribbonOptions.filter(
                        (o) => o.value !== form.fitaPrincipalSelecionada?.id
                      )} // Não pode ser a mesma
                      placeholder="Selecione a fita secundária..."
                      value={form.fitaSecundariaSelecionada?.id}
                      onValueChange={setSecondaryRibbon}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAMANHO DO LAÇO (Mantido na etapa 1) */}
            {form.fitaPrincipalSelecionada && (
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
                <span className="text-slate-600">Fita(s) (Material):</span>
                <span className="font-semibold text-right max-w-[200px]">
                  {form.fitaPrincipalSelecionada?.name}
                  {form.fitaSecundariaSelecionada &&
                    ` + ${form.fitaSecundariaSelecionada?.name}`}
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
        // Fita Principal e Tamanho são obrigatórios. Se usar a secundária, ela também é obrigatória.
        return (
          !!form.fitaPrincipalSelecionada &&
          !!form.tamanhoLaco &&
          (!useSecondaryRibbon ||
            (useSecondaryRibbon && !!form.fitaSecundariaSelecionada))
        );
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
            Personalizado
          </h1>
          <div className="flex justify-between items-center mt-3">
            <p className="text-slate-500">
              Personalize seu laço com fitas abertas (rolo) em modelos
              exclusivos.
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
