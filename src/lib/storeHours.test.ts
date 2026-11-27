import { describe, expect, it } from "vitest";
import {
  STORE_HOURS,
  STORE_HOURS_DISPLAY,
  formatHour,
  openingHoursSpecification,
} from "./storeHours";

describe("storeHours", () => {
  it("seg a sáb 8h às 19h, domingo 9h às 13h (dono, 26/11/2026)", () => {
    for (let day = 1; day <= 6; day++) {
      expect(STORE_HOURS[day]).toEqual({ open: 8, close: 19 });
    }
    expect(STORE_HOURS[0]).toEqual({ open: 9, close: 13 });
  });

  it("formatHour usa HH:MM", () => {
    expect(formatHour(8)).toBe("08:00");
    expect(formatHour(19)).toBe("19:00");
    expect(formatHour(8.5)).toBe("08:30");
  });

  it("linhas de exibição batem com a tabela", () => {
    expect(STORE_HOURS_DISPLAY).toEqual([
      { label: "Seg a Sáb", open: "08:00", close: "19:00" },
      { label: "Domingo", open: "09:00", close: "13:00" },
    ]);
  });

  it("schema.org agrupa os dias com o mesmo horário", () => {
    expect(openingHoursSpecification()).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday"],
        opens: "09:00",
        closes: "13:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "19:00",
      },
    ]);
  });
});
