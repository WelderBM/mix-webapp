import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, CheckCircle, Star, ArrowRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

export const metadata: Metadata = {
  title: "Balões em Boa Vista RR | Mix Novidades - Decoração de Festas",
  description:
    "Procurando balões em Boa Vista - Roraima? A Mix Novidades tem a maior variedade de cores e modelos da São Roque, Metalizados e muito mais. Faça seu orçamento online!",
  keywords: [
    "balões boa vista rr",
    "artigos de festa boa vista",
    "balões são roque boa vista",
    "decoração de festa roraima",
    "loja de balões sen helio campos",
  ],
  alternates: {
    canonical: "https://mixnovidades.com.br/baloes-boa-vista",
  },
};

export default function BaloesBoaVistaPage() {
  return (
    <main className="bg-slate-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative py-20 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530103862676-de3c9da59af7?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/80 to-transparent" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold border border-purple-500/30 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            🎈 Sua festa começa aqui
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            A Maior Variedade de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Balões em Boa Vista
            </span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            Encontre balões São Roque, metalizados, candy colors e tudo para sua
            decoração no bairro Sen. Hélio Campos. Simule seu pedido online e
            retire na loja!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <Link href="/baloes">
              <Button className="h-14 px-8 text-lg font-bold rounded-full bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-900/50 transition-all hover:scale-105">
                Fazer Orçamento Online
              </Button>
            </Link>
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
                Por que escolher a Mix Novidades?
              </h2>
              <div className="space-y-4">
                <FeatureItem
                  title="Catálogo Completo São Roque"
                  desc="Trabalhamos com a linha completa: Lisos, Cintilantes, Metálicos e Candy Colors. Todas as cores e tamanhos."
                />
                <FeatureItem
                  title="Orçamento Digital Inteligente"
                  desc="Não perca tempo esperando. Monte seu pacote de balões no nosso site e veja o preço na hora."
                />
                <FeatureItem
                  title="Localização Acessível"
                  desc="Estamos no coração do Sen. Hélio Campos, fácil de chegar e estacionar."
                />
                <FeatureItem
                  title="Preços Competitivos"
                  desc="Os melhores preços de Boa Vista para decoradores e festas particulares."
                />
              </div>
            </div>

            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl group border-4 border-white">
              <SafeImage
                src="/loja-fachada.webp"
                alt="Loja Mix Novidades em Boa Vista - Sen. Hélio Campos"
                name="Fachada Mix Novidades"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 text-white z-10">
                <p className="font-bold text-lg flex items-center gap-2">
                  <MapPin size={18} className="text-purple-400" /> Mix Novidades
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

      {/* FAQ / LOCAL INFO SECTION */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-black text-center text-slate-800 mb-12">
            Perguntas Frequentes
          </h2>

          <div className="grid gap-6">
            <FaqItem
              q="Onde comprar balões baratos em Boa Vista?"
              a="Na Mix Novidades você encontra balões a partir de preços acessíveis com a qualidade São Roque. Nossa loja fica no Senador Hélio Campos."
            />
            <FaqItem
              q="Quais marcas de balão vocês trabalham?"
              a="Somos especialistas na marca São Roque e Pic Pic, garantindo durabilidade e cores vivas para sua decoração profissional ou festa em casa."
            />
            <FaqItem
              q="Posso fazer o pedido pelo site e retirar na loja?"
              a="Sim! Nossa ferramenta de orçamento online permite que você escolha as cores e quantidades exatas. Ao finalizar, enviamos o pedido para separação via WhatsApp."
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
      <section className="py-16 bg-purple-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Pronto para começar sua festa?
          </h2>
          <Link href="/baloes">
            <Button className="h-16 px-10 text-xl font-bold bg-white text-purple-900 hover:bg-slate-100 rounded-full shadow-lg hover:scale-105 transition-all">
              Ver Catálogo de Balões <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
      <div className="bg-purple-100 p-3 rounded-lg h-fit text-purple-600">
        <Star className="fill-purple-600" size={20} />
      </div>
      <div>
        <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:border-purple-200 transition-colors">
      <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
        <span className="text-purple-600">?</span> {q}
      </h3>
      <p className="text-slate-600 pl-5">{a}</p>
    </div>
  );
}
