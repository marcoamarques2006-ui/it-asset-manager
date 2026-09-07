import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createDevice,
  updateDevice,
  type Device,
  type DeviceStatus,
  type DeviceType,
} from "@/lib/api";

const optionalText = z
  .string()
  .transform((v) => (v.trim() === "" ? null : v))
  .nullable()
  .optional();

const deviceSchema = z.object({
  hostname: z.string().trim().min(1, "Obrigatório").max(255),
  tipo: z.enum([
    "desktop",
    "notebook",
    "servidor",
    "impressora",
    "monitor",
    "outro",
  ]),
  status: z.enum(["em_uso", "estoque", "manutencao", "baixado"]),
  fabricante: optionalText,
  modelo: optionalText,
  serial_number: optionalText,
  localizacao: optionalText,
  usuario_responsavel: optionalText,
  observacoes: optionalText,
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

const tipoOptions: { value: DeviceType; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "notebook", label: "Notebook" },
  { value: "servidor", label: "Servidor" },
  { value: "impressora", label: "Impressora" },
  { value: "monitor", label: "Monitor" },
  { value: "outro", label: "Outro" },
];

const statusOptions: { value: DeviceStatus; label: string }[] = [
  { value: "estoque", label: "Estoque" },
  { value: "em_uso", label: "Em uso" },
  { value: "manutencao", label: "Manutenção" },
  { value: "baixado", label: "Baixado" },
];

const emptyValues: DeviceFormValues = {
  hostname: "",
  tipo: "desktop",
  status: "estoque",
  fabricante: null,
  modelo: null,
  serial_number: null,
  localizacao: null,
  usuario_responsavel: null,
  observacoes: null,
};

function deviceToFormValues(device: Device): DeviceFormValues {
  return {
    hostname: device.hostname,
    tipo: device.tipo,
    status: device.status,
    fabricante: device.fabricante,
    modelo: device.modelo,
    serial_number: device.serial_number,
    localizacao: device.localizacao,
    usuario_responsavel: device.usuario_responsavel,
    observacoes: device.observacoes,
  };
}

export function DeviceFormDialog({
  device,
  open,
  onOpenChange,
}: {
  device?: Device | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!device;

  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(device ? deviceToFormValues(device) : emptyValues);
    }
  }, [open, device, form]);

  const mutation = useMutation({
    mutationFn: (values: DeviceFormValues) =>
      isEditing ? updateDevice(device.id, values) : createDevice(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar ativo" : "Novo ativo"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="hostname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostname</FormLabel>
                  <FormControl>
                    <Input placeholder="NB-FIN-042" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fabricante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricante</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de série</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usuario_responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário responsável</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mutation.isError && (
              <p className="text-sm text-critical">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Erro ao salvar ativo."}
              </p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
