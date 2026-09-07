-- Tabela companion de auth.users (padrão Supabase) + RLS nas tabelas de
-- domínio. V1 simples: sem times/roles ainda (o projeto não tinha esse
-- conceito no FastAPI original) — qualquer usuário autenticado tem
-- acesso completo aos dados de devices/software/maintenance.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table devices enable row level security;
alter table installed_software enable row level security;
alter table maintenance_logs enable row level security;

create policy "usuario ve e edita o proprio perfil"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "usuario autenticado acessa devices"
  on devices for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "usuario autenticado acessa installed_software"
  on installed_software for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "usuario autenticado acessa maintenance_logs"
  on maintenance_logs for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
