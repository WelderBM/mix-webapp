'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, CartItem } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Package, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error("Erro ao carregar produto", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const item: CartItem = {
      cartId: crypto.randomUUID(),
      type: 'SIMPLE',
      quantity: 1,
      product: product
    };
    addItem(item);
    openCart();
    toast.success("Adicionado ao carrinho!");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;

  if (!product) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Produto não encontrado 😕</h1>
        <Link href="/"><Button variant="outline">Voltar para a Loja</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
            <ArrowLeft size={18} className="mr-2"/> Voltar para a Loja
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col md:flex-row">
            {/* IMAGEM */}
            <div className="md:w-1/2 bg-slate-100 relative min-h-[400px]">
                {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300"><Package size={80}/></div>
                )}
            </div>

            {/* DETALHES */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="mb-2">
                    <Badge variant="secondary" className="mb-2">{product.category || "Geral"}</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{product.name}</h1>
                </div>

                <div className="text-3xl font-bold text-purple-600 mt-4">
                    R$ {product.price.toFixed(2)}
                    {product.unit !== 'un' && <span className="text-sm text-slate-400 font-normal ml-1">/{product.unit}</span>}
                </div>

                {product.description && (
                    <p className="text-slate-600 mt-6 leading-relaxed border-t pt-4">
                        {product.description}
                    </p>
                )}

                <div className="mt-8 space-y-4">
                    <Button onClick={handleAddToCart} size="lg" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-lg gap-2 shadow-lg shadow-slate-200">
                        <ShoppingCart /> Adicionar ao Carrinho
                    </Button>
                    
                    <div className="flex items-center justify-center gap-6 text-xs text-slate-400 mt-4">
                        <span className="flex items-center gap-1"><ShieldCheck size={14}/> Compra Segura</span>
                        <span className="flex items-center gap-1"><Check size={14}/> Estoque Disponível</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}