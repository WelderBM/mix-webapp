import { Metadata } from "next";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StoreSection } from "@/types";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/features/CartSidebar";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Leaf,
  Sparkles,
  Heart,
  MapPin,
  Phone,
  Star,
  ArrowRight,
  Droplet,
  Flower2,
  Wind,
  Sun,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title:
    "Natura em Boa Vista RR | Perfumes, Cosméticos e Maquiagem | Mix Novidades",
  description:
    "Procurando produtos Natura em Boa Vista - Roraima? A Mix Novidades tem perfumes, cosméticos, maquiagem e kits exclusivos com entrega rápida no Sen. Hélio Campos. Compre online!",
  keywords: [
    "natura boa vista rr",
    "perfumes natura boa vista",
    "cosméticos natura roraima",
    "maquiagem natura boa vista",
    "kaiak natura",
    "ekos natura boa vista",
    "tododia natura",
    "consultoria natura sen helio campos",
  ],
  alternates: {
    canonical: "https://mixnovidades.com.br/natura",
  },
};

interface NaturaPageSettings {
  sections: StoreSection[];
}

export default async function NaturaPage() {
  const [productsSnap, settingsSnap] = await Promise.all([
    getDocs(query(collection(db, "products"), orderBy("name"))),
    getDoc(doc(db, "settings", "natura")),
  ]);

  const products = productsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];

  const settings = settingsSnap.exists()
    ? (settingsSnap.data() as NaturaPageSettings)
    : { sections: [] };

  const activeSections = settings.sections?.filter((s) => s.isActive) || [];

  return (
    <main className="bg-slate-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative py-20 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-15" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/80 to-transparent" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm font-bold border border-green-500/30 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            🌿 Produtos Originais Natura
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Natura em Boa Vista <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-400">
              Beleza e Bem-Estar
            </span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Encontre perfumes, cosméticos, maquiagem e kits exclusivos Natura no
            bairro Sen. Hélio Campos. Consultoria especializada e entrega
            rápida!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <a href="#produtos">
              <Button className="h-14 px-8 text-lg font-bold rounded-full bg-green-600 hover:bg-green-700 shadow-xl shadow-green-900/50 transition-all hover:scale-105">
                Ver Produtos Natura
              </Button>
            </a>
            <Link href="https://wa.me/5595984244194" target="_blank">
              <Button
                variant="outline"
                className="h-14 px-8 text-lg font-bold rounded-full text-white border-white/20 hover:bg-white/10 hover:border-white transition-all bg-transparent"
              >
                <Phone className="mr-2 h-5 w-5" /> Falar no WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO CONTENT SECTION */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-slate-800">
                Por que escolher Natura na Mix Novidades?
              </h2>
              <div className="space-y-4">
                <FeatureItem
                  title="Produtos 100% Originais"
                  desc="Trabalhamos exclusivamente com produtos originais Natura. Garantia de qualidade e autenticidade em todos os itens."
                />
                <FeatureItem
                  title="Consultoria Especializada"
                  desc="Nossa equipe conhece profundamente a linha Natura e pode te ajudar a escolher os produtos ideais para você."
                />
                <FeatureItem
                  title="Entrega Rápida em Boa Vista"
                  desc="Localização privilegiada no Sen. Hélio Campos com opções de entrega rápida para toda Boa Vista."
                />
                <FeatureItem
                  title="Variedade Completa"
                  desc="Perfumes, cosméticos, maquiagem, produtos para cabelo e corpo. Tudo da Natura em um só lugar."
                />
              </div>
            </div>

            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl group border-4 border-white">
              <SafeImage
                src="/loja-fachada.webp"
                alt="Mix Novidades - Consultoria Natura em Boa Vista"
                name="Fachada Mix Novidades"
                fill
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 text-white z-10">
                <p className="font-bold text-lg flex items-center gap-2">
                  <MapPin size={18} className="text-green-400" /> Mix Novidades
                </p>
                <p className="text-sm opacity-90 pl-6">
                  Rua Pedro Aldemar Bantim, 945
                  <br /> Sen. Hélio Campos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LINHAS NATURA - SEO RICH CONTENT */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Principais Linhas Natura em Boa Vista
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Descubra as fragrâncias e produtos que conquistaram o Brasil e
              estão disponíveis na Mix Novidades
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductLineCard
              icon={<Wind className="w-8 h-8" />}
              name="Kaiak"
              desc="Perfumes masculinos e femininos com fragrâncias marcantes e duradouras"
              color="blue"
            />
            <ProductLineCard
              icon={<Leaf className="w-8 h-8" />}
              name="Ekos"
              desc="Cosméticos naturais com ingredientes da biodiversidade brasileira"
              color="green"
            />
            <ProductLineCard
              icon={<Droplet className="w-8 h-8" />}
              name="Tododia"
              desc="Hidratantes e sabonetes líquidos para cuidado diário da pele"
              color="purple"
            />
            <ProductLineCard
              icon={<Flower2 className="w-8 h-8" />}
              name="Chronos"
              desc="Linha anti-idade com tecnologia avançada para rejuvenescimento"
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* DYNAMIC PRODUCT SECTIONS */}
      <section id="produtos" className="py-16 bg-slate-50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
              Nossos Produtos Natura
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Navegue pelas nossas vitrines especialmente organizadas para você
              encontrar exatamente o que precisa
            </p>
          </div>

          {activeSections.length > 0 ? (
            <div className="space-y-16">
              {activeSections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  products={products}
                  onScrollRequest={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <Leaf className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <h3 className="text-2xl font-bold text-slate-700 mb-2">
                Em breve, novos produtos! 🌿
              </h3>
              <p className="text-slate-500">
                Estamos organizando nossa vitrine Natura. Volte em breve!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SEO TEXT BLOCK - NATURA INFO */}
      <section className="py-16 bg-linear-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Leaf className="text-green-600" size={32} />
              Natura em Boa Vista: Beleza Sustentável e Brasileira
            </h2>

            <p className="text-slate-700 leading-relaxed mb-4">
              A <strong>Natura</strong> é uma das marcas de cosméticos mais
              amadas do Brasil, conhecida por sua filosofia de{" "}
              <strong>beleza sustentável</strong> e produtos de alta qualidade.
              Na <strong>Mix Novidades em Boa Vista - RR</strong>, você encontra
              toda a linha Natura com atendimento personalizado e entrega rápida
              no bairro <strong>Sen. Hélio Campos</strong>.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">
              Perfumes Natura: Fragrâncias Inesquecíveis
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Os <strong>perfumes Natura</strong> são referência em qualidade e
              durabilidade. Linhas como <strong>Kaiak</strong>,{" "}
              <strong>Luna</strong>, <strong>Homem</strong> e{" "}
              <strong>Essencial</strong> oferecem opções para todos os gostos,
              desde fragrâncias amadeiradas até florais delicados. Cada perfume
              Natura conta uma história e marca presença.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">
              Cosméticos e Cuidados com a Pele
            </h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              A linha <strong>Ekos</strong> traz o melhor da{" "}
              <strong>biodiversidade brasileira</strong> em produtos para cabelo
              e corpo. <strong>Tododia</strong> oferece hidratação intensa com
              fragrâncias incríveis. Já <strong>Chronos</strong> é a escolha
              perfeita para quem busca tratamento anti-idade com tecnologia de
              ponta.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">
              Maquiagem Natura: Beleza com Propósito
            </h3>
            <p className="text-slate-700 leading-relaxed">
              A linha <strong>Una</strong> de maquiagem Natura oferece produtos
              veganos e de alta performance. Batons, bases, sombras e muito mais
              para realçar sua beleza natural com qualidade profissional.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-black text-center text-slate-800 mb-12">
            Perguntas Frequentes sobre Natura
          </h2>

          <div className="grid gap-6">
            <FaqItem
              q="Onde comprar produtos Natura em Boa Vista?"
              a="Na Mix Novidades você encontra a linha completa de produtos Natura com consultoria especializada. Nossa loja fica no Senador Hélio Campos, fácil acesso e estacionamento."
            />
            <FaqItem
              q="Os produtos Natura da Mix Novidades são originais?"
              a="Sim! Trabalhamos exclusivamente com produtos 100% originais Natura, garantindo qualidade, segurança e todos os benefícios da marca."
            />
            <FaqItem
              q="Posso fazer pedidos online e retirar na loja?"
              a="Sim! Você pode ver nossos produtos no site, fazer seu pedido via WhatsApp e retirar na loja ou solicitar entrega em Boa Vista."
            />
            <FaqItem
              q="Quais linhas Natura vocês têm disponíveis?"
              a="Temos Kaiak, Ekos, Tododia, Chronos, Plant, Faces, perfumes masculinos e femininos, além de produtos para cabelo, corpo e maquiagem."
            />
            <FaqItem
              q="Natura tem produtos veganos?"
              a="Sim! A Natura possui diversas linhas veganas, incluindo a linha Una de maquiagem e vários produtos da linha Plant. Consulte nossa equipe para mais informações."
            />
          </div>
        </div>
      </section>

      {/* MAPA / LOCALIZAÇÃO */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-slate-800 mb-2">
            Venha nos visitar
          </h2>
          <p className="text-slate-500 mb-8">
            Rua Pedro Aldemar Bantim, 945 - Sen. Hélio Campos - Boa Vista RR
          </p>

          <div className="max-w-5xl mx-auto h-96 rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-200 relative">
            <iframe
              src="https://maps.google.com/maps?q=Mix%20Novidades%20Boa%20Vista&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-700 block"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-16 bg-green-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Descubra a beleza Natura
          </h2>
          <a href="#produtos">
            <Button className="h-16 px-10 text-xl font-bold bg-white text-green-900 hover:bg-slate-100 rounded-full shadow-lg hover:scale-105 transition-all">
              Ver Todos os Produtos <ArrowRight className="ml-2" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
      <CartSidebar />
    </main>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
      <div className="bg-green-100 p-3 rounded-lg h-fit text-green-600">
        <Star className="fill-green-600" size={20} />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ProductLineCard({
  icon,
  name,
  desc,
  color,
}: {
  icon: React.ReactNode;
  name: string;
  desc: string;
  color: "blue" | "green" | "purple" | "pink";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400",
    green: "bg-green-50 text-green-600 border-green-200 hover:border-green-400",
    purple:
      "bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400",
    pink: "bg-pink-50 text-pink-600 border-pink-200 hover:border-pink-400",
  };

  return (
    <div
      className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-105 ${colorClasses[color]}`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-black mb-2">{name}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-green-200 transition-colors">
      <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
        <span className="text-green-600">?</span> {q}
      </h3>
      <p className="text-slate-600 pl-5">{a}</p>
    </div>
  );
}
