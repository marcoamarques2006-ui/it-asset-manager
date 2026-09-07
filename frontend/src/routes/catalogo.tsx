import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/itsm/placeholder";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — Servia ITSM" },
      { name: "description", content: "Catálogo da operação de TI na plataforma Servia ITSM." },
      { property: "og:title", content: "Catálogo — Servia ITSM" },
      { property: "og:description", content: "Catálogo da operação de TI na plataforma Servia ITSM." },
    ],
  }),
  component: () => (
    <PlaceholderPage
      title="Catálogo"
      description="Esta área ainda está em construção. Diga o que deseja ver aqui e eu monto a tela."
    />
  ),
});
