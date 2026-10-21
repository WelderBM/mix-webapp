"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { AdminLogin } from "@/components/admin/AdminLogin";

// Controle de acesso do painel: só renderiza o admin para quem está logado,
// com e-mail verificado e na lista de funcionários (mesma regra do
// firestore.rules). Separado de src/app/admin/page.tsx de propósito: ESTE
// arquivo é de alto risco no gate de revisão (scripts/ci/pr-gate.mjs); a
// tela do admin é área comum de trabalho e pode mudar com revisão normal.

const Spinner = () => (
  <div className="h-screen flex items-center justify-center bg-slate-100">
    <Loader2 className="animate-spin text-purple-600 w-8 h-8" />
  </div>
);

export function AdminAuthGate({
  children,
}: {
  children: (user: User) => ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

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
        // Mesma regra do firestore.rules: whitelist individual OU domínio
        // corporativo (settings/general.allowedStaffDomain).
        const isActive = await useAuthStore.getState().checkAdminRole(user);

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
        toast.error("Não foi possível verificar seu acesso. Tente novamente.");
        await signOut(auth);
        router.replace("/");
      } finally {
        setLoadingAuth(false);
      }
    });
    return () => unsubAuth();
  }, [router]);

  if (loadingAuth) return <Spinner />;
  if (!currentUser) return <AdminLogin />;
  // Proteção extra: usuário logado mas sem role de admin (estado transitório)
  if (!isAdminUser) return <Spinner />;
  return <>{children(currentUser)}</>;
}
