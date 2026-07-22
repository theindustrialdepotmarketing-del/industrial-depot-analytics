-- Migration: Add signature column and unique index for alert deduplication
alter table public.alerts
add column if not exists signature text;

create unique index if not exists
idx_alerts_unique_active_signature
on public.alerts(company_id, signature)
where status in ('open', 'reviewing');
