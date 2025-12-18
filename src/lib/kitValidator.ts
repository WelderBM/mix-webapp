// src/lib/kitValidator.ts
import { Product } from "../types";

export const KitValidator = {
  /**
   * Calcula o Perímetro (Circunferência) da base.
   * Usado para saber se o saco (wrapper) consegue "abraçar" a cesta/caixa.
   */
  calculateBasePerimeter: (base: Product) => {
    // Se não tiver medidas, assume um perímetro baseado no CapacityRef (P=40, M=60, G=80)
    const width =
      base.width ||
      (base.capacityRef === "P" ? 15 : base.capacityRef === "M" ? 20 : 25);
    const depth =
      base.depth ||
      (base.capacityRef === "P" ? 15 : base.capacityRef === "M" ? 20 : 25);
    return (width + depth) * 2;
  },

  /**
   * Valida se o Saco serve na Base.
   * Regra: A largura do saco (quando achatado) vezes 2 é a sua boca total.
   * Deve ser maior que o perímetro da base + folga de 5cm.
   */
  canWrapperFitBase: (wrapper: Product, base: Product) => {
    const perimeter = KitValidator.calculateBasePerimeter(base);
    const wrapperWidth = wrapper.width || 0;

    if (wrapperWidth === 0) return true; // Se o saco não tem medida, não bloqueia (para não quebrar o fluxo)

    return wrapperWidth * 2 >= perimeter + 5;
  },

  /**
   * Valida se a Caixa fecha.
   * Regra: O item mais alto do kit não pode ser maior que a altura (depth/height) da caixa.
   */
  canBoxClose: (
    items: { product: Product; quantity: number }[],
    base: Product
  ) => {
    if (items.length === 0) return true;

    // Pega a maior altura entre os itens selecionados
    const maxHeightItem = Math.max(...items.map((i) => i.product.height || 0));
    const baseHeight = base.height || 999; // Se for cesta aberta, altura é "infinita"

    return baseHeight >= maxHeightItem;
  },

  /**
   * Taxa de Serviço Dinâmica.
   * Quanto mais itens, mais tempo de montagem e organização.
   */
  calculateServiceFee: (itemCount: number) => {
    if (itemCount === 0) return 0;
    if (itemCount <= 3) return 5.0;
    if (itemCount <= 8) return 10.0;
    return 15.0;
  },
};
