-- Migration: Create url_corrections_404 table for managing confirmed 404 URLs
create table if not exists public.url_corrections_404 (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  page_path text not null,
  replacement_url text default '',
  replacement_type text default 'unknown',
  verified_http_status integer default 404,
  correction_status text default 'pending_review',
  notes text default '',
  assigned_to text default '',
  verified_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_company_page_path unique(company_id, page_path)
);
