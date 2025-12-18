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
  const count = items.reduce((acc, item) => acc + item.quantity, 0);

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

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("prepaid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");

  const getProductName = (id: string | undefined) =>
    id ? getProductById(id)?.name || "Produto Desconhecido" : "N/A";

  useEffect(() => {
    if (deliveryMethod === "delivery") {
      if (paymentMethod === "card") setPaymentMethod("pix");
    }
  }, [deliveryMethod, paymentMethod]);

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
      await addDoc(collection(db, "orders"), cleanOrderData);

      // Montagem da mensagem do WhatsApp (Lógica simplificada para brevidade)
      let message = `*Novo Pedido*\n👤 ${customerName || "Cliente"}\n`;
      items.forEach((item, idx) => {
        const name =
          item.type === "CUSTOM_KIT"
            ? `Kit ${item.kitName}`
            : item.product?.name;
        message += `${idx + 1}. ${item.quantity}x ${name}\n`;
      });
      message += `\n*Total: ${formatCurrency(getCartTotal())}*`;

      if (deliveryMethod === "delivery") message += `\n📍 Entrega: ${address}`;
      else message += `\n📍 Retirada na Loja`;

      const whatsappUrl = `https://wa.me/5595991111111?text=${encodeURIComponent(
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
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
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
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-2">
                          {item.type === "CUSTOM_KIT"
                            ? `Kit: ${item.kitName}`
                            : item.product?.name}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-sm text-primary">
                            {formatCurrency(itemPrice)}
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Controles de quantidade simplificados */}
                            {item.type === "SIMPLE" && (
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

              <div className="h-px bg-slate-200 my-6" />

              {/* Formulário Resumido */}
              <div className="space-y-4">
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
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Endereço de entrega..."
                      className="bg-white mt-2"
                    />
                  )}
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="p-6 bg-white border-t space-y-3 block flex-shrink-0 z-10 shadow-lg">
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
