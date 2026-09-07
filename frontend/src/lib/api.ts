const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";

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

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string };
    return body.detail ?? `Erro ${res.status}`;
  } catch {
    return `Erro ${res.status}`;
  }
}

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${API_URL}/api/v1/devices`);
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function createDevice(data: DeviceInput): Promise<Device> {
  const res = await fetch(`${API_URL}/api/v1/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateDevice(
  id: string,
  data: DeviceInput,
): Promise<Device> {
  const res = await fetch(`${API_URL}/api/v1/devices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}
