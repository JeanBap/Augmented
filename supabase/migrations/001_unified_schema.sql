-- Unified schema for all Raise Ready apps
-- Shared Supabase project: all 3 subdomains use this same database
-- Run: npx supabase db push

-- Users profile (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Purchases (books, services, tool exports)
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_type text not null check (product_type in ('book', 'service', 'tool_export')),
  product_id text not null,
  stripe_payment_id text unique,
  stripe_customer_id text,
  amount_cents integer not null,
  currency text default 'usd' not null,
  status text default 'pending' not null check (status in ('pending', 'completed', 'refunded')),
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

create index idx_purchases_user on public.purchases(user_id);
create index idx_purchases_stripe on public.purchases(stripe_payment_id);

-- Saved calculations (personal finance tools on app.raisereadybook.com)
create table if not exists public.saved_calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tool_slug text not null, -- e.g. 'apr-calculator', 'mortgage-calculator'
  label text not null,
  data jsonb not null, -- full calculation inputs + results
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_saved_calc_user on public.saved_calculations(user_id);

-- Financial models (finance.raisereadybook.com)
create table if not exists public.financial_models (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Untitled Model',
  company_name text,
  industry text,
  stage text, -- 'pre-seed', 'seed', 'series-a', etc.
  starting_month date,
  data jsonb not null default '{}', -- full model JSON (revenue, costs, hiring, etc.)
  scenario text default 'base' check (scenario in ('conservative', 'base', 'aggressive')),
  is_template boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_models_user on public.financial_models(user_id);

-- Favorites (cross-app: favorite tools, blog posts, books)
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_type text not null check (item_type in ('tool', 'blog_post', 'book', 'model')),
  item_id text not null,
  created_at timestamptz default now() not null,
  unique(user_id, item_type, item_id)
);

create index idx_favorites_user on public.favorites(user_id);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.saved_calculations enable row level security;
alter table public.financial_models enable row level security;
alter table public.favorites enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Purchases: users can read their own purchases (inserts via service role only)
create policy "Users can read own purchases" on public.purchases
  for select using (auth.uid() = user_id);

-- Saved calculations: full CRUD on own data
create policy "Users can CRUD own calculations" on public.saved_calculations
  for all using (auth.uid() = user_id);

-- Financial models: full CRUD on own models
create policy "Users can CRUD own models" on public.financial_models
  for all using (auth.uid() = user_id);

-- Favorites: full CRUD on own favorites
create policy "Users can CRUD own favorites" on public.favorites
  for all using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_saved_calc_updated_at before update on public.saved_calculations
  for each row execute function public.set_updated_at();
create trigger set_models_updated_at before update on public.financial_models
  for each row execute function public.set_updated_at();
