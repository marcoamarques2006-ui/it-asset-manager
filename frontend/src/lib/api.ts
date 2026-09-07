import { supabase } from "@/lib/supabase";

export type DeviceType =
  "desktop" | "notebook" | "servidor" | "impressora" | "monitor" | "outro";
export type DeviceStatus = "em_uso" | "estoque" | "manutencao" | "baixado";

export interface Device {
  id: string;
  hostname: string;
  tipo: DeviceType;
  fabricante: string | null;
  modelo: string | null;
  serial_number: string | null;
  status: DeviceStatus;
  localizacao: string | null;
  usuario_responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceInput {
  hostname: string;
  tipo: DeviceType;
  fabricante?: string | null | undefined;
  modelo?: string | null | undefined;
  serial_number?: string | null | undefined;
  status?: DeviceStatus | undefined;
  localizacao?: string | null | undefined;
  usuario_responsavel?: string | null | undefined;
  observacoes?: string | null | undefined;
}

function toFriendlyError(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    return new Error("Já existe um device com esse número de série");
  }
  return new Error(error.message);
}

export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw toFriendlyError(error);
  return data;
}

export async function createDevice(data: DeviceInput): Promise<Device> {
  const { data: created, error } = await supabase
    .from("devices")
    .insert(data)
    .select()
    .single();
  if (error) throw toFriendlyError(error);
  return created;
}

export async function updateDevice(
  id: string,
  data: DeviceInput,
): Promise<Device> {
  const { data: updated, error } = await supabase
    .from("devices")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw toFriendlyError(error);
  return updated;
}
