import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Device } from "@/lib/api";
import { renderWithQueryClient } from "@/test/query-client";

import { DeviceFormDialog } from "./device-form-dialog";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, createDevice: vi.fn(), updateDevice: vi.fn() };
});

import * as api from "@/lib/api";

const existingDevice: Device = {
  id: "1",
  hostname: "PC-EXISTENTE",
  tipo: "notebook",
  status: "em_uso",
  fabricante: "Dell",
  modelo: null,
  serial_number: null,
  localizacao: null,
  usuario_responsavel: null,
  observacoes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("DeviceFormDialog", () => {
  beforeEach(() => {
    vi.mocked(api.createDevice).mockReset();
    vi.mocked(api.updateDevice).mockReset();
  });

  it("mostra erro de validação quando hostname está vazio", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <DeviceFormDialog open={true} onOpenChange={() => {}} />,
    );

    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByText("Obrigatório")).toBeInTheDocument();
    expect(api.createDevice).not.toHaveBeenCalled();
  });

  it("chama createDevice com os dados preenchidos e fecha o modal", async () => {
    vi.mocked(api.createDevice).mockResolvedValue({
      ...existingDevice,
      id: "2",
      hostname: "PC-NOVO",
    });
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithQueryClient(
      <DeviceFormDialog open={true} onOpenChange={onOpenChange} />,
    );

    await user.type(screen.getByLabelText("Hostname"), "PC-NOVO");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(api.createDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: "PC-NOVO",
          tipo: "desktop",
          status: "estoque",
        }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("preenche os campos com os dados do device ao editar", async () => {
    renderWithQueryClient(
      <DeviceFormDialog
        device={existingDevice}
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("Editar ativo")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("PC-EXISTENTE")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro da API quando a mutação falha", async () => {
    vi.mocked(api.createDevice).mockRejectedValue(
      new Error("Já existe um device com esse serial_number"),
    );
    const user = userEvent.setup();

    renderWithQueryClient(
      <DeviceFormDialog open={true} onOpenChange={() => {}} />,
    );

    await user.type(screen.getByLabelText("Hostname"), "PC-DUP");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(
      await screen.findByText("Já existe um device com esse serial_number"),
    ).toBeInTheDocument();
  });
});
