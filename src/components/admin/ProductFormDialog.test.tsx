// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ProductFormDialog } from "./ProductFormDialog";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import type { Tag } from "@/types/tag";

// Radix Select depende de APIs de DOM que happy-dom não implementa
// (hasPointerCapture/scrollIntoView) — sem esses stubs, abrir o dropdown
// lança e o teste nunca vê o conteúdo do SelectContent.
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

function makeCategories(): Category[] {
  return [
    {
      id: "baloes",
      name: "Balões",
      order: 0,
      active: true,
      subcategories: [
        { id: "metalizados", name: "Metalizados", order: 0 },
        { id: "latex", name: "Látex", order: 1 },
      ],
    },
    {
      id: "fitas",
      name: "Fitas",
      order: 1,
      active: true,
      subcategories: [],
    },
  ];
}

// `tags` excluído de `overrides`: no `Product`, `tags` é `string[]` (nomes
// gravados no produto); nas props do diálogo é `Tag[]` (catálogo gerenciado)
// — mesmo nome, formatos diferentes de propósito. Nenhum teste aqui precisa
// sobrescrever o catálogo de tags via este helper.
function baseProps(
  overrides: Omit<Partial<Product>, "tags"> = {},
  productToEdit: Product | null = null,
  tags: Tag[] = []
) {
  const categories = makeCategories();
  return {
    productToEdit,
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    categories,
    tags,
    customKitEnabled: false,
    ...overrides,
  };
}

function openCategorySelect() {
  const trigger = screen.getAllByRole("combobox")[0];
  fireEvent.click(trigger);
}

