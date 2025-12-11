import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export function Footer() {
  // Link para o Google Maps Embed (Busca pelo Place ID da Mix Novidades)
  // Isso garante que o pino apareça exatamente no local correto
  const mapUrl =
    "https://www.google.com/maps/embed/v1/place?q=place_id:ChIJAXzTCekEk40R2tX0hOMKjMs&key=SUA_API_KEY_AQUI";
  // NOTA: Para produção sem marca d'água, você precisará de uma API Key do Google.
  // Por enquanto, usamos a versão de busca que costuma funcionar bem:
  const publicMapUrl =
    "https://maps.google.com/maps?q=Mix+Novidades+Boa+Vista+Roraima&t=&z=15&ie=UTF8&iwloc=&output=embed";

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12">
        {/* Coluna 1: Informações */}
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Mix Novidades
            </h3>
            <p className="text-slate-400 text-sm">
              Sua loja de presentes, Natura e utilidades em Boa Vista.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="https://maps.app.goo.gl/seuLinkAqui"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group cursor-pointer hover:text-white transition-colors"
            >
              <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-purple-600 transition-colors">
                <MapPin className="text-white shrink-0" size={20} />
              </div>
              <p className="text-sm leading-relaxed mt-1">
                Rua Pedro Aldemar Bantim, 945
                <br />
                Sen. Hélio Campos (Silvio Botelho)
                <br />
                Boa Vista - RR, 69316-544
              </p>
            </a>

            <a
              href="https://wa.me/5595984244194"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group cursor-pointer hover:text-white transition-colors"
            >
              <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-green-600 transition-colors">
                <Phone className="text-white shrink-0" size={20} />
              </div>
              <p className="text-sm mt-1 font-medium">+55 95 98424-4194</p>
            </a>

            <div className="flex items-start gap-3 hover:text-white transition-colors">
              <div className="bg-slate-800 p-2 rounded-lg">
                <Clock className="text-white shrink-0" size={20} />
              </div>
              <div className="text-sm mt-1">
                <p>
                  <span className="font-semibold text-purple-400">
                    Seg - Sáb:
                  </span>{" "}
                  08:00 às 19:00
                </p>
                <p>
                  <span className="font-semibold text-purple-400">
                    Domingo:
                  </span>{" "}
                  08:00 às 12:00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Mapa */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700 h-64 md:h-full bg-slate-800 relative group">
          <iframe
            src={publicMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
          ></iframe>

          {/* Label flutuante */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none flex items-center gap-1">
            📍 Mix Novidades
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-12 pt-8 text-center">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Mix WebApp. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
