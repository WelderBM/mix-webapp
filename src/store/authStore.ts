// src/store/authStore.ts

import { create } from "zustand";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
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
  /** Função para iniciar o listener de estado do Firebase Auth (Deve ser chamada uma vez). */
  initializeAuthListener: () => () => void;
  /**
   * Verifica se o usuário tem role "admin" no documento /users/{uid}.
   * Retorna true se admin, false caso contrário.
   */
  checkAdminRole: (uid: string) => Promise<boolean>;
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

  checkAdminRole: async (uid: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      const admin = userDoc.exists() && userDoc.data()?.role === "admin";
      set({ isAdmin: admin });
      return admin;
    } catch (error) {
      console.error("Erro ao verificar role de admin:", error);
      set({ isAdmin: false });
      return false;
    }
  },

  initializeAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário autenticado — verifica role antes de liberar o estado de carregamento
        set({ user: firebaseUser, isAuthenticated: true, isLoading: true });
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const admin = userDoc.exists() && userDoc.data()?.role === "admin";
          set({ isAdmin: admin, isLoading: false });
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
