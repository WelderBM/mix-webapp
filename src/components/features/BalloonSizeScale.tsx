import {
  balloonSizeImage,
  balloonSizeLabel,
  personSilhouetteImage,
  sizeScale,
} from "@/lib/balloonTypeArt";

// Referência de tamanho do montador (#322): uma pessoa de 1,70 m e cada
// tamanho disponível na mesma escala, sobre o mesmo chão. Ajuda a cliente
// a entender o tamanho real (9" é bem menor que 40 cm).
const HEIGHT = 150; // px da pessoa; cabe no celular de 360 px
// No desenho do balão (512 px), o corpo tem 240 px de largura: o resto é
// nó e fio. A escala vale para o DIÂMETRO do balão, não para a imagem.
const BODY_RATIO = 240 / 512;

function Column({ img, px, label, minHeight }: { img: string; px: number; label: string; minHeight: number }) {
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ minWidth: 44 }}>
      <div className="flex w-full items-end justify-center border-b-2 border-slate-300" style={{ height: minHeight }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador */}
        <img src={img} alt="" style={{ height: px, width: "auto", maxWidth: "none" }} />
      </div>
      <span className="mt-1 whitespace-nowrap text-[11px] leading-tight text-slate-600">{label}</span>
    </div>
  );
}

export function BalloonSizeScale({ typeId, sizes }: { typeId: string; sizes: string[] }) {
  const items = sizeScale(typeId, sizes, HEIGHT).map((it) => ({
    ...it,
    img: Math.round(it.px / BODY_RATIO),
  }));
  if (items.length === 0) return null; // canudo: tamanho único, não é medida
  const balloon = balloonSizeImage(typeId);
  // Balão grande com fio pode passar da pessoa: o chão acompanha.
  const h = Math.max(HEIGHT, ...items.map((it) => it.img));
  return (
    <figure className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {/* w-max + mx-auto: centraliza quando cabe e rola sem cortar a pessoa quando não cabe. */}
      <div className="overflow-x-auto">
        <div className="mx-auto flex w-max gap-2">
          <Column img={personSilhouetteImage()} px={HEIGHT} label="1,70 m" minHeight={h} />
          {items.map((it) => (
            <Column
              key={it.size}
              img={balloon}
              px={it.img}
              label={balloonSizeLabel(typeId, it.size).split(" · ")[0]}
              minHeight={h}
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
