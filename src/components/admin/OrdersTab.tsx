"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchParamsPatch } from "@/hooks/useSearchParamsPatch";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types/order";
import { CartItem } from "@/types/cart";
import { ProductInfoModal } from "@/components/admin/ProductInfoModal";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  Truck,
  Store,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MessageCircle,
  StickyNote,
  Wallet,
  ImageOff,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

/**
 * Item de pedido clicável (issue #73). Com `product`, abre o
 * `ProductInfoModal` destacando a variante/imagem que o cliente escolheu;
 * sem `product` (kit/fita/balão personalizados), o handler do chamador
 * (`onOpen`) decide o fallback — nunca tenta abrir um produto que não
 * existe. Altura mínima de 44px (`min-h-11`) — alvo de toque recomendado
 * pra mobile (guia "Mobile First"), já que este é um item dentro de um
 * card que também é clicável (expand/collapse), então precisa de
 * `stopPropagation` e de uma área de toque clara e maior que o texto.
 */
function OrderItemRow({
  item,
  onOpen,
}: {
  item: CartItem;
  onOpen: (item: CartItem) => void;
}) {
  const thumbUrl = item.selectedImageUrl || item.product?.imageUrl;
  const name = item.product?.name || item.kitName || "Produto";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(item);
      }}
      className="flex w-full items-start gap-2 text-left text-sm border-b border-slate-100 pb-2 last:border-0 text-slate-700 rounded-md -mx-1 px-1 min-h-11 hover:bg-slate-100 active:bg-slate-200 transition-colors"
    >
      <div className="w-9 h-9 shrink-0 rounded bg-slate-100 overflow-hidden relative border flex items-center justify-center mt-0.5">
        {thumbUrl ? (
          <SafeImage
            src={thumbUrl}
            alt={name}
            name={name}
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : (
          <ImageOff size={14} className="text-slate-300" />
        )}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <span className="font-medium text-slate-800">
          {item.quantity}x {name}
        </span>
        {item.selectedVariant ? (
          <Badge
            variant="outline"
            className="ml-2 text-[10px] h-5 px-1.5 py-0"
          >
            {item.selectedVariant.type}: {item.selectedVariant.name}
          </Badge>
        ) : (
          item.selectedImageLabel && (
            <Badge
              variant="outline"
              className="ml-2 text-[10px] h-5 px-1.5 py-0"
            >
              {item.selectedImageLabel}
            </Badge>
          )
        )}
        {item.type === "CUSTOM_BALLOON" && item.balloonDetails && (
          <p className="text-xs text-slate-500">
            {item.balloonDetails.typeName} - {item.balloonDetails.size}"
          </p>
        )}
      </div>
    </button>
  );
}

