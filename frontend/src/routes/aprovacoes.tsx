import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/aprovacoes")({
  head: () => ({
    meta: [
      { title: "Aprovações — Servia ITSM" },
      {
        name: "description",
        content: "Aprovações da operação de TI na plataforma Servia ITSM.",
      },
      { property: "og:title", content: "Aprovações — Servia ITSM" },
      {
        property: "og:description",
        content: "Aprovações da operação de TI na plataforma Servia ITSM.",
      },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Aprovações"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
