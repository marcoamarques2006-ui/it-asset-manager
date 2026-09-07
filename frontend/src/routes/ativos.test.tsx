import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Device } from "@/lib/api";
import { renderWithQueryClient } from "@/test/query-client";

import { AtivosPage } from "./ativos";

// ItsmSidebar (renderizada via ItsmLayout dentro de AtivosPage) usa
// useRouterState/Link, que só funcionam dentro de um RouterProvider real.
// Como este teste cobre o conteúdo da página, não a navegação, mockamos
// só o que a sidebar precisa em vez de montar um router completo.
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    useRouterState: () => "/ativos",
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, fetchDevices: vi.fn() };
});

import * as api from "@/lib/api";

const device: Device = {
  id: "1",
  hostname: "PC-001",
  tipo: "desktop",
  status: "em_uso",
  fabricante: "Dell",
  modelo: "OptiPlex",
  serial_number: "SN-1",
  localizacao: "Recife",
  usuario_responsavel: "Marco",
  observacoes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("AtivosPage", () => {
  beforeEach(() => {
    vi.mocked(api.fetchDevices).mockReset();
  });

  it("mostra carregando e depois a lista de ativos", async () => {
    vi.mocked(api.fetchDevices).mockResolvedValue([device]);

    renderWithQueryClient(<AtivosPage />);

    expect(screen.getByText("Carregando ativos…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("PC-001")).toBeInTheDocument();
    });
    expect(screen.getByText("Em uso")).toBeInTheDocument();
    expect(screen.getByText("Dell OptiPlex")).toBeInTheDocument();
  });

  it("mostra mensagem de vazio quando não há ativos", async () => {
    vi.mocked(api.fetchDevices).mockResolvedValue([]);

    renderWithQueryClient(<AtivosPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum ativo cadastrado.")).toBeInTheDocument();
    });
  });

  it("mostra mensagem de erro quando a API falha", async () => {
    vi.mocked(api.fetchDevices).mockRejectedValue(
      new Error("Falha ao carregar ativos"),
    );

    renderWithQueryClient(<AtivosPage />);

    await waitFor(() => {
      expect(screen.getByText("Falha ao carregar ativos")).toBeInTheDocument();
    });
  });

  it("abre o formulário de criação ao clicar em Novo ativo", async () => {
    vi.mocked(api.fetchDevices).mockResolvedValue([]);
    const user = userEvent.setup();

    renderWithQueryClient(<AtivosPage />);
    await user.click(screen.getByRole("button", { name: /novo ativo/i }));

    expect(
      screen.getByRole("heading", { name: "Novo ativo" }),
    ).toBeInTheDocument();
  });
});
