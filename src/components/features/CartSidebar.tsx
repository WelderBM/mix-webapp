"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  QrCode,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DeliveryMethod, PaymentMethod, PaymentTiming } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; // Importar o Router do Next.js

export function CartSidebar() {
  const router = useRouter(); // Inicializa o Router
  const { items, isCartOpen, closeCart, removeItem, getCartTotal, clearCart } =
    useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("prepaid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (deliveryMethod === "delivery") {
      if (paymentMethod === "card") setPaymentMethod("pix");
    }
  }, [deliveryMethod, paymentMethod]);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (deliveryMethod === "delivery" && address.trim().length < 5) {
      toast.warning("Por favor, digite o endereço completo para entrega.");
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderData = {
        createdAt: Date.now(),
        total: getCartTotal(),
        status: "pending",
        items: items,
        customerName: customerName || "Cliente do Site",
        deliveryMethod,
        address: deliveryMethod === "delivery" ? address : null,
        paymentMethod,
        paymentTiming,
      };

      const cleanOrderData = JSON.parse(JSON.stringify(orderData));

      const docRef = await addDoc(collection(db, "orders"), cleanOrderData);
      const shortId = docRef.id.slice(0, 5).toUpperCase();

      let message = `*Novo Pedido #${shortId}*\n--------------------------------\n`;
      items.forEach((item, index) => {
        if (item.type === "SIMPLE" && item.product) {
          message += `${index + 1}. ${item.quantity}x ${item.product.name} ${
            item.selectedVariant ? `(${item.selectedVariant.name})` : ""
          }\n`;
        } else if (item.type === "CUSTOM_KIT" && item.kitComponents) {
          message += `${index + 1}. 📦 ${item.kitName}\n`;
        } else if (item.type === "CUSTOM_RIBBON" && item.ribbonDetails) {
          // Inclui detalhes do laço personalizado
          message += `${index + 1}. 🎀 ${item.quantity}x Laço Pronto (${
            item.ribbonDetails.tamanhoLaco
          } - ${item.ribbonDetails.fitaSelecionada.name})\n`;
        }
      });

      message += `\n*Total Produtos: ${formatMoney(
        getCartTotal()
      )}*\n*(Taxa de entrega a combinar)*\n--------------------------------\n`;

      if (deliveryMethod === "pickup") {
        message += `📍 *Retirada na Loja*\n`;
      } else {
        message += `🛵 *Entrega*\n📍 ${address}\n`;
      }

      const methodLabels = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };
      message += `💲 *Pagamento:* ${methodLabels[paymentMethod]}\n`;
      if (paymentTiming === "prepaid")
        message += `✅ *Vou pagar AGORA (Enviar chave Pix)*\n`;
      else message += `🚚 *Vou pagar NA ENTREGA*\n`;

      if (customerName) message += `\n👤 *Cliente:* ${customerName}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/5595984244194?text=${encodedMessage}`;

      clearCart();
      closeCart();
      window.open(whatsappUrl, "_blank");
      toast.success("Pedido enviado! Verifique seu WhatsApp.");
    } catch (error) {
      console.error("Erro completo:", error);
      // @ts-ignore
      toast.error(`Erro ao processar: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // NOVA FUNÇÃO: Voltar para Home
  const handleContinueShopping = () => {
    closeCart();
    router.push("/");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-slate-50 p-0 h-full">
        <SheetHeader className="p-6 bg-white border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="text-purple-600" /> Seu Carrinho{" "}
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
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Lista de Itens */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.cartId}
                      className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 relative"
                    >
                      <div className="relative w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.type === "SIMPLE" ? (
                          <Image
                            src={
                              item.selectedVariant?.imageUrl ||
                              item.product?.imageUrl ||
                              ""
                            }
                            alt={`Miniatura de ${
                              item.product?.name || item.kitName
                            } no carrinho`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        {/* Nome do Item */}
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-1">
                          {item.type === "SIMPLE"
                            ? item.product?.name
                            : item.kitName}
                        </h4>

                        {/* Detalhes de Kits/Laços */}
                        {item.type === "CUSTOM_RIBBON" && (
                          <p className="text-xs text-purple-600 mt-0.5">
                            Laço {item.ribbonDetails?.tamanhoLaco} (
                            {item.ribbonDetails?.tipoLaco})
                          </p>
                        )}
                        {item.type === "CUSTOM_KIT" && (
                          <p className="text-xs text-purple-600 mt-0.5">
                            Kit Personalizado
                          </p>
                        )}

                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500">
                            Qtd: {item.quantity}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {/* Preço formatado é o kitTotalAmount (preço final) para itens customizados */}
                            {item.type === "SIMPLE"
                              ? formatMoney(
                                  (item.selectedVariant?.price ||
                                    item.product?.price ||
                                    0) * item.quantity
                                )
                              : formatMoney(item.kitTotalAmount || 0)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.cartId)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-slate-200" />

                <div className="space-y-3">
                  <Label>Seu Nome</Label>
                  <Input
                    placeholder="Ex: Maria da Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 font-bold flex items-center gap-2">
                    <MapPin size={16} /> Forma de Entrega
                  </Label>
                  <RadioGroup
                    value={deliveryMethod}
                    onValueChange={(v) =>
                      setDeliveryMethod(v as DeliveryMethod)
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem
                        value="pickup"
                        id="pickup"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="pickup"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-3 hover:bg-slate-50 peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:text-purple-700 cursor-pointer text-center h-full"
                      >
                        <Store className="mb-2 h-5 w-5" />
                        <span className="text-xs font-semibold">Retirar</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="delivery"
                        id="delivery"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="delivery"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-3 hover:bg-slate-50 peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:text-purple-700 cursor-pointer text-center h-full"
                      >
                        <MapPin className="mb-2 h-5 w-5" />
                        <span className="text-xs font-semibold">Entrega</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {deliveryMethod === "delivery" && (
                    <div className="animate-in slide-in-from-top-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                      Taxa de entrega será calculada no WhatsApp.
                      <Input
                        placeholder="Endereço Completo..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-white mt-2 border-yellow-200"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-700 font-bold flex items-center gap-2">
                    <CreditCard size={16} /> Pagamento
                  </Label>
                  {deliveryMethod === "delivery" && (
                    <RadioGroup
                      value={paymentTiming}
                      onValueChange={(v) =>
                        setPaymentTiming(v as PaymentTiming)
                      }
                      className="grid grid-cols-2 gap-3 mb-2"
                    >
                      <div>
                        <RadioGroupItem
                          value="prepaid"
                          id="prepaid"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="prepaid"
                          className="flex items-center justify-center rounded-md border bg-white p-2 text-xs hover:bg-slate-50 peer-data-[state=checked]:bg-purple-50 peer-data-[state=checked]:border-purple-600 cursor-pointer"
                        >
                          Pagar Agora (Pix)
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="on_delivery"
                          id="on_delivery"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="on_delivery"
                          className="flex items-center justify-center rounded-md border bg-white p-2 text-xs hover:bg-slate-50 peer-data-[state=checked]:bg-purple-50 peer-data-[state=checked]:border-purple-600 cursor-pointer"
                        >
                          Pagar na Entrega
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600">Pix</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <Banknote size={14} className="text-green-600" />{" "}
                          Dinheiro
                        </div>
                      </SelectItem>
                      {deliveryMethod === "pickup" && (
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard size={14} className="text-blue-600" />{" "}
                            Cartão
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <SheetFooter className="p-6 bg-white border-t space-y-3 block flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500">Total Produtos</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatMoney(getCartTotal())}
                </span>
              </div>

              {/* BOTÃO PRINCIPAL: Finalizar Pedido */}
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />{" "}
                    Processando...
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} /> Finalizar Pedido
                  </>
                )}
              </Button>

              {/* NOVO BOTÃO: Continuar Comprando */}
              <Button
                onClick={handleContinueShopping}
                variant="ghost"
                className="w-full h-10 text-sm text-purple-600 hover:bg-purple-50 gap-2"
              >
                <ShoppingBag size={16} /> Continuar Comprando
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
