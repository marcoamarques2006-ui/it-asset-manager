import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/softwares")({
  head: () => ({
    meta: [
      { title: "Softwares — Servia ITSM" },
      { name: "description", content: "Softwares da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Softwares — Servia ITSM" },
      { property: "og:description", content: "Softwares da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Softwares"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
