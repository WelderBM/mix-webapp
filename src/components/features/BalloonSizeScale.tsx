import {
  PERSON_CM,
  balloonSizeImage,
  balloonSizeLabel,
  personSilhouetteImage,
  sizeScale,
} from "@/lib/balloonTypeArt";

// Referência de tamanho do montador (#322): uma pessoa de 1,70 m e cada
// tamanho disponível na mesma escala, sobre o mesmo chão. Ajuda a cliente
// a entender o tamanho real (9" é bem menor que 40 cm).
const HEIGHT = 150; // px da pessoa; cabe no celular de 360 px

function Column({ img, px, label }: { img: string; px: number; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ minWidth: 44 }}>
      <div className="flex w-full items-end justify-center border-b-2 border-slate-300" style={{ height: HEIGHT }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador */}
        <img src={img} alt="" style={{ height: px, width: "auto", maxWidth: "none" }} />
      </div>
      <span className="mt-1 whitespace-nowrap text-[11px] leading-tight text-slate-600">{label}</span>
    </div>
  );
}

export function BalloonSizeScale({ typeId, sizes }: { typeId: string; sizes: string[] }) {
  const items = sizeScale(typeId, sizes, HEIGHT);
  if (items.length === 0) return null; // canudo: tamanho único, não é medida
  const balloon = balloonSizeImage(typeId);
  return (
    <figure className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex justify-center gap-2 overflow-x-auto">
        <Column img={personSilhouetteImage()} px={HEIGHT} label="1,70 m" />
        {items.map((it) => (
          <Column
            key={it.size}
            img={balloon}
            px={it.px}
            label={balloonSizeLabel(typeId, it.size).split(" · ")[0]}
          />
        ))}
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-500">
        Balões na escala de uma pessoa de {String(PERSON_CM / 100).replace(".", ",")} m
      </figcaption>
    </figure>
  );
}
