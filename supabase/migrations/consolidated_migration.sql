-- ====================================================================
-- Industrial Depot Analytics - Consolidado de Migraciones para Supabase
-- Copia y ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- ====================================================================

-- 1. Agregar columna 'signature' e índice de deduplicación a la tabla public.alerts
alter table public.alerts
add column if not exists signature text;

create unique index if not exists idx_alerts_unique_active_signature
on public.alerts(company_id, signature)
where status in ('open', 'reviewing');

-- 2. Crear tabla public.url_corrections_404 para la gestión de URLs 404 confirmadas
create table if not exists public.url_corrections_404 (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  page_path text not null,
  replacement_url text default '',
  replacement_type text default 'unknown', -- same_product, equivalent_product, relevant_category, no_replacement, unknown
  verified_http_status integer default 404,
  correction_status text default 'pending_review', -- pending_review, redirect_required, link_correction_required, keep_404, use_410, resolved
  notes text default '',
  assigned_to text default '',
  verified_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_company_page_path unique(company_id, page_path)
);

-- 3. Habilitar políticas RLS (Row Level Security) si RLS está activo en las tablas
alter table public.alerts enable row level security;
alter table public.url_corrections_404 enable row level security;

-- Política permissiva para service_role (cliente administrativo server-only)
drop policy if exists "Service role full access on alerts" on public.alerts;
create policy "Service role full access on alerts"
on public.alerts for all
using (true)
with check (true);

drop policy if exists "Service role full access on url_corrections_404" on public.url_corrections_404;
create policy "Service role full access on url_corrections_404"
on public.url_corrections_404 for all
using (true)
with check (true);
