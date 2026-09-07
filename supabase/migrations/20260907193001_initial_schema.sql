-- Schema inicial: porta 1:1 de backend/app/modules/{devices,software,maintenance}/models.py
-- para o Postgres gerenciado do Supabase.

create type device_type as enum ('desktop', 'notebook', 'servidor', 'impressora', 'monitor', 'outro');
create type device_status as enum ('em_uso', 'estoque', 'manutencao', 'baixado');

create table devices (
  id uuid primary key default gen_random_uuid(),
  hostname text not null,
  tipo device_type not null,
  fabricante text,
  modelo text,
  serial_number text unique,
  status device_status not null default 'estoque',
  localizacao text,
  usuario_responsavel text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Postgres não tem "onupdate" como o SQLAlchemy; precisa de trigger
-- explícito pra manter updated_at em dia a cada UPDATE.
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger devices_set_updated_at
  before update on devices
  for each row execute function set_updated_at();

create table installed_software (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  nome text not null,
  versao text,
  data_instalacao date,
  created_at timestamptz not null default now()
);

create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  descricao text not null,
  responsavel text,
  data date not null,
  created_at timestamptz not null default now()
);
