import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { countSellableByCategory } from "@/lib/categories";
import { customerCatalog } from "@/lib/customerCatalog";
import type { KitRecipe, Product } from "@/types";

// Contagem do menu "Loja" (#399): o servidor lê o catálogo no máximo a
// cada 5 min e cada visita baixa só esta contagem (~1 KB), não a coleção
// `products` inteira. Sem `force-static` a rota rodaria a cada pedido.
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  try {
    const [productsSnap, recipesSnap] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "kit_recipes")),
    ]);
    const products = productsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Product
    );
    const recipes = recipesSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as KitRecipe
    );
    const counts = countSellableByCategory(
      customerCatalog(products, recipes).products
    );
    return Response.json({ counts });
  } catch (error) {
    console.error("Erro ao contar o menu:", (error as Error)?.message);
    // Fora do build, relança: numa revalidação com falha o Next mantém a
    // última contagem boa em vez de guardar `null` por 5 min. No build não
    // há versão anterior, então sai `null` (o menu tenta de novo no cliente).
    if (process.env.NEXT_PHASE !== "phase-production-build") throw error;
    return Response.json({ counts: null });
  }
}
