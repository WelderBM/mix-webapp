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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Package,
  Loader2,
  MapPin,
  Store,
  CreditCard,
  Banknote,
  ShoppingBag,
  Feather,
  Box,
  SquareStack,
  Gift,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils"; // Importa do utils agora
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DeliveryMethod,
  PaymentMethod,
  PaymentTiming,
  ProductType,
} from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getProductImage } from "@/lib/image-utils"; // Usa o gerenciador de imagens
import { SafeImage } from "../ui/SafeImage";

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
  // CORREÇÃO: Removido 'total' que não existe, usar getCartTotal()
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getCartTotal,
    clearCart,
  } = useCartStore();
  const { getProductById } = useProductStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Address State
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Boa Vista");
  const [uf, setUf] = useState("RR");
  const [isInvalidLocation, setIsInvalidLocation] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("prepaid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  // Novo estado para controlar destino do pagamento PIX
  const [pixPaymentDestination, setPixPaymentDestination] = useState<
    "store" | "carrier"
  >("store");

  // Previously: const [address, setAddress] = useState(""); - REMOVED
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [observation, setObservation] = useState("");

  const getProductName = (id: string | undefined) =>
    id ? getProductById(id)?.name || "Produto Desconhecido" : "N/A";

  useEffect(() => {
    if (deliveryMethod === "delivery") {
      // If delivery is selected, default logic can go here if needed
    }
  }, [deliveryMethod]);

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    setIsInvalidLocation(false); // Reset invalid state on new search

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
          setCity(data.localidade); // Show the wrong city to confirm we found it
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

      // Secondary check just in case
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
                city,
              }
            : null,
        paymentMethod,
        paymentTiming,
        pixPaymentDestination:
          paymentMethod === "pix" ? pixPaymentDestination : null,
        observation: observation.trim() || null,
      };

      const cleanOrderData = JSON.parse(JSON.stringify(orderData));
      await addDoc(collection(db, "orders"), cleanOrderData);

      // --- WhatsApp Message Construction ---
      const totalValue = formatCurrency(getCartTotal());
      let message = "";

      // === PARTE 1: MENSAGEM PARA A ATENDENTE (DETALHADA) ===
      message += `�️ *NOVO PEDIDO - MIX NOVIDADES*\n`;
      message += `👤 *Cliente:* ${customerName}\n`;
      message += `📞 *Telefone:* ${customerPhone}\n\n`;

      message += `📋 *ITENS DO PEDIDO:*\n`;
      items.forEach((item, idx) => {
        let name = "";
        if (item.type === "CUSTOM_BALLOON" && item.balloonDetails) {
          name = `${item.balloonDetails.typeName} ${item.balloonDetails.size}" (${item.balloonDetails.color})`;
        } else {
          name =
            item.type === "CUSTOM_KIT"
              ? `Kit ${item.kitName}`
              : item.product?.name || "Produto";
        }
        message += `${idx + 1}. ${item.quantity}x ${name}\n`;
      });

      message += `\n💰 *VALOR TOTAL DOS ITENS:* ${totalValue}\n`;
      message += `💳 *Pagamento:* ${
        paymentMethod === "pix"
          ? "PIX"
          : paymentMethod === "credit_card"
          ? "Cartão de Crédito"
          : paymentMethod === "debit_card"
          ? "Cartão de Débito"
          : "Dinheiro"
      }\n`;
      if (paymentMethod === "pix") {
        message += `ℹ️ Destino PIX: ${
          pixPaymentDestination === "store" ? "Loja" : "Moto Táxi"
        }\n`;
      }

      if (observation.trim()) {
        message += `📝 *Obs do Cliente:* ${observation}\n`;
      }

      // === PARTE 2: COPY PARA O MOTOBOY (APENAS SE FOR ENTREGA) ===
      if (deliveryMethod === "delivery") {
        message += `\n\n✂️ --- *AREA DE COPY PARA O MOTOBOY* --- ✂️\n\n`;

        message += `🛵 *Entrega Para Mix Novidades*\n\n`;
        message += `👤 *Cliente:* ${customerName}\n`;
        message += `📍 *Endereço de retirada:* Rua Pedro Aldemar Bantim, 945, Doutor Sílvio Botelho\n`;
        message += `📍 *Entregar em:* ${street}, ${number} - ${neighborhood}\n`;
        
        // Lógica de Pagamento Simplificada
        if (paymentMethod === "pix" && pixPaymentDestination === "store") {
             message += `💰 *Pagamento na loja (Já pago)*\n`;
             message += `⚠️ Motoboy recebe apenas a corrida no destino.`;
        } else {
             message += `💰 *Pagamento no destino (Cobrar: ${totalValue})*\n`;
             message += `⚠️ Item: ${totalValue} + Corrida.`;
        }
        }

        // CONTATO
        message += `\n📞 *CONTATO:* ${customerPhone}`;
      } else {
        message += `\n⚠️ *CLIENTE IRÁ RETIRAR NA LOJA*`;
      }

      const phoneNumber =
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5595984244194";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      clearCart();
      closeCart();
      window.open(whatsappUrl, "_blank");
      toast.success("Pedido enviado!");
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao processar pedido.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleContinueShopping = () => {
    closeCart();
  };

  if (!isMounted) return null;

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-slate-50 p-0 h-full">
        <SheetHeader className="p-6 bg-white border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="text-purple-600" /> Seu Carrinho
            <span className="ml-auto text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {items.length}
            </span>
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
            {/* Substituído ScrollArea por div nativa para melhor UX mobile */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="p-6 space-y-4 pb-48">
                {" "}
                {/* Aumentado padding bottom */}
                {items.map((item) => {
                  const imageUrl = getProductImage(
                    item.product?.imageUrl,
                    item.product?.type || "DEFAULT"
                  );
                  const itemPrice =
                    item.kitTotalAmount && item.kitTotalAmount > 0
                      ? item.kitTotalAmount
                      : (item.product?.price || 0) * item.quantity;

                  return (
                    <div
                      key={item.cartId}
                      className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 relative"
                    >
                      <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border">
                        <SafeImage
                          src={imageUrl}
                          name={item.product?.name}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-2">
                          {item.type === "CUSTOM_BALLOON" && item.balloonDetails
                            ? `${item.balloonDetails.typeName} - ${item.balloonDetails.size}"`
                            : item.type === "CUSTOM_KIT"
                            ? `Kit: ${item.kitName}`
                            : item.product?.name}
                        </h4>
                        {item.type === "CUSTOM_BALLOON" &&
                          item.balloonDetails && (
                            <p className="text-xs text-slate-500 mt-1">
                              Cor: {item.balloonDetails.color} |{" "}
                              {item.balloonDetails.unitsPerPackage} un/pac
                            </p>
                          )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-sm text-primary">
                            {formatCurrency(itemPrice)}
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Controles de quantidade para simples e balões */}
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

              {/* Formulário Resumido */}
              <div className="px-6 pb-48 space-y-4">
                {" "}
                {/* Padding extra aqui também */}
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
                  />
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
                      <SelectItem value="credit_card">
                        💳 Cartão de Crédito
                      </SelectItem>
                      <SelectItem value="debit_card">
                        💳 Cartão de Débito
                      </SelectItem>
                      <SelectItem value="cash">💵 Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentMethod === "pix" && (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Label className="text-blue-800">
                      Para quem você vai fazer o PIX?
                    </Label>
                    <RadioGroup
                      value={pixPaymentDestination}
                      onValueChange={(v: "store" | "carrier") =>
                        setPixPaymentDestination(v)
                      }
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
                  <Label>Entrega</Label>
                  <RadioGroup
                    value={deliveryMethod}
                    onValueChange={(v: DeliveryMethod) => setDeliveryMethod(v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup">Retirar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery">Entrega</Label>
                    </div>
                  </RadioGroup>
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
                                if (value.length > 8) value = value.slice(0, 8);
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
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Observação (Opcional)</Label>
                  <Textarea
                    placeholder="Ex: Ponto de referência, troco para R$ 50, deixar na portaria..."
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
                  {formatCurrency(getCartTotal())}
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
  );
}
