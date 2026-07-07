-- REF Gallery 用 Supabase セットアップ
-- Supabase ダッシュボード → SQL Editor でこのファイルを実行してください

-- 1. テーブル作成
create table if not exists public.ref_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  company text,
  section text,
  memo text,
  industry text,
  site_type text,
  color text,
  taste text,
  font_type text,
  font_name text,
  image_path text,
  sections jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 2. RLS（行レベルセキュリティ）を有効化
alter table public.ref_items enable row level security;

-- 3. 誰でも読み書き可能なポリシー（個人利用・試作向け）
-- ※本番運用時は認証ユーザー限定に変更してください
create policy "Allow public read" on public.ref_items
  for select using (true);

create policy "Allow public insert" on public.ref_items
  for insert with check (true);

create policy "Allow public update" on public.ref_items
  for update using (true);

create policy "Allow public delete" on public.ref_items
  for delete using (true);

-- 4. Storage バケット作成（画像保存用）
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- 5. Storage ポリシー
create policy "Allow public read screenshots"
  on storage.objects for select
  using (bucket_id = 'screenshots');

create policy "Allow public upload screenshots"
  on storage.objects for insert
  with check (bucket_id = 'screenshots');

create policy "Allow public delete screenshots"
  on storage.objects for delete
  using (bucket_id = 'screenshots');

-- 既存プロジェクト向け（カラム追加）
alter table public.ref_items add column if not exists industry text;
alter table public.ref_items add column if not exists site_type text;
alter table public.ref_items add column if not exists color text;
alter table public.ref_items add column if not exists taste text;
alter table public.ref_items add column if not exists font_type text;
alter table public.ref_items add column if not exists font_name text;
alter table public.ref_items add column if not exists motion text;
