-- Migration: Add signature column and unique index for tasks deduplication
alter table public.tasks
add column if not exists signature text;

alter table public.tasks
add column if not exists company_id uuid references public.companies(id) on delete cascade;

create unique index if not exists idx_tasks_unique_active_signature
on public.tasks(company_id, signature)
where status in ('pending', 'in_progress');
