// src/components/admin/ProductFormDialog.tsx (WIZARD POR PASSOS)
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Product,
  ProductType,
  ProductImage,
  ProductVariant,
  RibbonInventory,
} from "@/types/product";
import { Category } from "@/types/category";
import { PRODUCT_TYPE_META } from "@/components/ui/status-badge";
import { uniqueSlug } from "@/lib/migrateCategories";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Ruler,
  Save,
  Loader2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ProductImageManager } from "./ProductImageManager";
import { ProductVariationManager } from "./ProductVariationManager";
import { ProductVariationImageManager } from "./ProductVariationImageManager";
import { toOptionalPositiveNumber } from "@/lib/ribbon-pricing";

// Definindo o tipo base de dados do formulário (simplificado)
interface ProductFormData extends Product {
  ribbonInventory?: RibbonInventory;
}

interface ProductDraft {
  formData: ProductFormData;
  stepIndex: number;
}

// Passos do wizard. "classificacao" junta categoria + subcategoria (só
// aparece como campo se a categoria escolhida tiver alguma) + tipo numa
// tela só — eram 3 passos de um campo cada, virou 1 (feedback: passos com
// "input solitário" deixavam o fluxo burocrático demais). RIBBON não tem
// mais um passo à parte: metragem, preços e disponibilidade pro laço
// custom vivem dentro de "detalhes" mesmo, na mesma ordem que aparecem
// pro lojista pensar (nome → metragem → preço do rolo → preço por metro).
// A imagem de cada variação é escolhida dentro do próprio passo "revisao",
// junto da galeria geral do produto — não é um passo à parte (feedback:
// ter a imagem da variação num passo e a capa/galeria do produto em outro
// deixava a escolha de imagem espalhada em dois lugares diferentes pro
// mesmo produto).
type StepId = "classificacao" | "detalhes" | "variacoes" | "revisao";

const STEPS: StepId[] = ["classificacao", "detalhes", "variacoes", "revisao"];

const STEP_LABELS: Record<StepId, string> = {
  classificacao: "Classificação",
  detalhes: "Detalhes",
  variacoes: "Variações",
  revisao: "Revisão",
};

interface ProductFormDialogProps {
  productToEdit: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  // Permite pular direto pra um passo (ex: atalho "Nova Fita" já vem com
  // categoria/tipo definidos). Sem isso, o padrão é: edição de produto
  // existente pula pra "Detalhes" (não faz sentido escolher categoria/tipo
  // de novo só pra mudar um preço); produto novo começa em "Classificação".
  initialStep?: StepId;
}

