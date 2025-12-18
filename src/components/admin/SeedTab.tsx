"use client";
import { useState } from "react";
import { runSeed } from "@/services/seedService"; // Certifique-se que o caminho está certo

export function SeedTab() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    if (password !== "123456") return setStatus("Senha incorreta!"); // Senha provisória
    setLoading(true);
    setStatus("Rodando seed...");
    try {
      await runSeed();
      setStatus("✅ Sucesso!");
    } catch (e) {
      console.error(e);
      setStatus("❌ Erro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md border border-red-100">
      <h2 className="text-xl font-bold text-red-600 mb-4">
        Zona de Perigo (Seed)
      </h2>
      <div className="space-y-3">
        <input
          type="password"
          placeholder="Senha de admin"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Processando..." : "Resetar Banco de Dados"}
        </button>
        {status && <p className="text-center font-bold text-sm">{status}</p>}
      </div>
    </div>
  );
}
