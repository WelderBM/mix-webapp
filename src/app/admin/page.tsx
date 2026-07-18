"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Product, StoreSettings } from "@/types";
import { BalloonConfig } from "@/types/balloon";
import { Category } from "@/types/category";
import { useGlobalSettings } from "@/providers/ThemeProvider";
import { useSearchParamsPatch } from "@/hooks/useSearchParamsPatch";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  LogOut,
  Package,
  Layout,
  Save,
  Eye,
  ShoppingBag,
  Database,
  PartyPopper,
  Scissors,
  Settings2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import Link from "next/link";
import { SuperAdminZone } from "@/components/admin/SuperAdminZone";
import {
  useSystemToolsUnlocked,
  SystemPasswordPrompt,
} from "@/components/admin/SystemPasswordGate";
import { cn } from "@/lib/utils";

import { OrdersTab } from "@/components/admin/OrdersTab";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { NaturaTab } from "@/components/admin/NaturaTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { SectionsTab } from "@/components/admin/SectionsTab";
import { BalloonsTab } from "@/components/admin/BalloonsTab";
import { RibbonsTab } from "@/components/admin/RibbonsTab";
import { ConfigTab } from "@/components/admin/ConfigTab";
import { useDraftPersistence } from "@/hooks/useDraftPersistence";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Mapeia a aba interna de Estoque pro valor de `?aba=` na URL e vice-versa.
const ABA_TO_TAB: Record<string, string> = {
  produtos: "products",
  vitrine: "sections",
  baloes: "balloons",
  fitas: "ribbons",
  config: "config",
};
const TAB_TO_ABA: Record<string, string | undefined> = {
  products: undefined, // default, omitido da URL
  sections: "vitrine",
  balloons: "baloes",
  ribbons: "fitas",
  config: "config",
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-100">
          <Loader2 className="animate-spin text-purple-600 w-8 h-8" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patchParams = useSearchParamsPatch();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  // Defaults to orders since user emphasized it — `?view=estoque` abre direto em Gerenciar Estoque.
  const [viewMode, setViewMode] = useState<"orders" | "inventory">(() =>
    searchParams.get("view") === "estoque" ? "inventory" : "orders"
  );
  const [inventoryTab, setInventoryTab] = useState(
    () => ABA_TO_TAB[searchParams.get("aba") || ""] || "products"
  );

  const handleViewModeChange = (mode: "orders" | "inventory") => {
    setViewMode(mode);
    patchParams({
      view: mode === "inventory" ? "estoque" : undefined,
      aba: undefined,
      status: undefined,
      pedido: undefined,
      nome: undefined,
      tipo: undefined,
      categorias: undefined,
    });
  };

  const handleInventoryTabChange = (value: string) => {
    setInventoryTab(value);
    patchParams({
      aba: TAB_TO_ABA[value],
      nome: undefined,
      tipo: undefined,
      categorias: undefined,
    });
  };

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [settings, setSettings] = useState<StoreSettings>({
    id: "general",
    storeName: "Mix Novidades",
    whatsappNumber: "",
    theme: { primaryColor: "#0f172a", activeTheme: "default" },
    filters: { activeCategories: [], categoryOrder: [] },
    homeSections: [],
  });

  const [balloonConfig, setBalloonConfig] = useState<BalloonConfig>({
    types: [],
    allColors: [],
  });

  // Rascunho local das abas Configurações/Balões (Addendum 4, Parte B,
  // Fatia 2). `settings`/`balloonConfig` são sincronizados ao vivo via
  // onSnapshot — só liga o auto-save (e só checa rascunho existente)
  // depois que a primeira leitura real do Firestore chegar pros dois, pra
  // não gravar/restaurar em cima dos valores padrão hardcoded acima.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [balloonsLoaded, setBalloonsLoaded] = useState(false);
  const [configDraftEnabled, setConfigDraftEnabled] = useState(false);
  // Memoizado pra só trocar de referência quando `settings`/`balloonConfig`
  // de fato mudam — sem isso, qualquer re-render do admin (há muitos,
  // vindos de estado sem relação nenhuma com essas duas abas) recriava o
  // objeto e o hook achava que era uma edição nova.
  const configDraftValue = useMemo(
    () => ({ settings, balloonConfig }),
    [settings, balloonConfig]
  );
  const { restoreDraft: restoreConfigDraft, clearDraft: clearConfigDraft } =
    useDraftPersistence("admin-config", configDraftValue, {
      enabled: configDraftEnabled,
    });
  const [pendingConfigDraft, setPendingConfigDraft] = useState<{
    settings: StoreSettings;
    balloonConfig: BalloonConfig;
  } | null>(null);

  // Modal único de produto (compartilhado entre as abas Produtos e Fitas)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const openProductModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const [categories, setCategories] = useState<Category[]>([]);

  // System Tools Modal
  const [isSysToolsOpen, setIsSysToolsOpen] = useState(false);
  const { unlocked: systemUnlocked, unlock: unlockSystem } =
    useSystemToolsUnlocked();
  const [showSystemPasswordPrompt, setShowSystemPasswordPrompt] =
    useState(false);

  // Auth & Data — com verificação de whitelist
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAdminUser(false);
        setLoadingAuth(false);
        return;
      }

      // Verifica se o email está verificado e na whitelist
      if (!user.email || !user.emailVerified) {
        toast.error("Acesso restrito. E-mail não verificado ou não autorizado.");
        await signOut(auth);
        router.replace("/");
        setLoadingAuth(false);
        return;
      }

      try {
        const { doc: firestoreDoc, getDoc: firestoreGetDoc } = await import(
          "firebase/firestore"
        );
        const staffDoc = await firestoreGetDoc(
          firestoreDoc(db, "whitelisted_staff", user.email)
        );
        const isActive = staffDoc.exists() && staffDoc.data()?.active === true;

        if (!isActive) {
          toast.error("Seu e-mail não consta na lista de funcionários autorizados.");
          await signOut(auth);
          router.replace("/");
          return;
        }

        setCurrentUser(user);
        setIsAdminUser(true);
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        await signOut(auth);
        router.replace("/");
      } finally {
        setLoadingAuth(false);
      }
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    // Buscar Produtos
    const unsubProd = onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      (s) =>
        setAllProducts(
          s.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
        )
    );

    // settings/general é lido pelo ThemeProvider (aplica o tema em toda a
    // loja) — reaproveitado via useGlobalSettings logo abaixo em vez de
    // abrir um segundo onSnapshot redundante no mesmo documento aqui.

    // Buscar Configurações de Balões
    const unsubBall = onSnapshot(doc(db, "settings", "balloons"), (s) => {
      if (s.exists()) setBalloonConfig(s.data() as BalloonConfig);
      setBalloonsLoaded(true);
    });

    // Buscar Categorias/Subcategorias
    const unsubCat = onSnapshot(
      query(collection(db, "categories"), orderBy("order")),
      (s) =>
        setCategories(s.docs.map((d) => ({ id: d.id, ...d.data() } as Category)))
    );

    return () => {
      unsubProd();

      unsubBall();
      unsubCat();
    };
  }, [currentUser]);

  // Sincroniza o `settings` local a partir do contexto global (ThemeProvider
  // já escuta settings/general pra aplicar o tema — reaproveitado aqui em
  // vez de abrir um segundo onSnapshot redundante no mesmo documento) e
  // marca settingsLoaded assim que a primeira leitura real chegar, pro
  // efeito de rascunho abaixo saber quando não são mais só os valores
  // padrão hardcoded.
  const globalSettings = useGlobalSettings();
  useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
      setSettingsLoaded(true);
    }
  }, [globalSettings]);

  // Checa rascunho de Configurações/Balões uma única vez, assim que a
  // primeira leitura real do Firestore chegar pros dois (settingsLoaded +
  // balloonsLoaded) — antes disso `settings`/`balloonConfig` ainda são só
  // os valores padrão hardcoded, não faz sentido oferecer restaurar nada.
  useEffect(() => {
    if (!settingsLoaded || !balloonsLoaded || configDraftEnabled) return;
    const draft = restoreConfigDraft();
    if (draft) {
      setPendingConfigDraft(draft);
    } else {
      setConfigDraftEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded, balloonsLoaded]);

  const handleRestoreConfigDraft = () => {
    if (pendingConfigDraft) {
      setSettings(pendingConfigDraft.settings);
      setBalloonConfig(pendingConfigDraft.balloonConfig);
    }
    setPendingConfigDraft(null);
    setConfigDraftEnabled(true);
  };

  const handleDiscardConfigDraft = () => {
    clearConfigDraft();
    setPendingConfigDraft(null);
    setConfigDraftEnabled(true);
  };

  const uniqueCategories = useMemo(
    () =>
      Array.from(
        new Set(allProducts.map((p) => p.category).filter(Boolean))
      ).sort(),
    [allProducts]
  );

  const saveAllSettings = async () => {
    try {
      await Promise.all([
        setDoc(doc(db, "settings", "general"), settings),
        setDoc(doc(db, "settings", "balloons"), balloonConfig),
      ]);
      clearConfigDraft();
      toast.success("Salvo com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
  };

  if (loadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-purple-600 w-8 h-8" />
      </div>
    );
  }

  if (!currentUser) {
    return <AdminLogin />;
  }

  // Proteção extra: usuário logado mas sem role de admin (estado transitório)
  if (!isAdminUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-purple-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold">Painel Mix Novidades</h1>
            <p className="text-xs text-slate-500">Gestão simplificada</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center md:justify-end">
            <Button
              onClick={saveAllSettings}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1 md:flex-none"
            >
              <Save size={18} /> Salvar Configurações
            </Button>
            <Link href="/" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full">
                <Eye size={18} className="mr-2" /> Ver Loja
              </Button>
            </Link>
            <Button
              onClick={() => {
                signOut(auth);
              }}
              variant="ghost"
            >
              <LogOut size={16} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/admin/batch-import" className="gap-2 cursor-pointer">
                    <Package size={14} /> Importação em Lote (Fitas)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    systemUnlocked
                      ? setIsSysToolsOpen(true)
                      : setShowSystemPasswordPrompt(true)
                  }
                  className="text-red-600 gap-2"
                >
                  <Database size={14} /> Ferramentas de Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex p-1 bg-slate-200/50 border border-slate-200 rounded-lg w-fit mt-6">
          <button
            onClick={() => handleViewModeChange("orders")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              viewMode === "orders"
                ? "bg-white text-blue-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <ShoppingBag size={16} /> Pedidos
          </button>
          <button
            onClick={() => handleViewModeChange("inventory")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              viewMode === "inventory"
                ? "bg-white text-purple-700 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Package size={16} /> Gerenciar Estoque
          </button>
        </div>

        {viewMode === "orders" ? (
          <OrdersTab />
        ) : (
          <Tabs value={inventoryTab} onValueChange={handleInventoryTabChange}>
            <TabsList className="bg-white p-1 rounded-lg border w-full md:w-auto flex flex-wrap gap-1 md:inline-flex md:flex-nowrap h-auto">
              <TabsTrigger value="products" className="gap-2">
                <Package size={16} /> Produtos
              </TabsTrigger>
              <TabsTrigger value="sections" className="gap-2">
                <Layout size={16} /> Vitrine
              </TabsTrigger>
              <TabsTrigger value="balloons" className="gap-2">
                <PartyPopper size={16} /> Balões
              </TabsTrigger>
              <TabsTrigger value="ribbons" className="gap-2">
                <Scissors size={16} /> Fitas
              </TabsTrigger>
              <TabsTrigger
                value="config"
                className="gap-2 text-slate-700 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
              >
                <Settings2 size={16} /> Configurações
              </TabsTrigger>
            </TabsList>

            {/* === ABA CONFIGURAÇÕES === */}
            <TabsContent value="config" className="space-y-4">
              <ConfigTab settings={settings} setSettings={setSettings} />
            </TabsContent>

            {/* === ABA PRODUTOS === */}
            <TabsContent value="products">
              <ProductsTab
                allProducts={allProducts}
                categories={categories}
                onEditProduct={openProductModal}
              />
            </TabsContent>

            {/* === ABA NATURA === */}
            <TabsContent value="natura">
              <NaturaTab allProducts={allProducts} />
            </TabsContent>

            {/* === ABA VITRINE === */}
            <TabsContent value="sections" className="space-y-4">
              <SectionsTab
                settings={settings}
                setSettings={setSettings}
                allProducts={allProducts}
                uniqueCategories={uniqueCategories}
              />
            </TabsContent>

            <TabsContent value="balloons" className="space-y-4">
              <BalloonsTab
                balloonConfig={balloonConfig}
                setBalloonConfig={setBalloonConfig}
              />
            </TabsContent>

            {/* === ABA FITAS === */}
            <TabsContent value="ribbons">
              <RibbonsTab
                allProducts={allProducts}
                settings={settings}
                setSettings={setSettings}
                onEditProduct={openProductModal}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* --- DISCREET SUPER ADMIN DIALOG --- */}
        <Dialog open={isSysToolsOpen} onOpenChange={setIsSysToolsOpen}>
          <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-800 text-slate-100 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="text-red-500" /> Ferramentas de Sistema
                (Danger Zone)
              </DialogTitle>
            </DialogHeader>
            <SuperAdminZone />
          </DialogContent>
        </Dialog>

        <SystemPasswordPrompt
          open={showSystemPasswordPrompt}
          onOpenChange={setShowSystemPasswordPrompt}
          onUnlocked={() => {
            unlockSystem();
            setIsSysToolsOpen(true);
          }}
        />

        {/* MODAL EDITAR PRODUTO (compartilhado entre Produtos e Fitas) */}
        <ProductFormDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productToEdit={editingProduct}
          onSuccess={() => setIsModalOpen(false)}
          categories={categories}
        />

        <ConfirmDialog
          open={!!pendingConfigDraft}
          onOpenChange={(open) => !open && handleDiscardConfigDraft()}
          title="Alterações não salvas encontradas"
          description="Você tem alterações não salvas nas Configurações/Balões. Deseja continuar de onde parou?"
          confirmLabel="Continuar rascunho"
          cancelLabel="Descartar"
          destructive={false}
          onConfirm={handleRestoreConfigDraft}
        />
      </div>
    </div>
  );
}
