import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/ativos")({
  head: () => ({
    meta: [
      { title: "Ativos — Servia ITSM" },
      { name: "description", content: "Ativos da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Ativos — Servia ITSM" },
      { property: "og:description", content: "Ativos da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Ativos"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
