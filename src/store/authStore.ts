// src/store/authStore.ts

import { create } from "zustand";
// NOTA: Certifique-se de que instalou 'firebase' e @firebase/auth ou a versão mais recente
import { User, onAuthStateChanged, signOut, Auth } from "firebase/auth";

// Importa a instância de autenticação do seu arquivo de configuração do Firebase
import { auth } from "@/lib/firebase";

// 1. Definição da Interface de Estado
interface AuthState {
  /** O objeto User do Firebase, ou null se não estiver logado. */
  user: User | null;
  /** Indica se há um usuário logado. */
  isAuthenticated: boolean;
  /** Indica se o listener do Firebase ainda está verificando o estado inicial. */
  isLoading: boolean;

  /** Define o usuário após o estado de autenticação ser conhecido. */
  setUser: (user: User | null) => void;
  /** Função para deslogar o usuário. */
  logout: () => Promise<void>;
  /** Função para iniciar o listener de estado do Firebase Auth (Deve ser chamada uma vez). */
  initializeAuthListener: () => () => void;
}

// 2. Criação do Store
export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado Inicial
  user: null,
  isAuthenticated: false,
  isLoading: true, // Começa como true para indicar que a verificação inicial está em curso

  // Ações
  setUser: (user) => {
    set({
      user: user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  },

  initializeAuthListener: () => {
    // Adiciona um listener que observa o estado de autenticação do Firebase.
    // É essencial para sincronizar o estado global do Zustand com o Firebase.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Atualiza o estado do Zustand com o usuário do Firebase
      set({
        user: firebaseUser,
        isAuthenticated: !!firebaseUser,
        isLoading: false,
      });
    });

    // Retorna a função de 'unsubscribe' para limpar o listener no 'unmount'
    return unsubscribe;
  },
}));
