import {
  balloonColorImage,
  balloonSizeImage,
  balloonSizeLabel,
  personSilhouetteImage,
  sizeScale,
} from "@/lib/balloonTypeArt";

// Referência de tamanho do montador (#322): uma pessoa de 1,70 m e cada
// tamanho disponível na mesma escala, sobre o mesmo chão. Ajuda a cliente
// a entender o tamanho real (9" é bem menor que 40 cm).
const HEIGHT = 150; // px da pessoa; cabe no celular de 360 px
// A escala vale para o BALÃO, não para a imagem (512 px):
// - látex: o corpo tem ~216 px de largura; o resto é nó e fio (fica pendurado);
// - foil: um "0" (fonte 360, centro em y=268) tem ~259 px de altura e sobram
//   ~114 px vazios embaixo, que descem para o número encostar no chão.
const LATEX = { ratio: 216 / 512, below: 0 };
const FOIL = { ratio: 259 / 512, below: 114 / 512 };

function Column({
  img,
  px,
  label,
  minHeight,
  below = 0,
}: {
  img: string;
  px: number;
  label: string;
  minHeight: number;
  below?: number;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ minWidth: 44 }}>
      <div className="flex w-full items-end justify-center border-b-2 border-slate-300" style={{ height: minHeight }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador */}
        <img
          src={img}
          alt=""
          style={{ height: px, width: "auto", maxWidth: "none", marginBottom: -Math.round(px * below) }}
        />
      </div>
      <span className="mt-1 whitespace-nowrap text-[11px] leading-tight text-slate-600">{label}</span>
    </div>
  );
}

export function BalloonSizeScale({ typeId, sizes }: { typeId: string; sizes: string[] }) {
  const foil = typeId.split("__")[0] === "foil_numeros";
  const art = foil ? FOIL : LATEX;
  const items = sizeScale(typeId, sizes, HEIGHT).map((it) => ({
    ...it,
    img: Math.round(it.px / art.ratio),
  }));
  if (items.length === 0) return null; // canudo: tamanho único, não é medida
  const balloon = foil ? balloonColorImage(typeId, "#d4a017", "0") : balloonSizeImage(typeId);
  // Balão grande com fio pode passar da pessoa: o chão acompanha.
  const h = Math.max(HEIGHT, ...items.map((it) => Math.round(it.img * (1 - art.below))));
  return (
    <figure className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {/* w-max + mx-auto: centraliza quando cabe e rola sem cortar a pessoa quando não cabe. */}
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="mx-auto flex w-max gap-2">
          <Column img={personSilhouetteImage()} px={HEIGHT} label="1,70 m" minHeight={h} />
          {items.map((it) => (
            <Column
              key={it.size}
              img={balloon}
              px={it.img}
              label={balloonSizeLabel(typeId, it.size).split(" · ")[0]}
              minHeight={h}
              below={art.below}
            />
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-500">
        Balões na escala de uma pessoa de 1,70 m
      </figcaption>
    </figure>
  );
}

// Foil (#344): o texto que a cliente digitou, na cor escolhida, em tamanho
// real ao lado da pessoa de 1,70 m. Cada palavra é um grupo; as letras
// ficam encostadas como na festa (a imagem tem sobra dos lados).
export function FoilTextScale({
  typeId,
  size,
  text,
  hexes,
}: {
  typeId: string;
  size: string;
  text: string;
  hexes: string[];
}) {
  const [scaled] = sizeScale(typeId, [size], HEIGHT);
  const words = text.split(" ").filter(Boolean);
  if (!scaled || words.length === 0) return null;
  const img = Math.round(scaled.px / FOIL.ratio);
  const side = -Math.round(img * 0.2);
  return (
    <figure className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3" aria-hidden="true">
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="mx-auto flex w-max items-end gap-3">
          <Column img={personSilhouetteImage()} px={HEIGHT} label="1,70 m" minHeight={HEIGHT} />
          {words.map((word, w) => (
            <div key={`${word}-${w}`} className="flex shrink-0 flex-col items-center">
              <div
                className="flex items-end border-b-2 border-slate-300"
                style={{ height: HEIGHT, paddingInline: -side }}
              >
                {word.split("").map((ch, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador
                  <img
                    key={`${ch}-${i}`}
                    src={balloonColorImage(typeId, hexes, ch)}
                    alt=""
                    style={{
                      height: img,
                      width: img,
                      maxWidth: "none",
                      marginInline: side,
                      marginBottom: -Math.round(img * FOIL.below),
                    }}
                  />
                ))}
              </div>
              <span className="mt-1 whitespace-nowrap text-[11px] leading-tight text-slate-600">
                {balloonSizeLabel(typeId, size).split(" · ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-500">
        Seu texto no tamanho real, ao lado de uma pessoa de 1,70 m
      </figcaption>
    </figure>
  );
}
