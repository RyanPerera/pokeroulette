# Pokémon Roulette — Setup Guide

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, name it `pokemon-roulette`
3. After creation, go to **Project Settings → API**
4. Copy your **Project URL** and **anon/public** key

## 2. Create the database table

In Supabase, go to **SQL Editor** and run:

```sql
-- Picks table
create table picks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_id    text not null,
  entry_name  text not null,
  entry_type  text not null check (entry_type in ('pokemon','trainer')),
  sprite_url  text,
  picked_at   timestamptz not null default now()
);

-- One pick per entry per user
create unique index picks_user_entry on picks(user_id, entry_id);

-- Row-level security
alter table picks enable row level security;

create policy "Users can read own picks"
  on picks for select using (auth.uid() = user_id);

create policy "Users can insert own picks"
  on picks for insert with check (auth.uid() = user_id);

create policy "Users can delete own picks"
  on picks for delete using (auth.uid() = user_id);
```

## 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your keys:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 4. Run locally

```bash
npm install
npm run dev
```

## 5. Deploy to GitHub Pages

Make sure your GitHub repo is named `pokemon-roulette` (matching the `base` path in `vite.config.js`).

```bash
npm run deploy
```

This builds and pushes to the `gh-pages` branch. Then in your repo:
- Go to **Settings → Pages**
- Source: **Deploy from branch**
- Branch: **gh-pages**, folder: **/ (root)**

Your app will be live at: `https://ryanperera.github.io/pokemon-roulette/`

### Changing the subpath

If you want a different URL path (e.g. `/poke-picker/`):
1. Edit `base` in `vite.config.js`
2. Edit `homepage` in `package.json`
3. Rename the GitHub repo to match

## 6. Enable email confirmation (optional)

In Supabase → **Authentication → Email Templates**, you can customise 
the confirmation email. To disable email confirmation for testing, 
go to **Authentication → Settings** and turn off "Confirm email".
