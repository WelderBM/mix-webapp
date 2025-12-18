"use client";
import { useState } from "react";
import Link from "next/link";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { SeedTab } from "@/components/admin/SeedTab";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "seed">("orders");

  return (
    // h-screen garante que a página ocupe exatamente o tamanho da janela, sem scroll geral
    <div className="flex h-screen bg-gray-100">
      {/* --- SIDEBAR (Barra Lateral) --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">Admin</h1>
          <Link href="/" className="text-xs text-blue-500 hover:underline">
            ← Voltar para Loja
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "orders"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            📦 Pedidos
          </button>

          <button
            onClick={() => setActiveTab("seed")}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "seed"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🛠️ Configurações / Seed
          </button>
        </nav>
      </aside>

      {/* --- ÁREA DE CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* O overflow-hidden aqui é CRUCIAL. Ele impede que a página inteira role,
            forçando o scroll a acontecer apenas dentro do componente OrdersTab */}

        {activeTab === "orders" && <OrdersTab />}

        {activeTab === "seed" && (
          <div className="p-8 overflow-y-auto">
            <SeedTab />
          </div>
        )}
      </main>
    </div>
  );
}
