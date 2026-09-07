import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/chamados")({
  head: () => ({
    meta: [
      { title: "Chamados — Servia ITSM" },
      {
        name: "description",
        content: "Chamados da operação de TI na plataforma Servia ITSM.",
      },
      { property: "og:title", content: "Chamados — Servia ITSM" },
      {
        property: "og:description",
        content: "Chamados da operação de TI na plataforma Servia ITSM.",
      },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Chamados"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