export function OrdersTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patchParams = useSearchParamsPatch();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {}
  );

  // Refs para controle de notificação
  const isFirstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs pros cards/linhas de pedido (desktop e mobile escrevem na mesma
  // chave — só um dos dois está visível por vez via CSS, então o último a
  // montar "ganha", sem problema) — usados pra rolar até o pedido do
  // deep-link `?pedido=` depois que ele expande (issue #73).
  const orderRefs = useRef<Map<string, HTMLElement>>(new Map());
  const setOrderRef = (orderId: string) => (el: HTMLElement | null) => {
    if (el) orderRefs.current.set(orderId, el);
    else orderRefs.current.delete(orderId);
  };
  // Evita re-rolar a cada re-render enquanto o `?pedido=` deep-linkado
  // continuar o mesmo; reseta quando o param muda pra outro pedido (ou some).
  const scrolledForPedidoRef = useRef<string | null>(null);
  const lastPedidoRef = useRef<string | null>(null);

  // Verdadeiro só quando O PRÓPRIO OrdersTab empurrou a entrada de histórico
  // pro `?produto=` (clique num item nesta sessão) — nesse caso "fechar" o
  // modal usa router.back() pra desfazer exatamente essa navegação. Se o
  // modal está aberto porque a página já carregou com `?produto=` na URL
  // (link direto/compartilhado), não há entrada própria pra desfazer:
  // fechar precisa só remover o param (replace), senão o back sairia do
  // admin inteiro.
  const pushedProdutoRef = useRef(false);

  // Filtros e Paginação
  const [statusFilter, setStatusFilter] = useState<string>(
    () => searchParams.get("status") || "all"
  );
  // `page` vive na URL (não em estado local) — decisão da issue #73: assim
  // a paginação sobrevive a refresh/compartilhamento/voltar do navegador da
  // mesma forma que `status`/`pedido`, e o gotcha de "pedido deep-linkado
  // numa página > 1" vira só "calcular a página certa e empurrar pra URL"
  // (efeito mais abaixo), sem precisar de um mecanismo de "pular página"
  // separado. Ver docs/ADMIN-URL-STATE.md.
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const goToPage = (page: number) => {
    patchParams({ page: page > 1 ? String(page) : undefined });
  };

  useEffect(() => {
    // Inicializar áudio de notificação
    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    );

    // Solicitar permissão de notificação do navegador
    if (
      typeof Notification !== "undefined" &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission();
    }

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Verificar novos pedidos apenas após o primeiro carregamento
      if (!isFirstLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newOrder = change.doc.data() as Order;

            // Tocar som
            audioRef.current
              ?.play()
              .catch((e) => console.log("Audio auto-play blocked", e));

            // Toast notification
            toast.success(`Novo pedido de ${newOrder.customerName}!`, {
              duration: 10000,
              action: {
                label: "Ver",
                onClick: () => window.focus(),
              },
            });

            // Browser notification (System level)
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("Novo Pedido - Mix Novidades", {
                body: `Cliente: ${
                  newOrder.customerName
                } - Total: ${formatCurrency(newOrder.total)}`,
                icon: "/favicon.ico",
              });
            }
          }
        });
      }

      const ords: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(ords);
      setLoading(false);
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, []);

  // Auto-expande o pedido do deep-link (?pedido=) num efeito, não no corpo
  // do componente: chamar patchParams (Router) durante o render de OrdersTab
  // é o que disparava "Cannot update a component (Router) while rendering a
  // different component (OrdersTab)". Roda de novo quando o param muda (ex:
  // usuário navega para outro link com ?pedido= diferente) ou quando a lista
  // termina de carregar — cobre o deep-link chegando antes do onSnapshot
  // popular `orders`, quando o pedido ainda não existe na lista pra expandir.
  useEffect(() => {
    const pedido = searchParams.get("pedido");
    if (!pedido) return;
    if (!orders.some((o) => o.id === pedido)) return;
    setExpandedOrders((prev) =>
      prev[pedido] ? prev : { ...prev, [pedido]: true }
    );
  }, [searchParams, orders]);

  const toggleExpand = (orderId: string) => {
    // patchParams fica fora do updater de propósito: updaters funcionais
    // rodam de novo durante a fase de render sempre que o React precisa
    // recalcular o estado (ex: replay ao processar a fila de updates) — um
    // efeito colateral lá dentro (aqui, mexer no Router) é um
    // setState-durante-render latente. A decisão pelo closure é segura
    // aqui porque isto é um handler de clique: o estado no closure já é o
    // do render corrente.
    const willExpand = !expandedOrders[orderId];
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
    patchParams({ pedido: willExpand ? orderId : undefined });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    // `page` não reseta sozinho ao trocar o filtro (deixou de ser
    // `useState` local com um `useEffect` de reset — agora é URL pura),
    // então precisa ser limpo explicitamente aqui, senão trocar de filtro
    // estando na página 3 deixa a URL apontando pra uma página que pode
    // nem existir mais no filtro novo.
    patchParams({
      status: value === "all" ? undefined : value,
      page: undefined,
    });
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      toast.success("Status atualizado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  const copyDeliveryInfo = (order: Order) => {
    // Definir a instrução de pagamento com base no método e destino
    let paymentInstruction = "";

    if (order.paymentMethod === "pix") {
      // Se tiver a info save no pedido, usa ela, senão infere (assumindo Loja se não especificado ou se tiver pago)
      const isCarrier = order.pixPaymentDestination === "carrier";

      if (isCarrier) {
        paymentInstruction =
          "Pagamento via PIX para o Motoboy (Cobrar Valor + Entrega)";
      } else {
        paymentInstruction =
          "Pagamento feito para a loja, receber o valor da entrega apenas";
      }
    } else if (order.paymentMethod === "cash") {
      paymentInstruction = "Dinheiro (Cobrar Valor do Pedido + Entrega)";
    } else {
      paymentInstruction = "Cartão (Levar Maquininha)";
    }

    const text = `Local de Retirada (Nossa Loja):
Rua Pedro Aldemar Bantim, 945
Bairro Doutor Sílvio Botelho

Destino (Cliente):
${order.customerName}
${order.address || "Endereço não informado"}
Telefone: ${order.customerPhone}

Forma de Pagamento: ${
      order.paymentMethod === "pix"
        ? "PIX"
        : order.paymentMethod === "cash"
        ? "Dinheiro"
        : "Cartão"
    }
${paymentInstruction}`;

    navigator.clipboard.writeText(text);
    toast.success("Texto copiado! Pronto para enviar.");
  };

  // Pagamento e PIX são gravados no checkout desde sempre, mas nunca
  // apareciam aqui — equipe não sabia se já tinha sido pago, nem pra quem
  // mandar o PIX (loja ou motoboy). Ver types/order.ts (#54).
  const getPaymentInfo = (order: Order) => {
    const timingText =
      order.paymentTiming === "on_delivery"
        ? "Pagamento na entrega/retirada"
        : "Pago antecipado";
    if (order.paymentMethod !== "pix") return timingText;
    const destText =
      order.pixPaymentDestination === "carrier"
        ? "PIX para o motoboy"
        : "PIX para a loja";
    return `${timingText} · ${destText}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
      case "preparing":
        return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
      case "ready":
        return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
      case "delivered":
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
      case "cancelled":
        return "bg-gray-100 text-gray-500 border-gray-200 decoration-line-through";
      default:
        return "bg-white border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "preparing":
        return "Preparando";
      case "ready":
        return "Pronto";
      case "out_for_delivery":
        return "Em Rota";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getPaymentIcon = (method: string) => {
    if (method === "pix")
      return (
        <div className="flex items-center gap-1 text-green-600">
          <span className="font-bold text-xs">PIX</span>
        </div>
      );
    if (method === "cash")
      return <Banknote size={14} className="text-green-600" />;
    return <CreditCard size={14} className="text-blue-600" />;
  };

  // --- LÓGICA DE FILTRO E PAGINAÇÃO ---
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    return order.status === statusFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  // `currentPage` vem da URL e pode apontar pra além do fim (ex: filtro
  // mudou e encolheu a lista) — usa a versão presa aos limites só pra
  // renderizar, sem reescrever a URL por baixo do usuário.
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Gotcha da paginação (issue #73): se o pedido do `?pedido=` está numa
  // página diferente da atual, ele não é renderizado e o expand/scroll do
  // efeito abaixo falha em silêncio. Calcula a página que contém aquele
  // pedido dentro da lista já filtrada e empurra pra URL antes de expandir.
  useEffect(() => {
    const pedido = searchParams.get("pedido");
    if (!pedido) return;
    const idx = filteredOrders.findIndex((o) => o.id === pedido);
    if (idx === -1) return; // não está no filtro atual (ou ainda não carregou) — nada a fazer aqui
    const targetPage = Math.floor(idx / ITEMS_PER_PAGE) + 1;
    if (targetPage !== currentPage) {
      goToPage(targetPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filteredOrders]);

  // Reseta a marca de "já rolei pra este pedido" sempre que o `?pedido=` da
  // URL mudar (inclusive pra vazio) — permite rolar de novo se o usuário
  // navegar pra outro deep-link.
  const pedidoParam = searchParams.get("pedido");
  if (pedidoParam !== lastPedidoRef.current) {
    lastPedidoRef.current = pedidoParam;
    scrolledForPedidoRef.current = null;
  }

  // Rola até o card/linha do pedido deep-linkado depois que ele expande e
  // está de fato montado na página atual (issue #73, item 2). Roda de novo
  // a cada render relevante mas só executa o scroll uma vez por pedido
  // (scrolledForPedidoRef), pra não brigar com o scroll manual do usuário.
  useEffect(() => {
    const pedido = searchParams.get("pedido");
    if (!pedido) return;
    if (!expandedOrders[pedido]) return;
    if (scrolledForPedidoRef.current === pedido) return;
    const el = orderRefs.current.get(pedido);
    if (!el) return; // ainda não montado (ex: página errada — efeito acima corrige)
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    scrolledForPedidoRef.current = pedido;
  }, [searchParams, expandedOrders, paginatedOrders]);

  // --- MODAL DE PRODUTO DO ITEM (issue #73) ---
  // Deriva o item/pedido selecionado inteiramente da URL (`?produto=`),
  // igual ao `?pedido=` — cobre abrir via clique, refresh e "voltar" do
  // navegador (que reescreve a URL sem passar pelo handler de clique).
  const produtoParam = searchParams.get("produto");
  let productModalOrderItem: { orderId: string; item: CartItem } | null =
    null;
  if (produtoParam) {
    // Prioriza o pedido já aberto (`?pedido=`) pra evitar pegar o item
    // errado quando o mesmo produto aparece em mais de um pedido.
    const scopedOrders = pedidoParam
      ? filteredOrders.filter((o) => o.id === pedidoParam)
      : filteredOrders;
    const pool = scopedOrders.length ? scopedOrders : filteredOrders;
    for (const order of pool) {
      const item = order.items.find((i) => i.product?.id === produtoParam);
      if (item) {
        productModalOrderItem = { orderId: order.id, item };
        break;
      }
    }
  }

  // Item composto (kit/fita/balão personalizados) sem `product` único —
  // nunca tenta abrir o ProductInfoModal pra ele, mostra um fallback à
  // parte. Estado local só (não precisa sobreviver a "voltar": é conteúdo
  // que já está todo na tela do pedido, só reapresentado maior).
  const [fallbackItem, setFallbackItem] = useState<CartItem | null>(null);

  const openItemProduct = (item: CartItem) => {
    if (!item.product) {
      setFallbackItem(item);
      return;
    }
    pushedProdutoRef.current = true;
    patchParams({ produto: item.product.id }, { push: true });
  };

  const closeItemProduct = () => {
    if (pushedProdutoRef.current) {
      pushedProdutoRef.current = false;
      router.back();
    } else {
      patchParams({ produto: undefined });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const FilterButton = ({
    label,
    value,
    count,
  }: {
    label: string;
    value: string;
    count?: number;
  }) => (
    <button
      onClick={() => handleStatusFilterChange(value)}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
        statusFilter === value
          ? "bg-slate-800 text-white border-slate-800"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      )}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* HEADER & FILTROS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
          <Badge variant="secondary" className="text-sm">
            Total: {orders.length}
          </Badge>
        </div>

        {/* Navigation / Filters Scrollable */}
        {/* Navigation / Filters Scrollable - Native Scroll for Mobile Touch Fix */}
        <div className="w-full overflow-x-auto pb-2 touch-pan-x">
          <div className="flex gap-2 min-w-max px-1">
            <FilterButton label="Todos" value="all" count={orders.length} />
            <FilterButton
              label="Pendentes"
              value="pending"
              count={orders.filter((o) => o.status === "pending").length}
            />
            <FilterButton
              label="Preparando"
              value="preparing"
              count={orders.filter((o) => o.status === "preparing").length}
            />
            <FilterButton
              label="Pronto p/ Entrega"
              value="ready"
              count={orders.filter((o) => o.status === "ready").length}
            />
            <FilterButton
              label="Saiu p/ Entrega"
              value="out_for_delivery"
              count={
                orders.filter((o) => o.status === "out_for_delivery").length
              }
            />
            <FilterButton
              label="Entregues"
              value="delivered"
              count={orders.filter((o) => o.status === "delivered").length}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW (Table) */}
      <div className="hidden md:block border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow
                  ref={setOrderRef(order.id) as any}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {expandedOrders[order.id] ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold" suppressHydrationWarning>
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="text-[10px] text-slate-500"
                      >
                        {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {order.customerName}
                        {order.observation && (
                          <StickyNote
                            size={12}
                            className="text-amber-500 shrink-0"
                          >
                            <title>Tem observação do cliente</title>
                          </StickyNote>
                        )}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Phone size={10} />
                        {order.customerPhone || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        defaultValue={order.status}
                        onValueChange={(v) =>
                          updateStatus(order.id, v as OrderStatus)
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-[140px] text-xs font-bold border rounded-md shadow-sm focus:ring-0 transition-colors pl-3 pr-4",
                            getStatusColor(order.status)
                          )}
                        >
                          <SelectValue>
                            {getStatusLabel(order.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="preparing">Preparando</SelectItem>
                          <SelectItem value="ready">Pronto</SelectItem>
                          <SelectItem value="out_for_delivery">
                            Saiu p/ Entrega
                          </SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {getPaymentIcon(order.paymentMethod)}
                        <span className="uppercase">
                          {order.paymentMethod === "credit_card"
                            ? "Crédito"
                            : order.paymentMethod === "debit_card"
                            ? "Débito"
                            : order.paymentMethod === "cash"
                            ? "Dinheiro"
                            : "PIX"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        {order.deliveryMethod === "delivery" ? (
                          <Truck size={10} />
                        ) : (
                          <Store size={10} />
                        )}
                        {order.deliveryMethod === "delivery"
                          ? "Entrega"
                          : "Retirada"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-700">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.deliveryMethod === "delivery" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs gap-1 bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyDeliveryInfo(order);
                        }}
                      >
                        <Copy size={12} /> Copiar Moto
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {expandedOrders[order.id] && (
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-4 border-b">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                              <Package size={16} /> Itens
                            </h4>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <OrderItemRow
                                  key={item.cartId || idx}
                                  item={item}
                                  onOpen={openItemProduct}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700">
                              <MapPin size={16} /> Entrega
                            </h4>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded border">
                              {order.deliveryMethod === "delivery"
                                ? order.address
                                : "Retirada na Loja"}
                            </p>
                            {order.deliveryMethod === "delivery" &&
                              order.addressDetails?.reference != null && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
                                  <span className="font-bold">
                                    Ponto de referência:
                                  </span>{" "}
                                  {order.addressDetails.reference}
                                </p>
                              )}
                            <Button
                              variant="secondary"
                              className="w-full gap-2 text-xs"
                              onClick={() => {
                                const firstName =
                                  order.customerName.split(" ")[0];
                                const firstItem = order.items[0];
                                const firstItemName =
                                  firstItem.product?.name ||
                                  firstItem.kitName ||
                                  "Produto";
                                const otherItemsCount = order.items.length - 1;

                                let itemsText = firstItemName;
                                if (otherItemsCount > 0) {
                                  itemsText += ` e mais ${otherItemsCount} item(s)`;
                                }

                                const text = `Olá, ${firstName}, tudo bem? Sobre seu pedido de ${itemsText} na Mix Novidades...`;

                                window.open(
                                  `https://wa.me/55${order.customerPhone?.replace(
                                    /\D/g,
                                    ""
                                  )}?text=${encodeURIComponent(text)}`,
                                  "_blank"
                                );
                              }}
                            >
                              <MessageCircle
                                size={14}
                                className="text-green-600"
                              />{" "}
                              WhatsApp Cliente
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-700 bg-white p-3 rounded border">
                            <Wallet size={16} className="text-slate-500 shrink-0" />
                            {getPaymentInfo(order)}
                            {order.paymentMethod === "cash" &&
                              order.changeFor != null && (
                                <span className="font-bold text-slate-800">
                                  {" "}
                                  · Troco para R$ {order.changeFor}
                                </span>
                              )}
                          </div>
                          {order.observation && (
                            <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded">
                              <StickyNote
                                size={16}
                                className="text-amber-600 shrink-0 mt-0.5"
                              />
                              <div>
                                <p className="font-bold text-xs uppercase tracking-wide text-amber-700">
                                  Observação do cliente
                                </p>
                                {order.observation}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE VIEW (Cards) */}
      <div className="md:hidden space-y-4">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            ref={setOrderRef(order.id)}
            className="bg-white border rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header do Card */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  {order.customerName}
                  {order.observation && (
                    <StickyNote size={12} className="text-amber-500 shrink-0">
                      <title>Tem observação do cliente</title>
                    </StickyNote>
                  )}
                </span>
                <span
                  className="text-xs text-slate-500 flex items-center gap-1"
                  suppressHydrationWarning
                >
                  <Clock size={10} />
                  {(() => {
                    const diff =
                      Date.now() - (new Date(order.createdAt).getTime() || 0);
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins} min atrás`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours}h atrás`;
                    return new Date(order.createdAt).toLocaleDateString(
                      "pt-BR"
                    );
                  })()}
                </span>
              </div>
              <div>
                <Select
                  defaultValue={order.status}
                  onValueChange={(v) =>
                    updateStatus(order.id, v as OrderStatus)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-[140px] text-xs font-bold border rounded-md shadow-sm pl-3 pr-4",
                      getStatusColor(order.status)
                    )}
                  >
                    <SelectValue>{getStatusLabel(order.status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="preparing">Preparando</SelectItem>
                    <SelectItem value="ready">Pronto p/ Entrega</SelectItem>
                    <SelectItem value="out_for_delivery">Em Rota</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Corpo do Card */}
            <div
              className="p-4 space-y-3"
              onClick={() => toggleExpand(order.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 p-2 rounded-lg text-green-600">
                    {getPaymentIcon(order.paymentMethod)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      {order.paymentMethod === "pix"
                        ? "PIX"
                        : order.paymentMethod === "cash"
                        ? "Dinheiro"
                        : "Cartão"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {order.deliveryMethod === "delivery"
                        ? "Entrega"
                        : "Retirada"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              {/* Área Expandida Mobile */}
              {expandedOrders[order.id] && (
                <div className="pt-3 border-t mt-3 animate-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                        Itens
                      </h4>
                      {order.items.map((item, idx) => (
                        <OrderItemRow
                          key={item.cartId || idx}
                          item={item}
                          onOpen={openItemProduct}
                        />
                      ))}
                    </div>

                    {order.deliveryMethod === "delivery" && (
                      <div className="bg-slate-50 p-3 rounded border text-xs text-slate-600">
                        <p className="font-bold mb-1">📍 Endereço Entrega:</p>
                        {order.address}
                        {order.addressDetails?.reference != null && (
                          <p className="mt-1">
                            <span className="font-bold">
                              Ponto de referência:
                            </span>{" "}
                            {order.addressDetails.reference}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded border">
                      <Wallet size={14} className="text-slate-500 shrink-0" />
                      {getPaymentInfo(order)}
                      {order.paymentMethod === "cash" &&
                        order.changeFor != null && (
                          <span className="font-bold text-slate-800">
                            {" "}
                            · Troco para R$ {order.changeFor}
                          </span>
                        )}
                    </div>

                    {order.observation && (
                      <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded">
                        <StickyNote
                          size={14}
                          className="text-amber-600 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="font-bold uppercase tracking-wide text-amber-700">
                            Observação do cliente
                          </p>
                          {order.observation}
                        </div>
                      </div>
                    )}

                    {/* BOTÕES LADO A LADO - OCUPANDO 100% */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {order.deliveryMethod === "delivery" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyDeliveryInfo(order);
                          }}
                        >
                          <Copy size={14} /> Copiar p/ Motoboy
                        </Button>
                      ) : (
                        // Placeholder vazio caso não seja entrega, ou botão alternativo
                        <div className="hidden"></div>
                      )}

                      <Button
                        className={cn(
                          "w-full gap-2",
                          order.deliveryMethod !== "delivery"
                            ? "col-span-2"
                            : ""
                        )}
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();

                          const firstName = order.customerName.split(" ")[0];
                          const firstItem = order.items[0];
                          const firstItemName =
                            firstItem.product?.name ||
                            firstItem.kitName ||
                            "Produto";
                          const otherItemsCount = order.items.length - 1;

                          let itemsText = firstItemName;
                          if (otherItemsCount > 0) {
                            itemsText += ` e mais ${otherItemsCount} item(s)`;
                          }

                          const text = `Olá, ${firstName}, tudo bem? Sobre seu pedido de ${itemsText} na Mix Novidades...`;

                          window.open(
                            `https://wa.me/55${order.customerPhone?.replace(
                              /\D/g,
                              ""
                            )}?text=${encodeURIComponent(text)}`,
                            "_blank"
                          );
                        }}
                      >
                        <MessageCircle size={16} className="text-green-600" />{" "}
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!expandedOrders[order.id] && (
              <div
                className="bg-slate-50 p-2 text-center"
                onClick={() => toggleExpand(order.id)}
              >
                <ChevronDown className="mx-auto text-slate-400" size={16} />
              </div>
            )}
          </div>
        ))}

        {paginatedOrders.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Nenhum pedido encontrado com este filtro.
          </div>
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-6">
          <Button
            variant="outline"
            disabled={safePage === 1}
            onClick={() => goToPage(Math.max(1, safePage - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm font-medium text-slate-600">
            Pág {safePage} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={safePage === totalPages}
            onClick={() => goToPage(Math.min(totalPages, safePage + 1))}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* MODAL DE PRODUTO DO ITEM (issue #73) — abre via `?produto=`, com
          history push: "voltar" do navegador fecha o modal e reencontre o
          pedido aberto, sem perder scroll/filtro. */}
      <ProductInfoModal
        product={productModalOrderItem?.item.product ?? null}
        open={!!productModalOrderItem}
        onOpenChange={(o) => !o && closeItemProduct()}
        onEdit={() => {
          // Editar produto a partir do pedido sai do escopo desta issue
          // (o admin de Produtos já cobre edição); fecha o modal aqui.
          closeItemProduct();
        }}
        onDeleted={closeItemProduct}
        highlightVariant={
          productModalOrderItem?.item.selectedVariant
            ? {
                type: productModalOrderItem.item.selectedVariant.type,
                name: productModalOrderItem.item.selectedVariant.name,
              }
            : null
        }
        highlightImageLabel={productModalOrderItem?.item.selectedImageLabel}
        highlightImageUrl={productModalOrderItem?.item.selectedImageUrl}
      />

      {/* FALLBACK PARA ITEM COMPOSTO (kit/fita/balão personalizados) — sem
          `product` único, então nunca abre o ProductInfoModal; mostra os
          detalhes que já existem no próprio item. */}
      <Dialog
        open={!!fallbackItem}
        onOpenChange={(o) => !o && setFallbackItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {fallbackItem?.quantity}x{" "}
              {fallbackItem?.kitName || "Item personalizado"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes do item personalizado do pedido — sem um produto único
              pra abrir na ficha de produto.
            </DialogDescription>
          </DialogHeader>
          {fallbackItem && (
            <div className="space-y-3 text-sm text-slate-700">
              {fallbackItem.kitComponents &&
                fallbackItem.kitComponents.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                      Componentes do kit
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {fallbackItem.kitComponents.map((c, i) => (
                        <li key={c.id || i}>{c.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {fallbackItem.balloonDetails && (
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Balão
                  </p>
                  <p>
                    {fallbackItem.balloonDetails.typeName} —{" "}
                    {fallbackItem.balloonDetails.size}" —{" "}
                    {fallbackItem.balloonDetails.color}
                  </p>
                </div>
              )}
              {fallbackItem.ribbonDetails && (
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Laço/fita personalizada
                  </p>
                  <p>
                    Modelo: {fallbackItem.ribbonDetails.modelo} · Tamanho:{" "}
                    {fallbackItem.ribbonDetails.tamanho}
                    {fallbackItem.ribbonDetails.cor
                      ? ` · Cor: ${fallbackItem.ribbonDetails.cor}`
                      : ""}
                  </p>
                </div>
              )}
              {fallbackItem.customizations && (
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                    Personalização
                  </p>
                  <p>
                    {fallbackItem.customizations.style} —{" "}
                    {fallbackItem.customizations.size}
                  </p>
                </div>
              )}
              {!fallbackItem.kitComponents?.length &&
                !fallbackItem.balloonDetails &&
                !fallbackItem.ribbonDetails &&
                !fallbackItem.customizations && (
                  <p className="text-slate-500">
                    Sem detalhes adicionais registrados pra este item.
                  </p>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
