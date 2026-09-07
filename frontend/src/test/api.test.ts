import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from "@/lib/supabase";
import {
  createDevice,
  fetchDevices,
  updateDevice,
  type Device,
} from "@/lib/api";

const device: Device = {
  id: "1",
  hostname: "PC-001",
  tipo: "desktop",
  fabricante: null,
  modelo: null,
  serial_number: null,
  status: "estoque",
  localizacao: null,
  usuario_responsavel: null,
  observacoes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function mockBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder["select"] = vi.fn(() => builder);
  builder["insert"] = vi.fn(() => builder);
  builder["update"] = vi.fn(() => builder);
  builder["eq"] = vi.fn(() => builder);
  builder["order"] = vi.fn(() => Promise.resolve(result));
  builder["single"] = vi.fn(() => Promise.resolve(result));
  return builder;
}

describe("api (Supabase)", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("fetchDevices retorna a lista ordenada por created_at", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockBuilder({ data: [device], error: null }) as never,
    );

    const result = await fetchDevices();

    expect(supabase.from).toHaveBeenCalledWith("devices");
    expect(result).toEqual([device]);
  });

  it("createDevice retorna o device criado", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockBuilder({ data: device, error: null }) as never,
    );

    const result = await createDevice({ hostname: "PC-001", tipo: "desktop" });

    expect(result).toEqual(device);
  });

  it("createDevice mapeia erro de serial duplicado (23505) pra mensagem amigável", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockBuilder({
        data: null,
        error: { code: "23505", message: "duplicate key value violates ..." },
      }) as never,
    );

    await expect(
      createDevice({
        hostname: "PC-001",
        tipo: "desktop",
        serial_number: "SN-1",
      }),
    ).rejects.toThrow("Já existe um device com esse número de série");
  });

  it("updateDevice retorna o device atualizado", async () => {
    const updated = { ...device, status: "manutencao" as const };
    vi.mocked(supabase.from).mockReturnValue(
      mockBuilder({ data: updated, error: null }) as never,
    );

    const result = await updateDevice("1", {
      hostname: "PC-001",
      tipo: "desktop",
    });

    expect(result).toEqual(updated);
  });
});
