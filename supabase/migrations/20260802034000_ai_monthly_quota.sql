-- Atomic, server-only monthly quota for student-facing AI submissions.

create table if not exists public.ai_monthly_usage (
  email         text not null references public.users(email) on delete cascade,
  period_start  date not null,
  submissions   integer not null default 0 check (submissions >= 0),
  updated_at    timestamptz not null default now(),
  primary key (email, period_start)
);

alter table public.ai_monthly_usage enable row level security;

create or replace function public.consume_ai_submission(p_email text, p_limit integer)
returns jsonb
language plpgsql
as $$
declare
  current_period date := date_trunc('month', timezone('utc', now()))::date;
  next_period timestamptz := (current_period + interval '1 month') at time zone 'utc';
  used_count integer;
  reservation_allowed boolean := true;
begin
  if p_limit < 1 then
    raise exception 'AI submission limit must be positive';
  end if;

  insert into public.ai_monthly_usage (email, period_start, submissions)
  values (p_email, current_period, 1)
  on conflict (email, period_start) do update
    set submissions = public.ai_monthly_usage.submissions + 1,
        updated_at = now()
    where public.ai_monthly_usage.submissions < p_limit
  returning submissions into used_count;

  if used_count is null then
    reservation_allowed := false;
    select submissions into used_count
    from public.ai_monthly_usage
    where email = p_email and period_start = current_period;
  end if;

  return jsonb_build_object(
    'allowed', reservation_allowed,
    'used', used_count,
    'limit', p_limit,
    'resetsAt', next_period
  );
end;
$$;

create or replace function public.refund_ai_submission(p_email text)
returns void
language sql
as $$
  update public.ai_monthly_usage
  set submissions = greatest(0, submissions - 1),
      updated_at = now()
  where email = p_email
    and period_start = date_trunc('month', timezone('utc', now()))::date;
$$;

revoke all on table public.ai_monthly_usage from public, anon, authenticated;
revoke all on function public.consume_ai_submission(text, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_submission(text) from public, anon, authenticated;
grant execute on function public.consume_ai_submission(text, integer) to service_role;
grant execute on function public.refund_ai_submission(text) to service_role;
grant select, insert, update on table public.ai_monthly_usage to service_role;
