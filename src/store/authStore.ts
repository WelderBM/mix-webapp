// src/store/authStore.ts

import { create } from "zustand";
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// 1. Definição da Interface de Estado
interface AuthState {
  /** O objeto User do Firebase, ou null se não estiver logado. */
  user: User | null;
  /** Indica se há um usuário logado. */
  isAuthenticated: boolean;
  /** Indica se o listener do Firebase ainda está verificando o estado inicial. */
  isLoading: boolean;
  /** Indica se o usuário autenticado possui role "admin" no Firestore (/users/{uid}). */
  isAdmin: boolean;

  /** Define o usuário após o estado de autenticação ser conhecido. */
  setUser: (user: User | null) => void;
  /** Função para deslogar o usuário. */
  logout: () => Promise<void>;
  /** Função para login com Google. */
  loginWithGoogle: () => Promise<void>;
  /** Função para iniciar o listener de estado do Firebase Auth (Deve ser chamada uma vez). */
  initializeAuthListener: () => () => void;
  /**
   * Verifica se o usuário tem role "admin" no documento /users/{uid}.
   * Retorna true se admin, false caso contrário.
   */
  checkAdminRole: () => Promise<boolean>;
}

// 2. Criação do Store
export const useAuthStore = create<AuthState>((set) => ({
  // Estado Inicial
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,

  // Ações
  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      isAdmin: user ? undefined! : false,
    });
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, isAuthenticated: false, isAdmin: false });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  },

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no login com Google:", error);
      throw error;
    }
  },

  checkAdminRole: async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user || !user.email || !user.emailVerified) {
      set({ isAdmin: false });
      return false;
    }

    try {
      // 1. Verificar Whitelist Explícita (E-mail individual)
      const staffDoc = await getDoc(doc(db, "whitelisted_staff", user.email.toLowerCase()));
      if (staffDoc.exists() && staffDoc.data()?.active === true) {
        set({ isAdmin: true });
        return true;
      }

      // 2. Verificar Whitelist por Domínio (Configuração Geral)
      const settingsDoc = await getDoc(doc(db, "settings", "general"));
      const allowedDomain = settingsDoc.data()?.allowedStaffDomain;
      
      if (allowedDomain && user.email.toLowerCase().endsWith(`@${allowedDomain}`)) {
        set({ isAdmin: true });
        return true;
      }

      set({ isAdmin: false });
      return false;
    } catch (error) {
      console.error("Erro ao verificar permissões de staff:", error);
      set({ isAdmin: false });
      return false;
    }
  },

  initializeAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário autenticado
        set({ user: firebaseUser, isAuthenticated: true, isLoading: true });

        if (!firebaseUser.email || !firebaseUser.emailVerified) {
          set({ isAdmin: false, isLoading: false });
          return;
        }

        try {
          // Reutiliza a lógica de checagem centralizada
          const isAdmin = await useAuthStore.getState().checkAdminRole();
          set({ isAdmin, isLoading: false });
        } catch {
          set({ isAdmin: false, isLoading: false });
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },
}));
