import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Database,
  Lock,
  CheckCircle,
  Trash2,
  Globe,
  UserPlus,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { seedDatabase, seedBalloons } from "@/lib/seed";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StaffMember {
  id: string; // email
  active: boolean;
  addedAt: string;
  addedBy?: string;
  role: string;
}

export function SuperAdminZone() {
  const [isLoading, setIsLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [allowedDomain, setAllowedDomain] = useState("");
  const { user } = useAuthStore();

  // Buscar lista de staff e configurações de domínio
  useEffect(() => {
    const unsubStaff = onSnapshot(
      collection(db, "whitelisted_staff"),
      (snap) => {
        setStaffList(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StaffMember),
        );
      },
    );

    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (snap) => {
      if (snap.exists()) {
        setAllowedDomain(snap.data().allowedStaffDomain || "");
      }
    });
 
 
    return () => {
      unsubStaff();
      unsubSettings();
    };
  }, []);

  const handleRunSeed = async () => {
    if (
      !confirm(
        "⚠️ PERIGO: Isso vai sobrescrever as configurações e criar produtos teste. Tem certeza?",
      )
    )
      return;
    setIsLoading(true);
    try {
      await seedDatabase();
      toast.success("Banco de dados resetado!");
    } catch (error) {
      toast.error("Erro ao rodar seed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDomain = async () => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "settings", "general"), {
        allowedStaffDomain: allowedDomain.toLowerCase().trim(),
      });
      toast.success("Domínio de staff atualizado!");
    } catch (error) {
      toast.error("Erro ao salvar domínio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).toLowerCase().trim();
    if (!email) return;

    setIsLoading(true);
    try {
      await setDoc(doc(db, "whitelisted_staff", email), {
        active: true,
        addedAt: new Date().toISOString(),
        addedBy: user?.email || "unknown",
        role: "staff",
      });
      toast.success(`${email} autorizado!`);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("Erro ao autorizar e-mail.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (email: string) => {
    if (email === user?.email) {
      toast.error("Você não pode remover seu próprio acesso por aqui.");
      return;
    }
    if (!confirm(`Remover acesso de ${email}?`)) return;
    try {
      await deleteDoc(doc(db, "whitelisted_staff", email));
      toast.success("Acesso removido.");
    } catch (error) {
      toast.error("Erro ao remover.");
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-8 rounded-xl border border-slate-700 space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
        <ShieldCheck className="text-blue-400" size={24} />
        <h2 className="text-xl font-bold tracking-tight">
          Segurança & Gestão de Acesso
        </h2>
        <span className="ml-auto bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-900 flex items-center gap-1">
          <CheckCircle size={12} /> Super Admin Ativo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Whitelist Domain */}
        <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <Globe className="text-blue-400" size={20} />
            <h3 className="font-bold text-white">Domínio Corporativo</h3>
          </div>
          <p className="text-xs text-slate-400">
            Qualquer pessoa com e-mail verificado deste domínio terá acesso
            administrativo automático. Ex: <strong>mixnovidades.com.br</strong>
          </p>
          <div className="flex gap-2">
            <Input
              value={allowedDomain}
              onChange={(e) => setAllowedDomain(e.target.value)}
              placeholder="ex: empresa.com.br"
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Button
              onClick={handleSaveDomain}
              disabled={isLoading}
              variant="secondary"
            >
              Salvar
            </Button>
          </div>
        </div>

        {/* Add New Staff */}
        <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <UserPlus className="text-purple-400" size={20} />
            <h3 className="font-bold text-white">Autorizar Novo E-mail</h3>
          </div>
          <p className="text-xs text-slate-400">
            Adicione e-mails específicos que não pertencem ao domínio
            corporativo (ex: e-mails @gmail.com).
          </p>
          <form onSubmit={handleAddStaff} className="flex gap-2">
            <Input
              name="email"
              type="email"
              placeholder="funcionario@gmail.com"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Autorizar
            </Button>
          </form>
        </div>


        {/* Staff List & Audit */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Lock className="text-yellow-400" size={18} /> Staff Autorizado (
              {staffList.length})
            </h3>
          </div>

          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400 text-left">
                <tr>
                  <th className="p-3 font-medium">Funcionário</th>
                  <th className="p-3 font-medium">Adicionado por</th>
                  <th className="p-3 font-medium">Data</th>
                  <th className="p-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-200">
                      {staff.id}
                    </td>
                    <td className="p-3 text-slate-400">
                      {staff.addedBy || "Console"}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(staff.addedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500 italic"
                    >
                      Nenhum funcionário cadastrado manualmente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-2 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-4 p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div className="flex-1">
              <h4 className="text-red-400 font-bold text-sm">Zona de Perigo</h4>
              <p className="text-xs text-red-300/70">
                Ações irreversíveis que impactam toda a base de dados.
              </p>
            </div>
            <Button
              onClick={handleRunSeed}
              disabled={isLoading}
              variant="destructive"
              size="sm"
              className="bg-red-900/40 hover:bg-red-900/60 border border-red-800"
            >
              Resetar Banco
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
