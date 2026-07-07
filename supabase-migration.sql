-- 既存の Supabase プロジェクト向け：不足カラムを追加
-- Supabase ダッシュボード → SQL Editor で実行してください

alter table public.ref_items add column if not exists industry text;
alter table public.ref_items add column if not exists site_type text;
alter table public.ref_items add column if not exists color text;
alter table public.ref_items add column if not exists taste text;
alter table public.ref_items add column if not exists font_type text;
alter table public.ref_items add column if not exists font_name text;
alter table public.ref_items add column if not exists motion text;
