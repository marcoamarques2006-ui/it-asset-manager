import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInWithPassword: vi.fn() } },
}));

import { supabase } from "@/lib/supabase";
import { LoginPage } from "@/routes/login";
import { renderWithQueryClient } from "@/test/query-client";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signInWithPassword).mockReset();
  });

  it("mostra erro de validação quando os campos estão vazios", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findAllByText("Obrigatório")).toHaveLength(2);
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("chama signInWithPassword com email e senha preenchidos", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never);
    const user = userEvent.setup();
    renderWithQueryClient(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "marco@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "marco@example.com",
        password: "senha-123",
      });
    });
  });

  it("mostra a mensagem de erro quando o login falha", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    } as never);
    const user = userEvent.setup();
    renderWithQueryClient(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "marco@example.com");
    await user.type(screen.getByLabelText("Senha"), "errada");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText("Invalid login credentials"),
    ).toBeInTheDocument();
  });
});
