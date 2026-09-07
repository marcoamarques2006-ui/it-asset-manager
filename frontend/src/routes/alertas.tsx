import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas — Servia ITSM" },
      {
        name: "description",
        content: "Alertas da operação de TI na plataforma Servia ITSM.",
      },
      { property: "og:title", content: "Alertas — Servia ITSM" },
      {
        property: "og:description",
        content: "Alertas da operação de TI na plataforma Servia ITSM.",
      },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Alertas"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
