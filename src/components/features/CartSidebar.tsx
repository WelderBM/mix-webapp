"use client";

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
import { Trash2, ShoppingCart, MessageCircle, Package } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function CartSidebar() {
  const { items, isCartOpen, closeCart, removeItem, getCartTotal } =
    useCartStore();

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleCheckout = () => {
    let message = "*Olá! Gostaria de confirmar o seguinte pedido:*\n\n";

    items.forEach((item, index) => {
      if (item.type === "SIMPLE" && item.product) {
        message += `${index + 1}. *${item.quantity}x ${
          item.product.name
        }*\n   Valor: ${formatMoney(item.product.price * item.quantity)}\n`;
      } else if (item.type === "CUSTOM_KIT" && item.kitComponents) {
        message += `${index + 1}. *📦 ${item.kitName}*\n`;
        const componentNames = item.kitComponents.map((c) => c.name).join(", ");
        message += `   _Contém: ${componentNames}_\n`;
        message += `   Valor: ${formatMoney(item.kitTotalAmount || 0)}\n`;
      }
      message += "\n";
    });

    message += `*TOTAL FINAL: ${formatMoney(getCartTotal())}*`;
    message += "\n\nAguardo confirmação para pagamento e entrega!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5595984244194?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-slate-50 p-0">
        <SheetHeader className="p-6 bg-white border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="text-purple-600" />
            Seu Carrinho
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
              Seu carrinho está vazio
            </h3>
            <p className="text-slate-500 max-w-xs">
              Adicione produtos da vitrine ou monte um kit personalizado
              incrível.
            </p>
            <Button variant="outline" onClick={closeCart}>
              Voltar a Comprar
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable Area - with fix for button cutoff */}
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.cartId}
                    className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 group relative overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.type === "SIMPLE" ? (
                        <Image
                          src={item.product?.imageUrl || ""}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600">
                          <Package size={24} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-8">
                      {" "}
                      {/* Right padding reserves space for delete button */}
                      <h4 className="font-medium text-slate-800 text-sm leading-tight line-clamp-2">
                        {item.type === "SIMPLE"
                          ? item.product?.name
                          : item.kitName}
                      </h4>
                      {item.type === "CUSTOM_KIT" && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-1">
                          {item.kitComponents?.length} itens inclusos
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.type === "SIMPLE"
                            ? formatMoney(
                                (item.product?.price || 0) * item.quantity
                              )
                            : formatMoney(item.kitTotalAmount || 0)}
                        </span>

                        {item.type === "SIMPLE" && item.quantity > 1 && (
                          <span className="text-xs text-slate-400 bg-slate-50 px-1 rounded">
                            {item.quantity}un
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button - Positioned absolutely to ensure it's always accessible */}
                    <button
                      onClick={() => removeItem(item.cartId)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remover item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="p-6 bg-white border-t space-y-4 block flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-500">Total do Pedido</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatMoney(getCartTotal())}
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg gap-2"
              >
                <MessageCircle size={20} />
                Finalizar no WhatsApp
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
