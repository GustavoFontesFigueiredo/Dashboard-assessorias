-- ────────────────────────────────────────────────────────────────
-- Feature 03: Clients & Users Management - Audit & Schema Updates
-- ────────────────────────────────────────────────────────────────

-- 1. Atualizar tabela CLIENTS com responsavel_id e CNPJ único
alter table public.clients
  add column if not exists responsavel_id uuid references public.profiles on delete set null;

alter table public.clients
  add constraint unique_cnpj unique (cnpj);

create index if not exists idx_clients_responsavel on public.clients(responsavel_id);

-- 2. Adicionar coluna ativo em PROFILES se não existir
alter table public.profiles
  add column if not exists ativo boolean default true;

-- 3. Tabela de auditoria
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Índices para auditoria
create index if not exists idx_audit_logs_table_record
  on public.audit_logs(table_name, record_id);
create index if not exists idx_audit_logs_user
  on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created
  on public.audit_logs(created_at desc);

-- 4. Função trigger para auditoria
create or replace function public.audit_trigger_fn()
returns trigger as $$
begin
  insert into public.audit_logs (action, table_name, record_id, old_values, new_values, user_id)
  values (
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    to_jsonb(old),
    to_jsonb(new),
    auth.uid()
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- 5. Triggers nas tabelas de dados
drop trigger if exists audit_trigger_clients on public.clients;
create trigger audit_trigger_clients
  after insert or update or delete on public.clients
  for each row execute function public.audit_trigger_fn();

drop trigger if exists audit_trigger_profiles on public.profiles;
create trigger audit_trigger_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_trigger_fn();

drop trigger if exists audit_trigger_lawyer_assignments on public.lawyer_assignments;
create trigger audit_trigger_lawyer_assignments
  after insert or update or delete on public.lawyer_assignments
  for each row execute function public.audit_trigger_fn();

-- 6. RLS para audit_logs (apenas Admin consegue ler sua própria auditoria e de outros)
alter table public.audit_logs enable row level security;

create policy "audit_logs_read_admin" on public.audit_logs
  for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- 7. Atualizar RLS de CLIENTS para permitir UPDATE via admin
drop policy if exists "clients_update_controller" on public.clients;
create policy "clients_update_all_internal" on public.clients
  for update
  using ((select role from public.profiles where id = auth.uid()) in ('admin', 'controller'))
  with check ((select role from public.profiles where id = auth.uid()) in ('admin', 'controller'));

-- 8. RLS para PROFILES: admin consegue inserir novos usuários
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Deixar admin atualizar profiles
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');
