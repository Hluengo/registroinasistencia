-- 008_audit_logs_performed_by_compat.sql
-- Compatibilidad entre implementaciones de auditoría:
-- algunos triggers/funciones insertan en audit_logs.performed_by
-- y otros en audit_logs.changed_by.

alter table public.audit_logs
  add column if not exists performed_by uuid null;

alter table public.audit_logs
  add column if not exists changed_by uuid null;

-- Backfill bidireccional para no perder historial previo.
update public.audit_logs
set performed_by = changed_by
where performed_by is null and changed_by is not null;

update public.audit_logs
set changed_by = performed_by
where changed_by is null and performed_by is not null;

create or replace function public.audit_logs_sync_actor_columns()
returns trigger
language plpgsql
as $$
begin
  if new.performed_by is null and new.changed_by is not null then
    new.performed_by := new.changed_by;
  end if;

  if new.changed_by is null and new.performed_by is not null then
    new.changed_by := new.performed_by;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_logs_sync_actor_columns on public.audit_logs;

create trigger trg_audit_logs_sync_actor_columns
before insert or update on public.audit_logs
for each row
execute function public.audit_logs_sync_actor_columns();
