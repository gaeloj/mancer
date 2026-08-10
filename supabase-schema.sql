-- =========================================================================
-- SCRIPT SQL PARA IMPLANTAÇÃO NO SUPABASE
-- Sistema de Gestão de Associação (UniOn / Sistema de Gestão)
-- =========================================================================
-- Instruções:
-- 1. Acesse o seu painel do Supabase (https://supabase.com)
-- 2. Selecione o seu projeto e vá em "SQL Editor" na barra lateral esquerda.
-- 3. Clique em "New query" para abrir um novo editor.
-- 4. Copie todo o conteúdo deste arquivo e cole no editor.
-- 5. Clique em "Run" (Executar) no canto superior direito para criar as tabelas.
-- =========================================================================

-- Habilitar extensão pgcrypto se necessário (geralmente habilitada por padrão)
create extension if not exists pgcrypto;

-- 1. TABELA DE ASSOCIADOS
create table if not exists associates (
  id text primary key,
  name text,
  email text,
  cpf text,
  status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para buscas rápidas
create index if not exists associates_email_idx on associates (email);
create index if not exists associates_cpf_idx on associates (cpf);
create index if not exists associates_status_idx on associates (status);

-- 2. TABELA DE CLIENTES
create table if not exists clients (
  id text primary key,
  name text,
  email text,
  cpf text,
  status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices
create index if not exists clients_email_idx on clients (email);
create index if not exists clients_status_idx on clients (status);

-- 3. TABELA DE TRANSAÇÕES FINANCEIRAS
create table if not exists transactions (
  id text primary key,
  description text,
  amount numeric(12,2),
  type text, -- 'Receita' ou 'Despesa'
  date text,
  category text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices
create index if not exists transactions_type_idx on transactions (type);
create index if not exists transactions_category_idx on transactions (category);

-- 4. TABELA DE COMUNICADOS / AVISOS
create table if not exists announcements (
  id text primary key,
  title text,
  content text,
  date text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABELA DE RELATÓRIOS DE AUDITORIA
create table if not exists reports (
  id text primary key,
  report_number text,
  issued_at text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TABELA DE ASSEMBLEIAS E ATIVIDADES
create table if not exists assemblies (
  id text primary key,
  title text,
  date text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TABELA DE VOTAÇÕES / ENQUETES
create table if not exists polls (
  id text primary key,
  title text,
  status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TABELA DE CONFIGURAÇÕES DO SISTEMA
create table if not exists configs (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- REGRAS DE SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- Para facilitar o acesso direto via cliente sem expor as tabelas de forma
-- insegura, as tabelas vêm com RLS desativado por padrão para fins de prototipagem rápida.
-- Se desejar ativar RLS em produção, execute os comandos abaixo e crie as políticas:
--
-- ALTER TABLE associates ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir leitura para anon" ON associates FOR SELECT TO anon USING (true);
-- CREATE POLICY "Permitir tudo para autenticado" ON associates TO authenticated USING (true);
-- =========================================================================
