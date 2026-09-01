-- Anonymous, non-identifying playtest telemetry for Starlight Mayor.
-- Frontend roles may insert validated rows but cannot read, update, or delete them.

create table if not exists public.playtest_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  difficulty text not null check (difficulty in ('too_easy', 'balanced', 'too_hard')),
  favorite_feature text not null default '' check (char_length(favorite_feature) <= 120),
  bug_notes text not null default '' check (char_length(bug_notes) <= 1000),
  current_level smallint not null check (current_level between 1 and 6),
  client_version text not null default '1.0.0' check (char_length(client_version) <= 24),
  created_at timestamptz not null default now()
);

alter table public.playtest_feedback enable row level security;
revoke all on table public.playtest_feedback from anon, authenticated;
grant insert on table public.playtest_feedback to anon, authenticated;
drop policy if exists "playtest feedback insert only" on public.playtest_feedback;
create policy "playtest feedback insert only"
  on public.playtest_feedback
  for insert
  to anon, authenticated
  with check (
    rating between 1 and 5
    and difficulty in ('too_easy', 'balanced', 'too_hard')
    and current_level between 1 and 6
    and char_length(favorite_feature) <= 120
    and char_length(bug_notes) <= 1000
  );

create index if not exists playtest_feedback_created_at_idx
  on public.playtest_feedback (created_at desc);

create table if not exists public.game_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  completed_level smallint not null check (completed_level between 1 and 6),
  result text not null check (result in ('level_complete', 'win', 'lose')),
  stars smallint not null check (stars between 0 and 100),
  environment smallint not null check (environment between 0 and 100),
  satisfaction smallint not null check (satisfaction between 0 and 100),
  money integer not null check (money between -100000 and 10000000),
  duration_seconds integer not null check (duration_seconds between 0 and 7200),
  client_version text not null default '1.0.0' check (char_length(client_version) <= 24),
  created_at timestamptz not null default now()
);

alter table public.game_runs enable row level security;
revoke all on table public.game_runs from anon, authenticated;
grant insert on table public.game_runs to anon, authenticated;
drop policy if exists "game runs insert only" on public.game_runs;
create policy "game runs insert only"
  on public.game_runs
  for insert
  to anon, authenticated
  with check (
    completed_level between 1 and 6
    and result in ('level_complete', 'win', 'lose')
    and stars between 0 and 100
    and environment between 0 and 100
    and satisfaction between 0 and 100
    and money between -100000 and 10000000
    and duration_seconds between 0 and 7200
  );

create index if not exists game_runs_created_at_idx
  on public.game_runs (created_at desc);

comment on table public.playtest_feedback is 'Anonymous gameplay feedback. Do not add identity or contact fields.';
comment on table public.game_runs is 'Anonymous level outcomes used for balancing and bug diagnosis.';
