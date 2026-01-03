import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderSuccessModal({ isOpen, onClose }: OrderSuccessModalProps) {
  // Use default link initially
  const [groupLink, setGroupLink] = useState<string>(
    "https://chat.whatsapp.com/LF5bdeHcyjk5LF1NuAFRVm"
  );

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only override if custom link is present and non-empty
          if (data.whatsappGroupLink && data.whatsappGroupLink.trim() !== "") {
            setGroupLink(data.whatsappGroupLink);
          }
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    groupLink
  )}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-green-900">
            Pedido Enviado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-slate-600">
            Muito obrigado por comprar conosco! Agradecemos a preferência.
          </p>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center justify-center gap-2">
              <MessageCircle className="text-green-600" size={20} />
              Entre para nosso Grupo VIP
            </h3>
            <p className="text-sm text-slate-500">
              Fique por dentro de todas as novidades e ofertas exclusivas!
            </p>

            <div className="flex justify-center p-2 bg-white rounded-lg border w-fit mx-auto">
              <img
                src={qrCodeUrl}
                alt="QR Code Grupo WhatsApp"
                className="w-32 h-32"
              />
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => window.open(groupLink, "_blank")}
            >
              Entrar no Grupo
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={onClose} className="text-slate-400">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