const initialFormState: ProductFormData = {
  id: "",
  name: "",
  type: "STANDARD_ITEM",
  category: "Geral",
  unit: "un",
  inStock: true,
  disabled: false,
  description: "",
  imageUrl: "",
  ribbonInventory: {
    status: "FECHADO",
    remainingMeters: 0,
    totalRollMeters: 0,
  },
};

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  productToEdit,
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialStep,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Rascunho local (Addendum 4, Parte B): sobrevive a reload/fechamento
  // acidental da aba. `enabled` começa falso e só liga depois de checar um
  // rascunho existente — senão o auto-save grava o formulário em branco por
  // cima do rascunho antes do usuário conseguir responder ao prompt.
  const draftKey = productToEdit?.id
    ? `product-${productToEdit.id}`
    : "product-new";
  const [draftPersistenceEnabled, setDraftPersistenceEnabled] =
    useState(false);
  const [pendingDraft, setPendingDraft] = useState<ProductDraft | null>(null);
  // Memoizado pra só trocar de referência quando `formData`/`stepIndex` de
  // fato mudam — sem isso, qualquer re-render do wizard recriava o objeto
  // e o hook achava que era uma edição nova (mesmo bug corrigido em
  // admin/page.tsx pro rascunho de Configurações/Balões).
  const draftValue = useMemo(
    () => ({ formData, stepIndex }),
    [formData, stepIndex]
  );
  const { restoreDraft, clearDraft } = useDraftPersistence<ProductDraft>(
    draftKey,
    draftValue,
    { enabled: draftPersistenceEnabled }
  );

  const handleClose = () => {
    clearDraft();
    onClose();
  };

  const categoryNames = useMemo(
    () => categories.map((c) => c.name),
    [categories]
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.name === formData.category),
    [categories, formData.category]
  );

  // `categories` vem de um onSnapshot ao vivo (admin/page.tsx) — ganha uma
  // referência nova a cada disparo do listener, mesmo sem nenhuma mudança
  // real (reconexão de rede, sync entre abas, etc). Se o efeito abaixo
  // dependesse de `categories` diretamente, qualquer disparo desses no meio
  // da edição resetava `formData` de volta pro que já estava salvo,
  // silenciosamente apagando edição não salva (ex: imagem de variação recém
  // vinculada) — mesma categoria de bug já documentada em
  // docs/claude-lessons.md ("objeto recriado a cada render engana useEffect
  // por referência"). Guardado num ref pra o efeito só reagir a
  // `productToEdit`/`isOpen`/`initialStep` (quando o wizard de fato deveria
  // recarregar), lendo a versão mais recente de `categories` sem precisar
  // dela como dependência.
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    let nextFormData: ProductFormData;
    if (productToEdit) {
      nextFormData = {
        ...initialFormState,
        ...productToEdit,
        ribbonInventory:
          productToEdit.ribbonInventory || initialFormState.ribbonInventory,
      };
      // Verifica se a categoria/subcategoria são personalizadas (digitadas
      // na hora, ainda sem doc correspondente em `categories`)
      const matchedCategory = categoriesRef.current.find(
        (c) => c.name === productToEdit.category
      );
      setCustomCategory(!!productToEdit.category && !matchedCategory);
      setCustomSubcategory(
        !!productToEdit.subcategory &&
          !!matchedCategory &&
          !matchedCategory.subcategories.some(
            (s) => s.name === productToEdit.subcategory
          )
      );
    } else {
      nextFormData = initialFormState;
      setCustomCategory(false);
      setCustomSubcategory(false);
    }
    setFormData(nextFormData);

    // Passo inicial: calculado a partir do tipo que está prestes a ser
    // carregado (não do estado antigo, que ainda não foi atualizado).
    const startStepId: StepId =
      initialStep ?? (productToEdit?.id ? "detalhes" : "classificacao");
    const startIndex = STEPS.indexOf(startStepId);
    setStepIndex(startIndex >= 0 ? startIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productToEdit, isOpen, initialStep]);

  // Checa rascunho salvo toda vez que o wizard abre (depois do reset acima,
  // pra um "sim" de restaurar sobrescrever os dados recém-carregados do
  // productToEdit, e um "não"/sem rascunho deixar esses dados como estão).
  useEffect(() => {
    if (!isOpen) {
      setDraftPersistenceEnabled(false);
      return;
    }
    const draft = restoreDraft();
    if (draft) {
      setPendingDraft(draft);
    } else {
      setDraftPersistenceEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, draftKey]);

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setFormData(pendingDraft.formData);
      setStepIndex(pendingDraft.stepIndex);
    }
    setPendingDraft(null);
    setDraftPersistenceEnabled(true);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setPendingDraft(null);
    setDraftPersistenceEnabled(true);
  };

  const currentStepIndex = Math.min(stepIndex, STEPS.length - 1);
  const currentStepId = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goNext = () =>
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const isNextDisabled =
    currentStepId === "classificacao" && !formData.category?.trim();

  // Sem `e` quando chamado direto pelo onClick do botão final do wizard
  // (não é mais um handler de onSubmit nativo — ver comentário na tag
  // <form> abaixo sobre por que isso importa num wizard de vários passos).
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // VALIDATIONS
    if (!formData.name.trim()) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }

    if (formData.type === "RIBBON") {
      // Rolo primeiro (ordem em que os campos aparecem no passo "Detalhes"):
      // metragem → preço do rolo (obrigatório) → preço por metro (opcional).
      if (!((formData.ribbonInventory?.totalRollMeters || 0) > 0)) {
        toast.error("A metragem do rolo deve ser maior que zero.");
        return;
      }
      if (!(Number(formData.rollPrice) > 0)) {
        toast.error("O preço do rolo fechado é obrigatório e deve ser maior que zero.");
        return;
      }
      const rawMeterPrice = formData.price;
      const meterPriceFilled =
        rawMeterPrice !== undefined &&
        rawMeterPrice !== null &&
        String(rawMeterPrice).trim() !== "";
      if (meterPriceFilled && !(Number(rawMeterPrice) > 0)) {
        toast.error("O preço por metro, se preenchido, deve ser maior que zero.");
        return;
      }
    } else if (!(Number(formData.price) > 0)) {
      toast.error("O preço deve ser maior que zero.");
      return;
    }

    if (!formData.category || formData.category.trim() === "") {
      toast.error("A categoria é obrigatória.");
      return;
    }

    if (!formData.type) {
      toast.error("O tipo do produto é obrigatório.");
      return;
    }

    if (
      formData.type !== "RIBBON" &&
      (!formData.unit || formData.unit.trim() === "")
    ) {
      toast.error("A unidade de venda (un, m, kg) é obrigatória.");
      return;
    }

    if (formData.variants?.some((v) => !v.imageUrl)) {
      toast.error("Toda variação precisa de uma imagem.");
      return;
    }

    // Sem variações, a galeria é a única fonte de imagem do produto — sem
    // pelo menos uma capa definida, o card na vitrine e outras telas que
    // não sabem de variações ficam sem nenhuma imagem pra mostrar (feedback:
    // a imagem padrão precisa ser garantida já na criação, não só corrigida
    // depois na página do produto).
    if (!formData.variants?.length && !formData.images?.length) {
      toast.error("Adicione ao menos uma imagem para o produto.");
      return;
    }

    setLoading(true);

    try {
      // Categoria/subcategoria digitadas na hora (fluxo "+ Nova Categoria" /
      // "+ Nova Subcategoria") ainda não têm doc em `categories` — cria
      // agora, pra não deixar o produto referenciando algo que não existe
      // na taxonomia.
      const categoryName = formData.category.trim();
      let category = categories.find((c) => c.name === categoryName);
      if (!category) {
        const id = uniqueSlug(
          categoryName,
          categories.map((c) => c.id)
        );
        category = {
          id,
          name: categoryName,
          order: categories.length,
          active: true,
          subcategories: [],
        };
        await setDoc(doc(db, "categories", id), category);
      }
      const subcategoryName = formData.subcategory?.trim();
      if (
        subcategoryName &&
        !category.subcategories.some((s) => s.name === subcategoryName)
      ) {
        const subId = uniqueSlug(
          subcategoryName,
          category.subcategories.map((s) => s.id)
        );
        await setDoc(
          doc(db, "categories", category.id),
          {
            subcategories: [
              ...category.subcategories,
              {
                id: subId,
                name: subcategoryName,
                order: category.subcategories.length,
              },
            ],
          },
          { merge: true }
        );
      }

      // Gera ID se for novo
      const productId = formData.id || doc(collection(db, "products")).id;

      // Com variações e sem galeria própria, a imagem da primeira variação
      // (a padrão) também vira a capa do produto — telas que não sabem de
      // variações (card na vitrine, tabela do admin, carrinho) leem
      // `images`/`imageUrl`, não `variants`.
      const defaultVariantImage = formData.variants?.[0]?.imageUrl;
      const images =
        !formData.images?.length && defaultVariantImage
          ? [{ id: crypto.randomUUID(), url: defaultVariantImage, isCover: true }]
          : formData.images;

      const isRibbon = formData.type === "RIBBON";
      // `price` opcional de propósito (ver types/product.ts) — nunca grava
      // 0 como sentinela de "sem preço por metro ainda". `""`/undefined
      // viram `undefined` de verdade, não `0`.
      const meterPrice = toOptionalPositiveNumber(formData.price);

      const productData: Product = {
        ...formData,
        id: productId,
        price: isRibbon ? meterPrice : Number(formData.price),
        rollPrice: isRibbon ? Number(formData.rollPrice) : formData.rollPrice,
        category: formData.category.trim(),
        unit: isRibbon ? "m" : (formData.unit.trim() as any),
        images,
        imageUrl: formData.imageUrl || defaultVariantImage || "",
      };

      // Firestore rejeita `undefined` explícito em qualquer campo (diferente
      // de campo ausente) — `price`/`rollPrice` viram `undefined` de
      // propósito quando não preenchidos (opcionais, sem sentinela 0), então
      // precisam sair do objeto antes do setDoc, não só ficar com esse
      // valor. Mesmo idioma já usado no merge de variantPatch acima.
      (Object.keys(productData) as (keyof Product)[]).forEach((key) => {
        if (productData[key] === undefined) delete productData[key];
      });

      await setDoc(doc(db, "products", productId), productData);

      toast.success(productToEdit ? "Produto atualizado!" : "Produto criado!");
      clearDraft();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // `status` não é mais alterável aqui — vira transição de estado só pelas
  // ações "Abrir Rolo"/"Fechar Manual" em RibbonsTab, nunca campo de form
  // (nem em criação, nem em edição).
  const handleRibbonInventoryChange = (
    key: keyof RibbonInventory,
    value: any
  ) => {
    setFormData((prev) => {
      if (key === "totalRollMeters") {
        const newTotal = parseFloat(value) || 0;
        return {
          ...prev,
          ribbonInventory: {
            ...prev.ribbonInventory,
            totalRollMeters: newTotal,
            remainingMeters:
              prev.ribbonInventory?.status === "FECHADO"
                ? newTotal
                : prev.ribbonInventory?.remainingMeters || 0,
          } as RibbonInventory,
        };
      }

      return {
        ...prev,
        ribbonInventory: {
          ...prev.ribbonInventory,
          [key]: parseFloat(value) || 0,
        } as RibbonInventory,
      };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && handleClose()}>
      <DialogContent
        className="sm:max-w-[700px] sm:max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulário em etapas para {productToEdit ? "editar" : "criar"} um
            produto: classificação, detalhes e imagens.
          </DialogDescription>
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wide">
            <span>
              Passo {currentStepIndex + 1} de {STEPS.length} —{" "}
              {STEP_LABELS[currentStepId]}
            </span>
          </div>
          <Progress
            value={((currentStepIndex + 1) / STEPS.length) * 100}
            className="h-1.5"
          />
        </DialogHeader>

        {/*
          Sem onSubmit real de propósito. Um wizard de vários passos dentro
          de um único <form> é frágil com submit nativo do HTML: (1) Enter
          num <Input> de texto em QUALQUER passo aciona o botão de submit
          do form inteiro, não importa qual passo está visível; (2) o botão
          final troca de type="button" (Avançar) pra type="submit" (Criar
          Produto) só na renderização do último passo, e no exato clique
          que causa essa troca o navegador às vezes ainda processa o clique
          como submit. O preventDefault abaixo neutraliza qualquer submit
          nativo que escape por essas frestas; a criação/edição de verdade
          só acontece pelo onClick explícito do botão "Criar Produto" no
          rodapé, nunca pelo evento submit do form.
        */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="py-4 space-y-4 min-h-[260px]">
            {currentStepId === "classificacao" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  {!customCategory ? (
                    <Select
                      value={
                        categoryNames.includes(formData.category)
                          ? formData.category
                          : undefined
                      }
                      onValueChange={(v) => {
                        if (v === "custom_new") {
                          setCustomCategory(true);
                          handleInputChange("category", "");
                        } else {
                          handleInputChange("category", v);
                        }
                        handleInputChange("subcategory", "");
                        setCustomSubcategory(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryNames.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                        <SelectItem
                          value="custom_new"
                          className="text-purple-600 font-bold"
                        >
                          + Nova Categoria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome da nova categoria"
                        value={formData.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCustomCategory(false)}
                        title="Voltar para lista"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                {selectedCategory && (
                  <div className="space-y-2">
                    <Label>
                      Subcategoria{" "}
                      <span className="text-slate-400 font-normal">
                        (opcional)
                      </span>
                    </Label>
                    {customSubcategory ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome da nova subcategoria"
                          value={formData.subcategory || ""}
                          onChange={(e) =>
                            handleInputChange("subcategory", e.target.value)
                          }
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCustomSubcategory(false)}
                          title="Cancelar"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : selectedCategory.subcategories.length > 0 ? (
                      <Select
                        value={
                          selectedCategory.subcategories.some(
                            (s) => s.name === formData.subcategory
                          )
                            ? formData.subcategory
                            : undefined
                        }
                        onValueChange={(v) => {
                          if (v === "custom_new_sub") {
                            setCustomSubcategory(true);
                            handleInputChange("subcategory", "");
                          } else {
                            handleInputChange("subcategory", v);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategory.subcategories.map((s) => (
                            <SelectItem key={s.id} value={s.name}>
                              {s.name}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="custom_new_sub"
                            className="text-purple-600 font-bold"
                          >
                            + Nova Subcategoria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCustomSubcategory(true)}
                        className="text-xs text-purple-600 font-bold flex items-center gap-1"
                      >
                        <Plus size={12} /> Adicionar subcategoria
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      handleInputChange("type", v as ProductType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* ASSEMBLED_KIT fica de fora: kits nunca são criados
                          por este formulário, só via kit_recipes/KitBuilderModal. */}
                      {(
                        Object.entries(PRODUCT_TYPE_META) as [
                          ProductType,
                          (typeof PRODUCT_TYPE_META)[ProductType]
                        ][]
                      )
                        .filter(([value]) => value !== "ASSEMBLED_KIT")
                        .map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            {meta.filterLabel}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStepId === "detalhes" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                {formData.type === "RIBBON" ? (
                  <div className="space-y-4 rounded-lg border p-4 bg-yellow-50/50">
                    <h4 className="font-bold text-sm text-yellow-800 flex items-center gap-2 uppercase tracking-wide">
                      <Ruler size={16} /> Metragem e Preços do Rolo
                    </h4>

                    <div className="space-y-2">
                      <Label htmlFor="totalMeters">Metragem do Rolo (m)</Label>
                      <Input
                        id="totalMeters"
                        type="number"
                        value={formData.ribbonInventory?.totalRollMeters || ""}
                        onChange={(e) =>
                          handleRibbonInventoryChange(
                            "totalRollMeters",
                            e.target.value
                          )
                        }
                        placeholder="Ex: 100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollPrice">Preço do Rolo Fechado</Label>
                      <Input
                        id="rollPrice"
                        type="number"
                        step="0.01"
                        value={formData.rollPrice ?? ""}
                        onChange={(e) =>
                          handleInputChange("rollPrice", e.target.value)
                        }
                        placeholder="Ex: 40.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meterPrice">
                        Preço por Metro{" "}
                        <span className="text-slate-400 font-normal">
                          (opcional)
                        </span>
                      </Label>
                      <Input
                        id="meterPrice"
                        type="number"
                        step="0.01"
                        value={formData.price ?? ""}
                        onChange={(e) =>
                          handleInputChange("price", e.target.value)
                        }
                        placeholder="Pode confirmar depois, ao abrir o rolo"
                      />
                    </div>

                    {formData.ribbonInventory?.status === "ABERTO" && (
                      <div className="space-y-2 animate-in fade-in">
                        <Label
                          htmlFor="remainingMeters"
                          className="flex justify-between"
                        >
                          Metragem Restante (m)
                          <span className="text-sm text-slate-500">
                            Total: {formData.ribbonInventory.totalRollMeters}m
                          </span>
                        </Label>
                        <Input
                          id="remainingMeters"
                          type="number"
                          value={formData.ribbonInventory.remainingMeters}
                          onChange={(e) =>
                            handleRibbonInventoryChange(
                              "remainingMeters",
                              e.target.value
                            )
                          }
                          placeholder="Ex: 25.5"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-yellow-100">
                      <Label htmlFor="customBow" className="text-sm font-normal">
                        Disponível para Laço Customizado/Venda ao Metro?
                      </Label>
                      <Switch
                        id="customBow"
                        checked={formData.isAvailableForCustomBow}
                        onCheckedChange={(checked) =>
                          handleInputChange("isAvailableForCustomBow", checked)
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price ?? ""}
                        onChange={(e) =>
                          handleInputChange("price", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unidade de Venda</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(v) => handleInputChange("unit", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="un">UNIDADE (un)</SelectItem>
                          <SelectItem value="m">METRO (m)</SelectItem>
                          <SelectItem value="pct">PACOTE (pct)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {currentStepId === "variacoes" && (
              <ProductVariationManager
                variants={formData.variants || []}
                onChange={(newVariants: ProductVariant[]) =>
                  handleInputChange("variants", newVariants)
                }
                disabled={loading}
              />
            )}

            {currentStepId === "revisao" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inStock"
                    checked={formData.inStock}
                    onCheckedChange={(checked) =>
                      handleInputChange("inStock", checked)
                    }
                  />
                  <Label htmlFor="inStock">Em Estoque</Label>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <ProductImageManager
                    images={formData.images || []}
                    onChange={(newImages: ProductImage[]) => {
                      const cover =
                        newImages.find((img) => img.isCover) || newImages[0];
                      const validImageIds = new Set(
                        newImages.map((img) => img.id)
                      );
                      setFormData((prev) => ({
                        ...prev,
                        images: newImages,
                        // Sync legacy imageUrl for backward compat
                        imageUrl: cover ? cover.url : "",
                        // Variação vinculada a uma imagem removida da
                        // galeria (ex: apagada aqui) fica com referência
                        // morta — limpa o vínculo pra voltar a pedir
                        // "Imagem obrigatória" em vez de continuar
                        // mostrando/selecionando uma foto que não existe
                        // mais na lista.
                        variants: (prev.variants || []).map((v) => {
                          if (!v.imageId || validImageIds.has(v.imageId))
                            return v;
                          const { imageId, imageUrl, ...rest } = v;
                          return rest as ProductVariant;
                        }),
                      }));
                    }}
                    disabled={loading}
                  />
                </div>

                {!!formData.variants?.length && (
                  <div className="space-y-2 border-t pt-4">
                    <ProductVariationImageManager
                      images={formData.images || []}
                      variants={formData.variants || []}
                      onChange={(patch) => {
                        // Merge feito aqui, contra `prev` — não contra o que
                        // o ProductVariationImageManager tinha em mãos quando
                        // o clique aconteceu. O updater funcional garante que
                        // a intenção ("variação X, campo Y") é aplicada sobre
                        // o estado mais recente de verdade.
                        setFormData((prev) => {
                          const nextVariants = (prev.variants || []).map(
                            (v) => {
                              if (v.id !== patch.variantId) return v;
                              const merged = { ...v, ...patch.variantPatch };
                              (
                                Object.keys(merged) as (keyof ProductVariant)[]
                              ).forEach((key) => {
                                if (merged[key] === undefined)
                                  delete merged[key];
                              });
                              return merged;
                            }
                          );
                          return { ...prev, variants: nextVariants };
                        });
                      }}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={isFirstStep ? handleClose : goBack}
              disabled={loading}
              className="gap-2"
            >
              {!isFirstStep && <ChevronLeft size={16} />}
              {isFirstStep ? "Cancelar" : "Voltar"}
            </Button>
            {!isLastStep ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={isNextDisabled}
                className="gap-2"
              >
                Avançar <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                {productToEdit ? "Atualizar" : "Criar Produto"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={!!pendingDraft}
        onOpenChange={(open) => !open && handleDiscardDraft()}
        title="Rascunho não salvo encontrado"
        description="Você tem um rascunho não salvo desse produto. Deseja continuar de onde parou?"
        confirmLabel="Continuar rascunho"
        cancelLabel="Descartar"
        destructive={false}
        onConfirm={handleRestoreDraft}
      />
    </Dialog>
  );
};
