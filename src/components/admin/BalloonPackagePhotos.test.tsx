// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BalloonPackagePhotos, packageQuery } from "./BalloonPackagePhotos";
import type { BalloonConfig } from "@/types/balloon";

vi.mock("@/lib/firebase", () => ({ storage: {}, db: {} }));
vi.mock("firebase/storage", () => ({ ref: vi.fn(), uploadBytes: vi.fn(), getDownloadURL: vi.fn() }));
vi.mock("@/components/admin/ImageSearchDialog", () => ({
  ImageSearchDialog: ({ initialQuery }: { initialQuery: string }) => <div>busca: {initialQuery}</div>,
}));

const size = (s: string) => ({ size: s, price: 10, unitsPerPackage: 50 });
const config: BalloonConfig = {
  allColors: [],
  types: [
    { id: "simples", name: "Balão Simples (Liso)", brand: "São Roque", sizes: [size("9")], colors: [], imageUrl: "https://exemplo/liso.png" },
    { id: "neon", name: "Neon", brand: "São Roque", sizes: [size("5")], colors: [] },
    { id: "simples__riberball", name: "Liso Riberball", brand: "Riberball", sizes: [size("7")], colors: [] },
    { id: "foil_numeros", name: "Números & Letras (Foil)", sizes: [size("40cm")], colors: [] },
  ],
};

describe("fotos dos pacotes (admin › Balões)", () => {
  it("busca com o mesmo formato para todos os tipos", () => {
    expect(packageQuery(config.types[0])).toBe("pacote balão liso São Roque n9");
    expect(packageQuery(config.types[2])).toBe("pacote balão liso Riberball n7");
    expect(packageQuery(config.types[3])).toBe("pacote balão metalizado número letra");
  });

  it("lista os tipos por marca, conta os sem foto e abre a busca do tipo certo", () => {
    render(<BalloonPackagePhotos config={config} onChange={() => {}} />);
    expect(screen.getByText("3 sem foto.")).toBeTruthy();
    expect(screen.getByAltText("Pacote Balão Simples (Liso)")).toBeTruthy();
    fireEvent.click(screen.getAllByText("Buscar foto do pacote")[0]);
    expect(screen.getByText("busca: pacote balão neon São Roque n5")).toBeTruthy();
  });

  it("tirar a foto apaga o campo (sem undefined) só daquele tipo", () => {
    const onChange = vi.fn();
    render(<BalloonPackagePhotos config={config} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Tirar a foto de Balão Simples (Liso)"));
    const next = onChange.mock.calls[0][0] as BalloonConfig;
    expect("imageUrl" in next.types[0]).toBe(false);
    expect(next.types[1]).toBe(config.types[1]);
  });
});
