import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const out = path.join(root, 'assets', 'js', 'config.js');

const url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const key = (process.env.SUPABASE_ANON_KEY || '').trim();

const content = url && key
  ? `window.REF_GALLERY_CONFIG = {\n  url: '${url}',\n  key: '${key}'\n};\n`
  : 'window.REF_GALLERY_CONFIG = null;\n';

fs.writeFileSync(out, content, 'utf8');
console.log(url ? 'config.js を生成しました（Supabase 接続あり）' : 'config.js を生成しました（接続情報なし）');
