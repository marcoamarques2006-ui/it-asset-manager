import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Servia ITSM" },
      { name: "description", content: "Relatórios da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Relatórios — Servia ITSM" },
      { property: "og:description", content: "Relatórios da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Relatórios"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
