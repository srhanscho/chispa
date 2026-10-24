-- Chispa: parents sign in; each parent owns child profiles and their saved courses.
-- Children never have accounts of their own.

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  age int not null check (age between 4 and 12),
  -- Adaptive engine state (style scores, mastery, stars, stickers, streak, recent sessions, last note).
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  parent_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic text not null,
  style text not null,
  level text not null,
  lesson jsonb not null,
  -- Session result from the engine (correct, total, confused, completed, ...); null until finished.
  result jsonb,
  created_at timestamptz not null default now()
);

create index courses_child_created_idx on public.courses (child_id, created_at desc);
create index children_parent_idx on public.children (parent_id);

-- Shared cache of generated lessons, written only by the server with the secret key.
create table public.lesson_cache (
  key text primary key,
  lesson jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.children enable row level security;
alter table public.courses enable row level security;
alter table public.lesson_cache enable row level security;

create policy "parents read their children" on public.children
  for select to authenticated using ((select auth.uid()) = parent_id);
create policy "parents add children" on public.children
  for insert to authenticated with check ((select auth.uid()) = parent_id);
create policy "parents update their children" on public.children
  for update to authenticated using ((select auth.uid()) = parent_id) with check ((select auth.uid()) = parent_id);
create policy "parents delete their children" on public.children
  for delete to authenticated using ((select auth.uid()) = parent_id);

create policy "parents read their courses" on public.courses
  for select to authenticated using ((select auth.uid()) = parent_id);
create policy "parents add courses for their children" on public.courses
  for insert to authenticated with check (
    (select auth.uid()) = parent_id
    and exists (select 1 from public.children c where c.id = child_id and c.parent_id = (select auth.uid()))
  );
create policy "parents update their courses" on public.courses
  for update to authenticated using ((select auth.uid()) = parent_id) with check ((select auth.uid()) = parent_id);

-- lesson_cache has RLS on and no policies: only the secret (service) key can read or write it.

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger children_touch before update on public.children
  for each row execute function public.touch_updated_at();
