-- Phase 0 — Supabase project & SQL schema for VibeLive
-- Paste this script directly into the Supabase SQL Editor and click "Run"

create extension if not exists "pgcrypto";

-- 1. Profiles (extends Supabase built-in auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  handle text unique not null,
  avatar text,
  bio text,
  country text default 'India',
  country_flag text default '🇮🇳',
  level int default 1,
  wealth_level int default 1,
  charisma_level int default 1,
  vip_level int default 0,
  svip boolean default false,
  svip_level int default 0,
  is_verified boolean default false,
  is_agency boolean default false,
  coins bigint default 5000,
  diamonds bigint default 0,
  total_coins_spent bigint default 0,
  total_diamonds_earned bigint default 0,
  followers int default 0,
  following int default 0,
  friends int default 0,
  visitors int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Auto-create a profile row whenever a user registers via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, handle, avatar, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(replace(new.id::text, '-', ''), 1, 8)),
    coalesce(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'),
    coalesce(new.raw_user_meta_data->>'bio', 'Exploring VibeLive streams 🎧')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Live streams / rooms
create table if not exists public.streams (
  id text primary key,
  title text not null,
  type text not null default 'video',
  mode text not null default 'multi',
  category text,
  country text,
  country_flag text,
  cover_image text,
  viewer_count int default 1,
  like_count int default 0,
  tags jsonb default '[]'::jsonb,
  is_hot boolean default true,
  is_recommended boolean default true,
  pinned_message text,
  host_id uuid references public.profiles(id) on delete cascade not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. Chat & Gift Messages
create table if not exists public.messages (
  id text primary key,
  stream_id text references public.streams(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null,
  is_gift boolean default false,
  gift_data jsonb,
  created_at timestamptz default now()
);

-- 5. Follows relationship table
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- 6. Profile Visits table
create table if not exists public.profile_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.profiles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  visited_at timestamptz default now(),
  constraint unique_visitor_profile unique (visitor_id, profile_id)
);

-- 7. Encrypted Direct Messages table
create table if not exists public.direct_messages (
  id text primary key,
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  encrypted_content text not null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 8. Store Items & User Inventory
create table if not exists public.store_items (
  id text primary key,
  name text not null,
  category text not null, -- 'mount', 'frame', 'bubble', 'entry'
  price int not null,
  duration_days int default 30,
  icon text,
  preview_url text,
  is_vip boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id text references public.store_items(id) on delete cascade not null,
  is_equipped boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 9. Daily Tasks & User Claims
create table if not exists public.daily_tasks (
  id text primary key,
  title text not null,
  reward_coins int default 100,
  reward_diamonds int default 0,
  reward_exp int default 50,
  target_count int default 1,
  type text default 'daily',
  icon text
);

create table if not exists public.user_task_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id text references public.daily_tasks(id) on delete cascade not null,
  progress int default 0,
  is_completed boolean default false,
  is_claimed boolean default false,
  claimed_at timestamptz,
  updated_at timestamptz default now(),
  constraint unique_user_task unique (user_id, task_id)
);

-- 10. Family & Family Members
create table if not exists public.families (
  id text primary key,
  name text not null,
  badge_text text not null,
  logo_url text,
  leader_id uuid references public.profiles(id) on delete set null,
  level int default 1,
  exp int default 0,
  announcement text,
  max_members int default 50,
  created_at timestamptz default now()
);

create table if not exists public.family_members (
  family_id text references public.families(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member', -- 'leader', 'co_leader', 'member'
  joined_at timestamptz default now(),
  primary key (family_id, user_id)
);

-- 11. VIP Subscriptions
create table if not exists public.vip_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  vip_level int default 1,
  is_svip boolean default false,
  svip_level int default 0,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 12. CP (Couples / Partner)
create table if not exists public.cp_partnerships (
  id uuid primary key default gen_random_uuid(),
  user_1 uuid references public.profiles(id) on delete cascade not null,
  user_2 uuid references public.profiles(id) on delete cascade not null,
  ring_name text default 'Silver Heart Ring',
  cp_level int default 1,
  intimacy_points int default 0,
  status text default 'active', -- 'pending', 'active', 'ended'
  anniversary_date timestamptz default now(),
  created_at timestamptz default now(),
  constraint unique_cp_pair unique (user_1, user_2)
);

-- 13. BD Center (Business Development)
create table if not exists public.bd_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  contact_number text not null,
  agency_experience text,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  monthly_target_usd int default 10000,
  created_at timestamptz default now()
);

-- 14. Agency Center
create table if not exists public.agencies (
  id text primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  code text unique not null,
  commission_rate numeric(5,2) default 15.00,
  total_hosts int default 1,
  monthly_revenue bigint default 0,
  created_at timestamptz default now()
);

create table if not exists public.agency_hosts (
  agency_id text references public.agencies(id) on delete cascade not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'active',
  joined_at timestamptz default now(),
  primary key (agency_id, host_id)
);

-- 15. My Posts (Moments Feed)
create table if not exists public.user_posts (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  media_urls jsonb default '[]'::jsonb,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.post_likes (
  post_id text references public.user_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- 16. Offline Recharge
create table if not exists public.offline_recharges (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_usd numeric(10,2) not null,
  coins_credited bigint not null,
  payment_method text not null,
  transaction_ref text not null,
  status text default 'completed', -- 'pending', 'completed', 'failed'
  created_at timestamptz default now()
);

-- 17. Host Center
create table if not exists public.host_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text default 'Singing',
  sample_video_url text,
  status text default 'approved', -- 'pending', 'approved', 'rejected'
  monthly_live_hours numeric(6,2) default 0.0,
  monthly_diamonds_earned bigint default 0,
  target_met boolean default false,
  created_at timestamptz default now()
);

-- 18. My Videos (Short Video Clips)
create table if not exists public.user_videos (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  thumbnail_url text,
  title text not null,
  likes_count int default 0,
  views_count int default 0,
  created_at timestamptz default now()
);

-- 19. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.streams enable row level security;
alter table public.messages enable row level security;
alter table public.follows enable row level security;
alter table public.profile_visits enable row level security;
alter table public.direct_messages enable row level security;
alter table public.store_items enable row level security;
alter table public.user_inventory enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.user_task_claims enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.vip_subscriptions enable row level security;
alter table public.cp_partnerships enable row level security;
alter table public.bd_applications enable row level security;
alter table public.agencies enable row level security;
alter table public.agency_hosts enable row level security;
alter table public.user_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.offline_recharges enable row level security;
alter table public.host_applications enable row level security;
alter table public.user_videos enable row level security;

-- 20. Public Viewable Policies
create policy "Public read store items" on public.store_items for select using (true);
create policy "User read inventory" on public.user_inventory for select using (true);
create policy "User modify inventory" on public.user_inventory for all using (auth.uid() = user_id);

create policy "Public read daily tasks" on public.daily_tasks for select using (true);
create policy "User manage task claims" on public.user_task_claims for all using (auth.uid() = user_id);

create policy "Public read families" on public.families for select using (true);
create policy "Public read family members" on public.family_members for select using (true);

create policy "User read vip" on public.vip_subscriptions for select using (true);

create policy "Public read cp" on public.cp_partnerships for select using (true);
create policy "User manage cp" on public.cp_partnerships for all using (auth.uid() = user_1 or auth.uid() = user_2);

create policy "User manage BD app" on public.bd_applications for all using (auth.uid() = user_id);

create policy "Public read agencies" on public.agencies for select using (true);
create policy "Public read agency hosts" on public.agency_hosts for select using (true);

create policy "Public read user posts" on public.user_posts for select using (true);
create policy "User insert posts" on public.user_posts for insert with check (auth.uid() = user_id);

create policy "Public read post likes" on public.post_likes for select using (true);
create policy "User manage post likes" on public.post_likes for all using (auth.uid() = user_id);

create policy "User manage offline recharges" on public.offline_recharges for all using (auth.uid() = user_id);

create policy "User manage host apps" on public.host_applications for all using (auth.uid() = user_id);

create policy "Public read user videos" on public.user_videos for select using (true);
create policy "User insert videos" on public.user_videos for insert with check (auth.uid() = user_id);

-- 21. RLS Policies for Profiles, Streams, Messages
drop policy if exists "Profiles are publicly viewable" on public.profiles;
create policy "Profiles are publicly viewable" on public.profiles for select using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Streams are viewable by everyone" on public.streams;
create policy "Streams are viewable by everyone" on public.streams for select using (true);

drop policy if exists "Authenticated users can create streams" on public.streams;
create policy "Authenticated users can create streams" on public.streams for insert with check (auth.role() = 'authenticated');

drop policy if exists "Hosts can update own streams" on public.streams;
create policy "Hosts can update own streams" on public.streams for update using (auth.uid() = host_id);

drop policy if exists "Messages are viewable by everyone" on public.messages;
create policy "Messages are viewable by everyone" on public.messages for select using (true);

drop policy if exists "Authenticated users can insert messages" on public.messages;
create policy "Authenticated users can insert messages" on public.messages for insert with check (auth.role() = 'authenticated');

drop policy if exists "Follows are viewable by everyone" on public.follows;
create policy "Follows are viewable by everyone" on public.follows for select using (true);

drop policy if exists "Users can manage own follows" on public.follows;
create policy "Users can manage own follows" on public.follows for all using (auth.uid() = follower_id);

drop policy if exists "Profile visits viewable by everyone" on public.profile_visits;
create policy "Profile visits viewable by everyone" on public.profile_visits for select using (true);

drop policy if exists "Users can insert profile visits" on public.profile_visits;
create policy "Users can insert profile visits" on public.profile_visits for insert with check (auth.uid() = visitor_id);

drop policy if exists "Users can view direct messages sent to or by them" on public.direct_messages;
create policy "Users can view direct messages sent to or by them" on public.direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can send direct messages" on public.direct_messages;
create policy "Users can send direct messages" on public.direct_messages
  for insert with check (auth.uid() = sender_id);

-- 22. Enable Supabase Realtime safely
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime for table public.streams, public.messages, public.follows, public.direct_messages, public.profile_visits, public.user_posts, public.user_videos;
  else
    alter publication supabase_realtime set table public.streams, public.messages, public.follows, public.direct_messages, public.profile_visits, public.user_posts, public.user_videos;
  end if;
exception
  when others then null;
end $$;

