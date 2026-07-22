-- Migration: Add signature, company_id, recommendation_date, category, description, action_steps to public.recommendations and unique index for deduplication
alter table public.recommendations
add column if not exists signature text;

alter table public.recommendations
add column if not exists company_id uuid references public.companies(id) on delete cascade;

alter table public.recommendations
add column if not exists recommendation_date date;

alter table public.recommendations
add column if not exists category text;

alter table public.recommendations
add column if not exists description text;

alter table public.recommendations
add column if not exists action_steps text;

create unique index if not exists idx_recommendations_unique_active_signature
on public.recommendations(company_id, signature)
where status in ('pending', 'in_progress');
