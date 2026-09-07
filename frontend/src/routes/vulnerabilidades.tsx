import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/vulnerabilidades")({
  head: () => ({
    meta: [
      { title: "Vulnerabilidades — Servia ITSM" },
      { name: "description", content: "Vulnerabilidades da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Vulnerabilidades — Servia ITSM" },
      { property: "og:description", content: "Vulnerabilidades da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Vulnerabilidades"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
