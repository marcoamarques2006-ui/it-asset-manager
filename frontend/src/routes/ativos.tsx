import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { DeviceFormDialog } from "@/components/itsm/device-form-dialog";
import { ItsmLayout, Panel } from "@/components/itsm/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchDevices,
  type Device,
  type DeviceStatus,
  type DeviceType,
} from "@/lib/api";

export const Route = createFileRoute("/ativos")({
  head: () => ({
    meta: [
      { title: "Ativos — Servia ITSM" },
      {
        name: "description",
        content: "Ativos da operação de TI na plataforma Servia ITSM.",
      },
      { property: "og:title", content: "Ativos — Servia ITSM" },
      {
        property: "og:description",
        content: "Ativos da operação de TI na plataforma Servia ITSM.",
      },
    ],
  }),
  component: AtivosPage,
});

const tipoLabel: Record<DeviceType, string> = {
  desktop: "Desktop",
  notebook: "Notebook",
  servidor: "Servidor",
  impressora: "Impressora",
  monitor: "Monitor",
  outro: "Outro",
};

const statusLabel: Record<DeviceStatus, string> = {
  em_uso: "Em uso",
  estoque: "Estoque",
  manutencao: "Manutenção",
  baixado: "Baixado",
};

const statusVariant: Record<
  DeviceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  em_uso: "default",
  estoque: "secondary",
  manutencao: "outline",
  baixado: "destructive",
};

export function AtivosPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["devices"],
    queryFn: fetchDevices,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>(
    undefined,
  );

  function openCreateForm() {
    setEditingDevice(undefined);
    setFormOpen(true);
  }

  function openEditForm(device: Device) {
    setEditingDevice(device);
    setFormOpen(true);
  }

  return (
    <ItsmLayout title="Ativos" breadcrumb="Ativos">
      <Panel
        title="Dispositivos"
        action={
          <Button size="sm" onClick={openCreateForm}>
            <Plus /> Novo ativo
          </Button>
        }
      >
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando ativos…</p>
        )}

        {isError && (
          <p className="text-sm text-critical">
            {error instanceof Error
              ? error.message
              : "Erro ao carregar ativos."}
          </p>
        )}

        {!isLoading && !isError && data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum ativo cadastrado.
          </p>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fabricante/Modelo</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium text-foreground">
                    {device.hostname}
                  </TableCell>
                  <TableCell>{tipoLabel[device.tipo]}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[device.status]}>
                      {statusLabel[device.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {[device.fabricante, device.modelo]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell>{device.serial_number ?? "—"}</TableCell>
                  <TableCell>{device.localizacao ?? "—"}</TableCell>
                  <TableCell>{device.usuario_responsavel ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${device.hostname}`}
                      onClick={() => openEditForm(device)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <DeviceFormDialog
        device={editingDevice}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </ItsmLayout>
  );
}