describe("ProductFormDialog — passo Classificação (issue #69, categoria/subcategoria como seleção controlada)", () => {
  it("não oferece opção de criar categoria nova no Select de Categoria (sem '+ Nova Categoria')", () => {
    render(<ProductFormDialog {...baseProps()} />);
    openCategorySelect();

    expect(screen.queryByText(/\+ Nova Categoria/i)).not.toBeInTheDocument();
    // As duas categorias existentes continuam disponíveis normalmente.
    expect(screen.getByRole("option", { name: "Balões" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fitas" })).toBeInTheDocument();
  });

  it("não renderiza nenhum input de texto livre para categoria (não existe mais o fluxo 'digitar categoria nova')", () => {
    render(<ProductFormDialog {...baseProps()} />);
    expect(
      screen.queryByPlaceholderText(/nome da nova categoria/i)
    ).not.toBeInTheDocument();
  });

  it("não oferece '+ Nova Subcategoria' nem input de texto livre para subcategoria", () => {
    const product: Product = {
      id: "p1",
      name: "Balão Metalizado Coração",
      type: "STANDARD_ITEM",
      category: "Balões",
      unit: "un",
      inStock: true,
      disabled: false,
      price: 10,
    };
    render(<ProductFormDialog {...baseProps({}, product)} initialStep="classificacao" />);

    // Categoria "Balões" tem subcategorias — o Select de subcategoria deve
    // aparecer, sem a opção de criar uma nova.
    const subcategoryTrigger = screen.getAllByRole("combobox")[1];
    fireEvent.click(subcategoryTrigger);

    expect(screen.queryByText(/\+ Nova Subcategoria/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/nome da nova subcategoria/i)
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Metalizados" })).toBeInTheDocument();
  });

  it("mostra os três textos-guia do passo Classificação: categoria, subcategoria e nota sobre Ocasião", () => {
    // Precisa de uma categoria com subcategorias selecionada pro texto-guia
    // de subcategoria aparecer (o bloco só renderiza quando há categoria
    // selecionada, mesma condição usada pro Select de subcategoria).
    const product: Product = {
      id: "p3",
      name: "Balão Metalizado",
      type: "STANDARD_ITEM",
      category: "Balões",
      unit: "un",
      inStock: true,
      disabled: false,
      price: 10,
    };
    render(<ProductFormDialog {...baseProps({}, product)} initialStep="classificacao" />);

    expect(
      screen.getByText(/o catálogo todo costuma ter entre 5 e 12 categorias/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes("a partir de ~6"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ocasião.*não é um campo de categoria/i)
    ).toBeInTheDocument();
  });

  it("edição de produto existente com categoria 'órfã' (fora da lista de categorias) continua aberta, com a categoria antiga visível e sinalizada", () => {
    const product: Product = {
      id: "p2",
      name: "Perfume Importado XPTO",
      type: "STANDARD_ITEM",
      category: "Perfumaria Antiga", // não existe em `categories`
      unit: "un",
      inStock: true,
      disabled: false,
      price: 50,
    };
    render(<ProductFormDialog {...baseProps({}, product)} initialStep="classificacao" />);

    // O formulário abre normalmente (não trava/bloqueia a edição).
    expect(screen.getByText("Editar Produto")).toBeInTheDocument();

    const categoryTrigger = screen.getAllByRole("combobox")[0];
    // O valor exibido no trigger é a categoria antiga, não um placeholder vazio.
    expect(within(categoryTrigger).getByText(/Perfumaria Antiga/)).toBeInTheDocument();

    // O botão "Avançar" não fica desabilitado por causa da categoria órfã —
    // ela conta como uma categoria válida preenchida. Checado ANTES de abrir
    // o dropdown: o Radix Select marca o resto da página com
    // aria-hidden="true" enquanto está aberto, o que tiraria o botão da
    // árvore de acessibilidade que o Testing Library consulta.
    expect(screen.getByRole("button", { name: /Avançar/i })).not.toBeDisabled();

    fireEvent.click(categoryTrigger);
    // A categoria órfã aparece na lista, marcada como fora da lista atual
    // (getAllByText porque o trigger fechado também mostra o mesmo texto).
    expect(
      screen.getAllByText(/Perfumaria Antiga \(fora da lista atual\)/).length
    ).toBeGreaterThan(0);
    // O aviso explicativo também aparece pro admin.
    expect(
      screen.getByText(/não existe mais na lista atual/i)
    ).toBeInTheDocument();
  });
});

describe("ProductFormDialog — passo Classificação (issue #165, esconder tipos exclusivos de kit)", () => {
  // Categoria sem subcategoria (Fitas) mantém o Select de Tipo sempre no
  // índice 1 dos comboboxes (Categoria=0, sem Subcategoria renderizada,
  // Tipo=1) — evita acoplar o teste à quantidade de subcategorias.
  function openTypeSelect() {
    const trigger = screen.getAllByRole("combobox")[1];
    fireEvent.click(trigger);
    return trigger;
  }

  it("com customKitEnabled desligado (padrão), só oferece Item e Fita no Select de Tipo", () => {
    render(<ProductFormDialog {...baseProps()} />);
    openTypeSelect();

    expect(screen.getByRole("option", { name: "Recheio/Item" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fita" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Base/Cesta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Preenchimento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Acessório" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Saco/Embalagem" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Kit Montado" })).not.toBeInTheDocument();
  });

  it("com customKitEnabled ligado, os 4 tipos exclusivos de kit reaparecem no Select de Tipo", () => {
    render(<ProductFormDialog {...baseProps()} customKitEnabled />);
    openTypeSelect();

    expect(screen.getByRole("option", { name: "Recheio/Item" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fita" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Base/Cesta" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Preenchimento" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Acessório" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Saco/Embalagem" })).toBeInTheDocument();
    // ASSEMBLED_KIT continua de fora mesmo com a flag ligada — kit nunca é
    // criado por este formulário, só via kit_recipes/KitBuilderModal.
    expect(screen.queryByRole("option", { name: "Kit Montado" })).not.toBeInTheDocument();
  });

  it("produto existente de tipo exclusivo de kit (FILLER) continua editável com a flag desligada, tipo antigo visível e sinalizado como fora da lista", () => {
    const product: Product = {
      id: "p5",
      name: "Papel Seda",
      type: "FILLER",
      category: "Fitas",
      unit: "un",
      inStock: true,
      disabled: false,
      price: 5,
    };
    render(<ProductFormDialog {...baseProps({}, product)} initialStep="classificacao" />);

    // O formulário abre normalmente, sem travar a edição do produto legado.
    expect(screen.getByText("Editar Produto")).toBeInTheDocument();

    const typeTrigger = screen.getAllByRole("combobox")[1];
    expect(within(typeTrigger).getByText(/Preenchimento/)).toBeInTheDocument();

    // O botão "Avançar" não fica desabilitado por causa do tipo órfão.
    expect(screen.getByRole("button", { name: /Avançar/i })).not.toBeDisabled();

    fireEvent.click(typeTrigger);
    expect(
      screen.getAllByText(/Preenchimento \(fora da lista atual\)/).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/tipo que não aparece mais na lista atual/i)
    ).toBeInTheDocument();
  });
});

describe("ProductFormDialog — passo Classificação (issue #68, tags/coleções manuais)", () => {
  function makeTags(): Tag[] {
    return [
      { id: "dia-das-maes", name: "Dia das Mães", order: 0, active: true },
      { id: "ate-r50", name: "Até R$50", order: 1, active: true },
    ];
  }

  it("mostra mensagem de catálogo vazio quando nenhuma tag foi cadastrada ainda", () => {
    render(<ProductFormDialog {...baseProps()} />);
    expect(
      screen.getByText(/nenhuma tag cadastrada ainda/i)
    ).toBeInTheDocument();
  });

  it("lista as tags do catálogo como chips e alterna a seleção ao clicar (persiste no estado do formulário)", () => {
    render(<ProductFormDialog {...baseProps({}, null, makeTags())} />);

    const chip = screen.getByRole("button", { name: "Dia das Mães" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("produto existente com tag 'órfã' (fora do catálogo atual) mostra a tag antiga marcada e sinalizada", () => {
    const product: Product = {
      id: "p4",
      name: "Kit Festa Junina",
      type: "STANDARD_ITEM",
      category: "Balões",
      unit: "un",
      inStock: true,
      disabled: false,
      price: 20,
      tags: ["Festa Junina"], // não existe em `makeTags()`
    };
    render(
      <ProductFormDialog
        {...baseProps({}, product, makeTags())}
        initialStep="classificacao"
      />
    );

    const orphanChip = screen.getByRole("button", {
      name: /Festa Junina \(fora do catálogo atual\)/,
    });
    expect(orphanChip).toHaveAttribute("aria-pressed", "true");
  });

  it("nunca renderiza uma tag de sistema ('novidades'/'promocao') como opção selecionável, mesmo se existir um doc com esse nome no catálogo", () => {
    const tagsWithSystemNameLeak: Tag[] = [
      ...makeTags(),
      { id: "novidades", name: "novidades", order: 2, active: true },
      { id: "promocao", name: "promocao", order: 3, active: true },
    ];
    render(<ProductFormDialog {...baseProps({}, null, tagsWithSystemNameLeak)} />);

    expect(
      screen.queryByRole("button", { name: "novidades" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "promocao" })
    ).not.toBeInTheDocument();
    // As tags manuais normais continuam disponíveis.
    expect(
      screen.getByRole("button", { name: "Dia das Mães" })
    ).toBeInTheDocument();
  });
});
