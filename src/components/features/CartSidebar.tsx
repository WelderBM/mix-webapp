"use client";

import { useState } from "react";
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
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DeliveryMethod, PaymentMethod } from "@/lib/types";

export function CartSidebar() {
  const { items, isCartOpen, closeCart, removeItem, getCartTotal, clearCart } =
    useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (deliveryMethod === "delivery" && address.trim().length < 5) {
      alert("Por favor, digite o endereço completo para entrega.");
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
        address: deliveryMethod === "delivery" ? address : undefined,
        paymentMethod,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docRef = await addDoc(collection(db, "orders"), orderData as any);
      const shortId = docRef.id.slice(0, 5).toUpperCase();
      let message = `*Novo Pedido #${shortId}*\n--------------------------------\n`;
      items.forEach((item, index) => {
        if (item.type === "SIMPLE" && item.product) {
          message += `${index + 1}. ${item.quantity}x ${item.product.name} ${
            item.selectedVariant ? `(${item.selectedVariant.name})` : ""
          }\n`;
        } else if (item.type === "CUSTOM_KIT" && item.kitComponents) {
          message += `${index + 1}. 📦 ${item.kitName}\n`;
        }
      });
      message += `\n*Total: ${formatMoney(
        getCartTotal()
      )}*\n--------------------------------\n`;
      if (deliveryMethod === "pickup") {
        message += `📍 *Vou retirar na loja*\n`;
      } else {
        message += `🛵 *Entrega para:*\n${address}\n`;
      }
      const paymentLabel = {
        pix: "Pix",
        card: "Cartão (Link/Maquininha)",
        cash: "Dinheiro",
      };
      message += `💲 *Pagamento:* ${paymentLabel[paymentMethod]}\n`;
      if (customerName) message += `👤 *Cliente:* ${customerName}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/5595984244194?text=${encodedMessage}`;
      clearCart();
      closeCart();
      window.open(whatsappUrl, "_blank");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-slate-50 p-0">
        <SheetHeader className="p-6 bg-white border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="text-purple-600" /> Seu Carrinho
            <span className="ml-auto text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {items.length} itens
            </span>
          </SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
              <ShoppingCart size={40} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">
              Carrinho vazio
            </h3>
            <Button variant="outline" onClick={closeCart}>
              Voltar a Comprar
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
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
                            alt=""
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
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-1">
                          {item.type === "SIMPLE"
                            ? item.product?.name
                            : item.kitName}
                        </h4>
                        {item.selectedVariant && (
                          <p className="text-xs text-purple-600">
                            {item.selectedVariant.name}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500">
                            Qtd: {item.quantity}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
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
                  <Label className="text-slate-700 font-bold">
                    Seu Nome (Opcional)
                  </Label>
                  <Input
                    placeholder="Ex: Maria da Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 font-bold">Entrega</Label>
                  <RadioGroup
                    value={deliveryMethod}
                    onValueChange={(v: DeliveryMethod) => setDeliveryMethod(v)}
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
                        <span className="text-xs font-semibold">
                          Retirar na Loja
                        </span>
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
                    <div className="animate-in slide-in-from-top-2">
                      <Input
                        placeholder="Rua, Bairro e Número..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-white border-purple-200 focus-visible:ring-purple-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-700 font-bold">Pagamento</Label>
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
                          <span className="font-bold text-green-600">Pix</span>{" "}
                          (Instantâneo)
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <CreditCard size={14} /> Cartão
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <Banknote size={14} /> Dinheiro
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="p-6 bg-white border-t space-y-4 block flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500">Total a pagar</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatMoney(getCartTotal())}
                </span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} /> Enviar Pedido no Zap
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
