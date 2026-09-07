import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Servia ITSM" },
      { name: "description", content: "Histórico da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Histórico — Servia ITSM" },
      { property: "og:description", content: "Histórico da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Histórico"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
