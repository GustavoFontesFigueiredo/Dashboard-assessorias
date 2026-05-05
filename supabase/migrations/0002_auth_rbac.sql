-- ────────────────────────────────────────────────────────────────
-- Feature 02: Auth + RBAC
-- ────────────────────────────────────────────────────────────────

-- Criar tipos e tabelas base
create type public.role as enum ('admin', 'controller', 'advogado', 'cliente');

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text,
  ativo boolean default true,
  kpi_visibility jsonb default '{"custos": true, "evitadas": true, "recebidos": true, "roi": true}'::jsonb,
  created_at timestamp with time zone default now()
);

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.role not null,
  client_id uuid references public.clients,
  nome text not null,
  ativo boolean default true,
  created_at timestamp with time zone default now()
);

create table public.lawyer_assignments (
  id uuid primary key default gen_random_uuid(),
  advogado_id uuid not null references public.profiles on delete cascade,
  client_id uuid not null references public.clients on delete cascade,
  created_at timestamp with time zone default now(),
  unique (advogado_id, client_id)
);

-- Índices para performance
create index idx_profiles_client_id on public.profiles(client_id);
create index idx_lawyer_assignments_advogado on public.lawyer_assignments(advogado_id);
create index idx_lawyer_assignments_client on public.lawyer_assignments(client_id);
create index idx_clients_cnpj on public.clients(cnpj);

-- ────────────────────────────────────────────────────────────────
-- Row-Level Security (RLS)
-- ────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.lawyer_assignments enable row level security;

-- Políticas para PROFILES
-- Todos conseguem ver seu próprio perfil
create policy "profiles_read_own" on public.profiles
  for select
  using (id = auth.uid());

-- Admin consegue ler todos os perfis
create policy "profiles_read_admin" on public.profiles
  for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Admin consegue editar qualquer perfil
create policy "profiles_update_admin" on public.profiles
  for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Admin consegue inserir novos perfis
create policy "profiles_insert_admin" on public.profiles
  for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Políticas para CLIENTS
-- Clients externos conseguem ler seu próprio cliente
create policy "clients_read_own_for_client" on public.clients
  for select
  using (
    id = (select client_id from public.profiles where id = auth.uid())
  );

-- Internos (admin, controller, advogado) conseguem ler
create policy "clients_read_internal" on public.clients
  for select
  using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'controller', 'advogado')
  );

-- Admin consegue editar
create policy "clients_update_admin" on public.clients
  for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Controller consegue editar clientes (não criar)
create policy "clients_update_controller" on public.clients
  for update
  using ((select role from public.profiles where id = auth.uid()) = 'controller')
  with check ((select role from public.profiles where id = auth.uid()) = 'controller');

-- Admin consegue inserir
create policy "clients_insert_admin" on public.clients
  for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Políticas para LAWYER_ASSIGNMENTS
-- Admin consegue ler/editar/inserir tudo
create policy "lawyer_assignments_admin" on public.lawyer_assignments
  for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Controller consegue ler/editar
create policy "lawyer_assignments_controller" on public.lawyer_assignments
  for select
  using ((select role from public.profiles where id = auth.uid()) = 'controller');

-- Advogado consegue ler suas próprias atribuições
create policy "lawyer_assignments_read_own" on public.lawyer_assignments
  for select
  using (advogado_id = auth.uid());

-- ────────────────────────────────────────────────────────────────
-- Seed: Admin inicial para testes/bootstrap
-- ────────────────────────────────────────────────────────────────

-- Este será executado separadamente via supabase/seed.sql
-- para que credenciais não fiquem no migrations.sql
