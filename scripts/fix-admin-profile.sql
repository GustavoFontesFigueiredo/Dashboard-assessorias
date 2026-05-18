-- ============================================================
-- FFADV — Correção: perfil do admin + trigger automático
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Verificar se o perfil do admin existe ─────────────────
SELECT
  u.id,
  u.email,
  p.id AS profile_id,
  p.role,
  p.nome
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@ffjus.com.br';

-- ── 2. Criar o perfil do admin SE não existir ─────────────────
INSERT INTO profiles (id, role, client_id, nome, ativo)
SELECT
  u.id,
  'admin'::role,
  NULL,
  'Gustavo Fontes',
  true
FROM auth.users u
WHERE u.email = 'admin@ffjus.com.br'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- ── 3. Trigger para criar perfil automaticamente ──────────────
-- Quando um novo usuário é criado no Supabase Auth, cria um perfil
-- com role padrão 'cliente' (admin altera depois no painel).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, nome, ativo)
  VALUES (
    NEW.id,
    'cliente',                                -- role padrão; admin altera depois
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (id) DO NOTHING;               -- não sobrescreve perfis existentes
  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir, recria
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 4. Criar perfis para usuários sem perfil ──────────────────
-- (garante que nenhum usuário existente fica sem perfil)
INSERT INTO profiles (id, role, nome, ativo)
SELECT
  u.id,
  'cliente'::role,
  split_part(u.email, '@', 1),
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
  AND u.email != 'admin@ffjus.com.br';  -- admin já foi tratado acima

-- ── 5. Verificação final ──────────────────────────────────────
SELECT
  u.email,
  p.role,
  p.nome,
  p.ativo
FROM auth.users u
JOIN profiles p ON p.id = u.id
ORDER BY p.role, u.email;
