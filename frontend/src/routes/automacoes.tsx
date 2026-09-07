import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/automacoes")({
  head: () => ({
    meta: [
      { title: "Automações — Servia ITSM" },
      { name: "description", content: "Automações da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Automações — Servia ITSM" },
      { property: "og:description", content: "Automações da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Automações"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
