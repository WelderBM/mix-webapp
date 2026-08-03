"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  ShoppingCart,
  MessageCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DeliveryMethod, PaymentMethod, PaymentTiming } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getProductImage } from "@/lib/image-utils";
import {
  getCartItemTotal,
  getCartItemUnavailableReason,
  sumCartItemTotals,
} from "@/lib/cart-pricing";
import { isSealedRibbonRoll, getEffectiveUnitLabel } from "@/lib/ribbon-pricing";
import { SafeImage } from "../ui/SafeImage";
import { OrderSuccessModal } from "@/components/features/OrderSuccessModal";

// Componente CartIcon EXPORTADO para uso no Navbar
export function CartIcon() {
  const { items, openCart } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const count = isMounted
    ? items.reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
      <ShoppingCart className="h-5 w-5 text-slate-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Button>
  );
}

export function CartSidebar() {
  const router = useRouter();
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getCartTotal,
    clearCart,
  } = useCartStore();
  const { getProductById, allProducts, isLoading: isLoadingProducts } =
    useProductStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Address State
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [addressReference, setAddressReference] = useState("");
  const [city, setCity] = useState("Boa Vista");
  const [uf, setUf] = useState("RR");
  const [isInvalidLocation, setIsInvalidLocation] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("prepaid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cashChangeFor, setCashChangeFor] = useState("");

  const [pixPaymentDestination, setPixPaymentDestination] = useState<
    "store" | "carrier"
  >("store");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [observation, setObservation] = useState("");

  // "Para quem paga" só faz sentido em Entrega (moto-táxi). Na Retirada
  // esse valor fica oculto na UI e precisa ficar travado em "store" pra não
  // vazar um "carrier" residual (selecionado antes de voltar pra Retirar)
  // nem na validação nem na mensagem de WhatsApp (#72).
  useEffect(() => {
    if (deliveryMethod === "pickup" && pixPaymentDestination !== "store") {
      setPixPaymentDestination("store");
    }
  }, [deliveryMethod, pixPaymentDestination]);

  // "Troco para quanto?" só existe quando o método é Dinheiro — limpa o
  // valor ao trocar de método pra não sobrar residual escondido no payload.
  useEffect(() => {
    if (paymentMethod !== "cash" && cashChangeFor !== "") {
      setCashChangeFor("");
    }
  }, [paymentMethod, cashChangeFor]);

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    setIsInvalidLocation(false);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );
      const data = await response.json();

      if (!data.erro) {
        if (data.localidade !== "Boa Vista" || data.uf !== "RR") {
          setIsInvalidLocation(true);
          setStreet("");
          setNeighborhood("");
          setCity(data.localidade);
          setUf(data.uf);
          toast.error("Entregas apenas para Boa Vista - RR");
        } else {
          setStreet(data.logradouro);
          setNeighborhood(data.bairro);
          setCity(data.localidade);
          setUf(data.uf);
          setIsInvalidLocation(false);
        }
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // Carrinho pode ter sobrevivido de uma sessão anterior (persiste em
    // localStorage) com um item que ficou indisponível nesse meio tempo —
    // barra aqui, antes de gravar o pedido, em vez de deixar estourar depois
    // do addDoc (pedido já criado, mensagem de WhatsApp que quebra no meio).
    if (!isLoadingProducts) {
      const reason = items
        .map((item) => getCartItemUnavailableReason(item, allProducts))
        .find((r) => r != null);
      if (reason) {
        toast.error(`${reason} Remova esse item para continuar.`);
        return;
      }
    }

    if (!customerName.trim()) {
      toast.warning("Por favor, digite seu nome.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 8) {
      toast.warning("Por favor, digite um telefone válido para contato.");
      return;
    }

    if (deliveryMethod === "delivery") {
      if (!street.trim() || !number.trim() || !neighborhood.trim()) {
        toast.warning(
          "Por favor, preencha o endereço completo (Rua, Número e Bairro)."
        );
        return;
      }

      if (isInvalidLocation) {
        toast.error(
          "Endereço fora da área de entrega permitida (Boa Vista - RR)."
        );
        return;
      }

      if (city !== "Boa Vista" || uf !== "RR") {
        setIsInvalidLocation(true);
        toast.error("Desculpe, realizamos entregas apenas em Boa Vista - RR.");
        return;
      }
    }

    setIsCheckingOut(true);

    try {
      const fullAddress = `${street}, ${number}, ${neighborhood} - ${city}`;
      const orderData = {
        createdAt: new Date().toISOString(),
        total: getCartTotal(),
        status: "pending",
        items: items,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryMethod,
        address: deliveryMethod === "delivery" ? fullAddress : null,
        addressDetails:
          deliveryMethod === "delivery"
            ? {
                cep,
                street,
                number,
                neighborhood,
                city,
                reference: addressReference.trim() || null,
              }
            : null,
        paymentMethod,
        paymentTiming,
        // "Para quem paga" só existe em Entrega — na Retirada o estado já
        // fica travado em "store" pelo effect acima, mas o guard aqui é
        // explícito pra não depender só disso.
        pixPaymentDestination:
          paymentMethod === "pix" && deliveryMethod === "delivery"
            ? pixPaymentDestination
            : null,
        // "Troco para quanto" só existe quando o método é Dinheiro.
        changeFor:
          paymentMethod === "cash" ? cashChangeFor.trim() || null : null,
        observation: observation.trim() || null,
      };

      const cleanOrderData = JSON.parse(JSON.stringify(orderData));
      const docRef = await addDoc(collection(db, "orders"), cleanOrderData);

      localStorage.setItem("lastOrderId", docRef.id);

      // --- WhatsApp Message Construction ---
      const totalValue = formatCurrency(getCartTotal());
      let message = "";

      message += `NOVO PEDIDO - MIX NOVIDADES\n\n`;
      message += `ID: ${docRef.id.slice(0, 8).toUpperCase()}\n`;
      message += `Cliente: ${customerName}\n`;
      message += `Tel: ${customerPhone}\n\n`;

      message += `ITENS:\n`;
      items.forEach((item) => {
        let name = "";
        if (item.type === "CUSTOM_BALLOON" && item.balloonDetails) {
          name = `${item.balloonDetails.typeName} ${item.balloonDetails.size}" (${item.balloonDetails.color})`;
        } else {
          name =
            item.type === "CUSTOM_KIT"
              ? `Kit ${item.kitName}`
              : item.product?.name || "Produto";
        }

        let variation = "";
        if (item.selectedVariant) {
          variation = ` (${item.selectedVariant.type}: ${item.selectedVariant.name})`;
        } else if (item.selectedImageLabel) {
          variation = ` (${item.selectedImageLabel})`;
        }

        const itemPrice = getCartItemTotal(item);

        // Formato: 1x Nome (Variação) - R$ 10,00
        message += `${item.quantity}x ${name}${variation} - ${formatCurrency(
          itemPrice
        )}\n`;
      });

      message += `\nPagamento: ${
        paymentMethod === "pix"
          ? "PIX"
          : paymentMethod === "credit_card"
          ? "Cartão de Crédito"
          : paymentMethod === "debit_card"
          ? "Cartão de Débito"
          : "Dinheiro"
      }`;

      // Destino do PIX só é relevante em Entrega (loja x moto-táxi); na
      // Retirada é sempre a loja e não precisa aparecer na mensagem.
      if (paymentMethod === "pix" && deliveryMethod === "delivery") {
        message += ` (Destino: ${
          pixPaymentDestination === "store" ? "Loja" : "Moto Táxi"
        })`;
      }

      if (paymentMethod === "cash" && cashChangeFor.trim()) {
        message += ` (Troco para R$ ${cashChangeFor.trim()})`;
      }

      message += `\nEntrega: ${
        deliveryMethod === "delivery" ? "Entrega" : "Retirada no Local"
      }\n`;

      if (deliveryMethod === "delivery") {
        message += `Endereço: ${street}, ${number} - ${neighborhood}\n`;
        if (addressReference.trim()) {
          message += `Referência: ${addressReference.trim()}\n`;
        }
      }

      if (observation.trim()) {
        message += `Obs: ${observation}\n`;
      }

      // Adiciona link de rastreamento
      const trackingUrl = `${window.location.origin}/meu-pedido?id=${docRef.id}`;
      message += `\nAcompanhamento: ${trackingUrl}`;

      const phoneNumber =
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5595984244194";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      clearCart();
      closeCart();
      window.open(whatsappUrl, "_blank");
      setShowSuccessModal(true);
      toast.success("Pedido enviado!");
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao processar pedido.");
    } finally {
      setIsCheckingOut(false);
    }
  };


  if (!isMounted) return null;

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
        <SheetContent className="flex flex-col w-full sm:max-w-md bg-slate-50 p-0 h-full">
          <SheetHeader className="p-6 bg-white border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="text-purple-600" /> Seu Carrinho
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <ShoppingCart size={40} className="text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-700">
                Carrinho vazio
              </h3>
              <Button variant="outline" onClick={closeCart}>
                Voltar a Comprar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-6 space-y-4 pb-28">
                  {items.map((item) => {
                    const imageUrl = getProductImage(
                      item.selectedVariant?.imageUrl ||
                        item.selectedImageUrl ||
                        item.product?.imageUrl,
                      item.product?.type || "DEFAULT"
                    );
                    const unavailableReason = isLoadingProducts
                      ? null
                      : getCartItemUnavailableReason(item, allProducts);
                    const itemPrice = unavailableReason
                      ? 0
                      : getCartItemTotal(item);

                    const isRibbon = item.product?.type === "RIBBON";
                    const isSealed = isSealedRibbonRoll(item.product);
                    const unitLabel = item.product ? getEffectiveUnitLabel(item.product) : "un";

                    return (
                      <div
                        key={item.cartId}
                        className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 relative"
                      >
                        <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border">
                          <SafeImage
                            src={imageUrl}
                            name={item.product?.name}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                          {isRibbon && (
                            <div
                              className={cn(
                                "absolute bottom-0 inset-x-0 py-0.5 text-[9px] font-bold text-center backdrop-blur-xs truncate leading-none z-10",
                                isSealed
                                  ? "bg-amber-950/80 text-amber-200"
                                  : "bg-emerald-950/80 text-emerald-200"
                              )}
                            >
                              {isSealed ? "Rolo Fechado" : "Fita Aberta"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <h4 className="font-medium text-slate-800 text-sm line-clamp-2">
                            {item.type === "CUSTOM_BALLOON" &&
                            item.balloonDetails
                              ? `${item.balloonDetails.typeName} - ${item.balloonDetails.size}"`
                              : item.type === "CUSTOM_KIT"
                              ? `Kit: ${item.kitName}`
                              : item.product?.name}
                          </h4>
                          {isRibbon && (
                            <p
                              className={cn(
                                "text-xs font-semibold px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                                isSealed
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              )}
                            >
                              {isSealed
                                ? `Rolo fechado (${item.product?.ribbonInventory?.totalRollMeters || 0}m)`
                                : "Fita aberta (por metro)"}
                            </p>
                          )}
                          {item.selectedVariant ? (
                            <p className="text-xs font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                              {item.selectedVariant.type}:{" "}
                              {item.selectedVariant.name}
                            </p>
                          ) : (
                            item.selectedImageLabel && (
                              <p className="text-xs font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                                Opção: {item.selectedImageLabel}
                              </p>
                            )
                          )}
                          {item.type === "CUSTOM_BALLOON" &&
                            item.balloonDetails && (
                              <p className="text-xs text-slate-500 mt-1">
                                Cor: {item.balloonDetails.color} |{" "}
                                {item.balloonDetails.unitsPerPackage} un/pac
                              </p>
                            )}
                          {unavailableReason && (
                            <p className="flex items-center gap-1 text-xs font-medium text-red-600 mt-2">
                              <AlertTriangle size={13} className="shrink-0" />
                              {unavailableReason} Remova pra continuar.
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-sm text-primary">
                              {unavailableReason
                                ? "—"
                                : formatCurrency(itemPrice)}
                            </p>
                            <div className="flex items-center gap-2">
                              {(item.type === "SIMPLE" ||
                                item.type === "CUSTOM_BALLOON") && (
                                <div className="flex items-center border rounded-md">
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.cartId,
                                        item.quantity - 1
                                      )
                                    }
                                    className="px-2 hover:bg-slate-100"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs px-1">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.cartId,
                                        item.quantity + 1
                                      )
                                    }
                                    className="px-2 hover:bg-slate-100"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.cartId)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="h-px bg-slate-200 mx-6 mb-6" />

                <div className="px-6 pb-28 space-y-4">
                  <div className="space-y-2">
                    <Label>Seu Nome</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seu Telefone / WhatsApp *</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length > 11) value = value.slice(0, 11);

                        if (value.length > 2) {
                          value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                        }
                        if (value.length > 9) {
                          value = `${value.slice(0, 10)}-${value.slice(10)}`;
                        }
                        setCustomerPhone(value);
                      }}
                      placeholder="(99) 99999-9999"
                      className="bg-white"
                      maxLength={15}
                      type="tel"
                      inputMode="numeric"
                    />
                  </div>

                  {/* Decisão-mãe: Retirar x Entrega decide se endereço e
                      "para quem paga" existem na tela. Sobe pra logo após
                      o contato e vira toggle segmentado (pill) — é a escolha
                      binária mais tocada da tela, alvo de toque grande (#72). */}
                  <div className="space-y-2">
                    <Label>Entrega</Label>
                    <div
                      role="radiogroup"
                      aria-label="Forma de entrega"
                      className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={deliveryMethod === "pickup"}
                        onClick={() => setDeliveryMethod("pickup")}
                        className={cn(
                          "h-11 rounded-md text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1",
                          deliveryMethod === "pickup"
                            ? "bg-white text-purple-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Retirar
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={deliveryMethod === "delivery"}
                        onClick={() => setDeliveryMethod("delivery")}
                        className={cn(
                          "h-11 rounded-md text-sm font-semibold transition-colors",
                          deliveryMethod === "delivery"
                            ? "bg-white text-purple-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Entrega
                      </button>
                    </div>

                    {deliveryMethod === "delivery" && (
                      <div
                        className={cn(
                          "space-y-3 mt-3 p-3 rounded-lg border transition-colors",
                          isInvalidLocation
                            ? "bg-red-50 border-red-200"
                            : "bg-slate-50 border-slate-200"
                        )}
                      >
                        {isInvalidLocation && (
                          <div className="p-2 mb-2 text-xs text-red-600 bg-red-100 rounded border border-red-200 font-medium text-center">
                            ⚠️ Entregas indisponíveis para esta região. <br />{" "}
                            Apenas Boa Vista - RR.
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-1">
                            <Label className="text-xs">CEP</Label>
                            <div className="relative">
                              <Input
                                value={cep}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, "");
                                  if (value.length > 8)
                                    value = value.slice(0, 8);
                                  if (value.length > 5) {
                                    value = `${value.slice(0, 5)}-${value.slice(
                                      5
                                    )}`;
                                  }
                                  setCep(value);
                                }}
                                onBlur={handleCepBlur}
                                placeholder="00000-000"
                                className={cn(
                                  "bg-white h-9",
                                  isInvalidLocation &&
                                    "border-red-300 ring-offset-red-100"
                                )}
                                maxLength={9}
                                inputMode="numeric"
                              />
                              {isLoadingCep && (
                                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-slate-400" />
                              )}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Label className="text-xs">Número</Label>
                            <Input
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              placeholder="Nº"
                              disabled={isInvalidLocation}
                              className="bg-white h-9"
                              inputMode="numeric"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Rua</Label>
                          <Input
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            placeholder="Nome da rua"
                            disabled={isInvalidLocation}
                            className="bg-white h-9"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Bairro</Label>
                          <Input
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            placeholder="Bairro"
                            disabled={isInvalidLocation}
                            className="bg-white h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Cidade (Fixo)</Label>
                          <Input
                            value={`${city} - ${uf}`}
                            readOnly
                            className={cn(
                              "h-9 bg-slate-100 text-slate-500 cursor-not-allowed",
                              isInvalidLocation && "text-red-500 font-medium"
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">
                            Ponto de referência (Opcional)
                          </Label>
                          <Input
                            value={addressReference}
                            onChange={(e) =>
                              setAddressReference(e.target.value)
                            }
                            placeholder="Ex: Perto do mercado, portão azul..."
                            disabled={isInvalidLocation}
                            className="bg-white h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v: any) => setPaymentMethod(v)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">💠 PIX</SelectItem>
                        <SelectItem
                          value="credit_card"
                          disabled={pixPaymentDestination === "carrier"}
                        >
                          💳 Cartão de Crédito
                        </SelectItem>
                        <SelectItem
                          value="debit_card"
                          disabled={pixPaymentDestination === "carrier"}
                        >
                          💳 Cartão de Débito
                        </SelectItem>
                        <SelectItem value="cash">💵 Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    {pixPaymentDestination === "carrier" && (
                      <p className="text-xs text-blue-600 mt-1">
                        * Moto Táxi aceita apenas <b>PIX</b> ou <b>Dinheiro</b>.
                      </p>
                    )}
                    {paymentMethod === "cash" && (
                      <div className="space-y-1 mt-2">
                        <Label className="text-xs">
                          Troco para quanto? (Opcional)
                        </Label>
                        <Input
                          value={cashChangeFor}
                          onChange={(e) => setCashChangeFor(e.target.value)}
                          placeholder="Ex: R$ 50"
                          className="bg-white h-9"
                          inputMode="numeric"
                        />
                      </div>
                    )}
                  </div>

                  {/* Só existe em Entrega — na Retirada não há moto-táxi,
                      então a pergunta é ruído puro e o valor fica travado
                      internamente em "store" (ver effect acima, #72). */}
                  {deliveryMethod === "delivery" && (
                    <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <Label className="text-blue-800">
                        Para quem você vai realizar o pagamento?
                      </Label>
                      <RadioGroup
                        value={pixPaymentDestination}
                        onValueChange={(v: "store" | "carrier") => {
                          setPixPaymentDestination(v);
                          if (
                            v === "carrier" &&
                            paymentMethod !== "cash" &&
                            paymentMethod !== "pix"
                          ) {
                            setPaymentMethod("pix");
                          }
                        }}
                        className="flex flex-col gap-2 mt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="store"
                            id="pay-store"
                            className="text-blue-600 border-blue-400"
                          />
                          <Label
                            htmlFor="pay-store"
                            className="font-normal cursor-pointer"
                          >
                            Pagar para a <b>Loja</b> (Chave da Loja)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="carrier"
                            id="pay-carrier"
                            className="text-blue-600 border-blue-400"
                          />
                          <Label
                            htmlFor="pay-carrier"
                            className="font-normal cursor-pointer"
                          >
                            Pagar para o <b>Moto Táxi</b> (Na entrega)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Observação (Opcional)</Label>
                    <Textarea
                      placeholder="Ex: Deixar na portaria, embrulhar pra presente..."
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      className="bg-white min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="p-6 bg-white border-t space-y-3 block shrink-0 z-10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(sumCartItemTotals(items))}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
                >
                  {isCheckingOut ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="mr-2" /> Finalizar Pedido
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
}
