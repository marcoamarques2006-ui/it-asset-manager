import { ItsmLayout, Panel } from "@/components/itsm/layout";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <ItsmLayout title={title}>
      <Panel title={title}>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Panel>
    </ItsmLayout>
  );
}
