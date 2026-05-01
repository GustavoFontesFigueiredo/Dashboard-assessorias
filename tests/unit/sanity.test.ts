import { describe, expect, it } from "vitest";
import { formatBRL, formatCNPJ, formatPercent } from "@/lib/formatters";

describe("formatters (PT-BR / BRL)", () => {
  it("formats BRL with two decimals", () => {
    expect(formatBRL(1234.5)).toMatch(/R\$\s?1\.234,50/);
  });

  it("returns em-dash for null/undefined/NaN", () => {
    expect(formatBRL(null)).toBe("—");
    expect(formatBRL(undefined)).toBe("—");
    expect(formatBRL(Number.NaN)).toBe("—");
  });

  it("formats percent in pt-BR", () => {
    expect(formatPercent(0.123)).toMatch(/12,3\s?%/);
  });

  it("masks a CNPJ", () => {
    expect(formatCNPJ("12345678000199")).toBe("12.345.678/0001-99");
  });
});
