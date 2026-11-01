-- Run this in Supabase Dashboard > SQL Editor.
-- Create an admin user first in Authentication > Users, then copy that user's UUID.
-- Replace ADMIN_USER_UUID below with the real UUID and run the INSERT statement.

create table if not exists public.bots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'General',
  description text not null,
  image_url text,
  link_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bot_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.bots enable row level security;
alter table public.bot_admins enable row level security;

-- Public visitors can only see active bots.
create policy "Public can view active bots"
on public.bots for select
to anon, authenticated
using (active = true);

-- Admins can view every bot, including hidden ones.
create policy "Admins can view all bots"
on public.bots for select
to authenticated
using (exists (select 1 from public.bot_admins a where a.user_id = auth.uid()));

-- Only explicitly approved admin accounts can add, edit or delete bots.
create policy "Admins can add bots"
on public.bots for insert
to authenticated
with check (exists (select 1 from public.bot_admins a where a.user_id = auth.uid()));

create policy "Admins can edit bots"
on public.bots for update
to authenticated
using (exists (select 1 from public.bot_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.bot_admins a where a.user_id = auth.uid()));

create policy "Admins can delete bots"
on public.bots for delete
to authenticated
using (exists (select 1 from public.bot_admins a where a.user_id = auth.uid()));

-- Admin can verify their own admin status; users cannot grant themselves admin access.
create policy "Admins can read own admin record"
on public.bot_admins for select
to authenticated
using (user_id = auth.uid());

-- After creating the admin user in Supabase Auth, replace the UUID below:
-- insert into public.bot_admins (user_id) values ('ADMIN_USER_UUID');
