/* ── Supabase Config ── */
const CONFIG_KEY = 'ref-gallery-supabase-config';
const CUSTOM_CATEGORIES_KEY = 'ref-gallery-custom-categories';
const CUSTOM_PARTS_CATEGORIES_KEY = 'ref-gallery-custom-parts-categories';
const ADD_DRAFT_KEY = 'ref-gallery-add-draft';
const BUCKET = 'screenshots';
const TABLE = 'ref_items';

const BUILTIN_CATEGORY_TREE = [
  {
    group: 'ページ',
    items: [
      'メインビジュアル', '下層ページキービジュアル', 'ヘッダー', 'フッター', 'テーブル',
      'お知らせ・ブログ', 'サービスの特長', 'フロー・流れ', 'よくある質問', '会社概要',
      'インフォグラフィック', '数字で見る', 'お問い合わせ', '採用関連', '商品'
    ]
  },
  {
    group: 'パーツ',
    items: ['カード・リスト', 'モーダル・ポップアップ', 'メガメニュー', 'スライダー']
  },
  { group: 'フォント', items: [] },
  { group: 'スマホ', items: [] },
  { group: 'UI', items: [] },
];
const INDUSTRIES = [
  'IT・SaaS', 'EC・小売', '金融', '不動産', '医療・健康', '教育', 'メディア', '飲食',
  '製造', '物流', '美容・コスメ', '旅行・観光', '人材・採用', '士業', '公共・自治体',
  'スポーツ・フィットネス', '自動車', '建設・建築', 'ファッション', 'エンタメ・イベント',
  '非営利・NPO', 'その他'
];
const SITE_TYPES = ['コーポレート', 'LP', 'サービスサイト', 'EC', 'メディア', 'ポートフォリオ', 'その他'];
const COLORS = [
  'ホワイト系', 'ブラック系', 'グレー', 'ベージュ・茶',
  '赤', 'ピンク', 'オレンジ', '黄色', '緑', '青', '紫', 'さわやか・フレッシュ', 'ダーク', '強い・鮮やか','パステル', 'カラフル'
];
const TASTES = [
  'シンプル', 'モノトーン', 'ポップ', 'かわいい', 'スタイリッシュ', '若い',
  'レトロ', '未来的', '上品', 'ナチュラル', '和・伝統的',
  'イラスト', '３D', '清潔感', '誠実・信頼感', '縦書き', '雑誌風', '水彩', '罫線', '季節感', '女性向け', '男性向け'
];
const MOTION_TYPES = [
  'ホバー', 'スクロールアニメーション', 'ページ遷移', 'ローディング',
  'テキストアニメーション', 'ボタンアニメーション', 'パーティクル',
  'Parallax', 'Three.js / 3D', 'GSAP', 'Lottie', 'CSS Animation',
  'SVGアニメーション', 'マイクロインタラクション', 'トップボタン'
];
const FONT_TYPES = ['グーグルフォント', 'アドビフォント', 'フリーフォント', 'ゴシック', '明朝', 'その他'];
const FONTS_BY_TYPE = {
  'グーグルフォント': [
    'Noto Sans JP', 'Noto Serif JP', 'Roboto', 'Inter', 'Open Sans', 'Lato',
    'Montserrat', 'Poppins', 'Playfair Display', 'Oswald', 'Raleway',
    'M PLUS 1p', 'Zen Kaku Gothic New', 'Shippori Mincho', 'Zen Old Mincho', 'Source Sans 3'
  ],
  'アドビフォント': [
    'Source Han Sans', 'Source Han Serif', 'Acumin Pro', 'Minion Pro',
    'Myriad Pro', 'Kozuka Gothic Pro', 'Kozuka Mincho Pro', 'Adobe Garamond Pro'
  ],
  'フリーフォント': [
    'BIZ UDPGothic', 'BIZ UDPMincho', '源ノ角ゴシック', '源ノ明朝',
    '游ゴシック', '游明朝', 'Helvetica Neue', 'Arial'
  ],
  'ゴシック': [
    'Noto Sans JP', 'Roboto', 'Inter', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Oswald', 'Raleway', 'M PLUS 1p', 'Zen Kaku Gothic New', 'Source Sans 3',
    'Source Han Sans', 'Acumin Pro', 'Myriad Pro', 'Kozuka Gothic Pro',
    'BIZ UDPGothic', '源ノ角ゴシック', '游ゴシック', 'Helvetica Neue', 'Arial'
  ],
  '明朝': [
    'Noto Serif JP', 'Playfair Display', 'Shippori Mincho', 'Zen Old Mincho',
    'Source Han Serif', 'Minion Pro', 'Kozuka Mincho Pro', 'Adobe Garamond Pro',
    'BIZ UDPMincho', '源ノ明朝', '游明朝'
  ]
};
const ALL_LISTED_FONTS = [...new Set(Object.values(FONTS_BY_TYPE).flat())];

let supabaseClient = null;
let items = [];
let currentId = null;
let pendingImage = null;
let activeCategory = 'ALL';

const filterSelections = {
  industry: [],
  site_type: [],
  color: [],
  taste: [],
  motion: [],
  font_type: [],
  font_name: []
};

/* Capture state */
let captureStream = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let selection = null;
let captureMode = 'screen'; // 'screen' | 'static'
let lastAutoTitle = '';
let addTitleTouched = false;
let addFormDraft = null;

/* ── Supabase Init ── */
function loadConfig() {
  const embedded = window.REF_GALLERY_CONFIG;
  if (embedded?.url && embedded?.key) return embedded;
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
  } catch { return null; }
}

function initSupabase(config) {
  supabaseClient = window.supabase.createClient(config.url, config.key);
  updateDbStatus(true);
}

function updateDbStatus(connected) {
  document.getElementById('db-dot').classList.toggle('connected', connected);
  document.getElementById('db-status-text').textContent = connected ? 'Supabase 接続中' : '未接続';
}

function openSetupModal() {
  const cfg = loadConfig();
  if (cfg) {
    document.getElementById('cfg-url').value = cfg.url || '';
    document.getElementById('cfg-key').value = cfg.key || '';
  }
  document.getElementById('setup-modal').classList.add('active');
}

function closeSetupModal() {
  document.getElementById('setup-modal').classList.remove('active');
}

function normalizeSupabaseUrl(url) {
  url = url.trim().replace(/\/$/, '');
  if (!url) return '';
  if (!url.includes('.')) return `https://${url}.supabase.co`;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

async function saveSupabaseConfig() {
  const url = normalizeSupabaseUrl(document.getElementById('cfg-url').value);
  const key = document.getElementById('cfg-key').value.trim();
  if (!url || !key) { toast('URL と key を入力してください'); return; }

  document.getElementById('cfg-url').value = url;
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
  initSupabase({ url, key });

  try {
    await fetchItems();
    initFormSelects();
    closeSetupModal();
    toast('Supabase に接続しました');
    renderHome();
  } catch (err) {
    updateDbStatus(false);
    const msg = err?.message || String(err);
    toast(msg.includes('ref_items') ? 'テーブルがありません。SQL Editor で supabase-setup.sql を実行してください' : `接続失敗: ${msg}`);
    console.error(err);
  }
}

function showLoading(show) {
  document.getElementById('loading').classList.toggle('active', show);
}

function getPublicUrl(path) {
  if (!path || !supabaseClient) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function formatDbError(err) {
  const msg = err?.message || '';
  if (err?.code === 'PGRST204' || msg.includes('Could not find')) {
    const col = msg.match(/'(\w+)' column/)?.[1];
    return col
      ? `DBに「${col}」列がありません。SupabaseのSQL Editorで supabase-migration.sql を実行してください`
      : 'DBの列が不足しています。SupabaseのSQL Editorで supabase-migration.sql を実行してください';
  }
  return msg || '不明なエラー';
}

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url || '',
    company: row.company || '',
    section: row.section || '',
    industry: row.industry || '',
    site_type: row.site_type || '',
    color: row.color || '',
    taste: row.taste || '',
    motion: row.motion || '',
    font_type: row.font_type || '',
    font_name: row.font_name || '',
    memo: row.memo || '',
    image: getPublicUrl(row.image_path),
    image_path: row.image_path,
    sections: row.sections || [],
    createdAt: new Date(row.created_at).getTime()
  };
}

async function fetchItems() {
  if (!supabaseClient) return;
  showLoading(true);
  try {
    const { data, error } = await supabaseClient
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    items = (data || []).map(mapRow);
  } finally {
    showLoading(false);
  }
}

function convertToWebP(dataUrl, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.src = dataUrl;
  });
}

async function uploadImage(dataUrl) {
  const webpDataUrl = await convertToWebP(dataUrl);
  const res = await fetch(webpDataUrl);
  const blob = await res.blob();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error } = await supabaseClient.storage.from(BUCKET).upload(fileName, blob, {
    contentType: 'image/webp',
    upsert: false
  });
  if (error) throw error;
  return fileName;
}

/* ── Sample Data ── */
async function seedSampleData() {
  if (!supabaseClient || items.length > 0) return;
  const samples = [
    { title: 'Stripe ヘッダー', company: 'Stripe', section: 'ヘッダー', url: 'https://stripe.com', memo: 'シンプルなナビゲーション構成。' },
    { title: 'Notion メインビジュアル', company: 'Notion', section: 'メインビジュアル', url: 'https://notion.so', memo: 'キャッチコピーとCTAのバランスが参考になる。' },
    { title: 'Linear ボタン', company: 'Linear', section: 'ボタン', url: 'https://linear.app', memo: 'ホバーアニメーションの参考。' },
    { title: 'Vercel フッター', company: 'Vercel', section: 'フッター', url: 'https://vercel.com', memo: 'リンクグループの整理方法が秀逸。' },
    { title: 'Figma カード・リスト', company: 'Figma', section: 'カード・リスト', url: 'https://figma.com', memo: 'カードUIのバリエーション管理。' },
    { title: 'Apple スマホ', company: 'Apple', section: 'スマホ', url: 'https://apple.com', memo: 'レスポンシブ時の画像切替。' },
  ];
  const { error } = await supabaseClient.from(TABLE).insert(
    samples.map(s => ({ ...s, image_path: null, sections: [] }))
  );
  if (!error) await fetchItems();
}

/* ── Categories ── */
function getCustomCategories() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY) || '[]');
  } catch { return []; }
}

function saveCustomCategories(list) {
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(list));
}

function getCustomPartsCategories() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_PARTS_CATEGORIES_KEY) || '[]');
  } catch { return []; }
}

function saveCustomPartsCategories(list) {
  localStorage.setItem(CUSTOM_PARTS_CATEGORIES_KEY, JSON.stringify(list));
}

function getPartsCategoryItems() {
  const parts = BUILTIN_CATEGORY_TREE.find(g => g.group === 'パーツ');
  return [...(parts?.items || []), ...getCustomPartsCategories()];
}

function getCategoryGroupItems(groupName) {
  if (groupName === 'パーツ') return getPartsCategoryItems();
  const group = BUILTIN_CATEGORY_TREE.find(g => g.group === groupName);
  return group?.items || [];
}

function getAllBuiltinLeaves() {
  const leaves = [];
  BUILTIN_CATEGORY_TREE.forEach(({ group, items }) => {
    const groupItems = group === 'パーツ' ? getPartsCategoryItems() : items;
    if (groupItems.length) leaves.push(...groupItems);
    else leaves.push(group);
  });
  return leaves;
}

function getAllCategoryLeaves() {
  return [...getAllBuiltinLeaves(), ...getCustomCategories()];
}

function getCategoryFilterValues(active) {
  const builtin = BUILTIN_CATEGORY_TREE.find(g => g.group === active);
  if (builtin) {
    if (builtin.items.length) return getCategoryGroupItems(active);
    return [active];
  }
  if (active === 'カスタム') return getCustomCategories();
  return [active];
}

function categoryMatchesItem(item, active) {
  if (active === 'ALL') return true;
  if (!item.section) return false;
  return getCategoryFilterValues(active).includes(item.section);
}

function addCustomCategory() {
  const input = document.getElementById('custom-category-input');
  const name = input?.value.trim();
  if (!name) { toast('カテゴリー名を入力してください'); return; }
  if (name === 'ALL' || name === 'カスタム') { toast('この名前は使えません'); return; }
  if (getAllCategoryLeaves().includes(name)) { toast('既に存在するカテゴリーです'); return; }

  const custom = getCustomCategories();
  custom.push(name);
  saveCustomCategories(custom);
  if (input) input.value = '';
  renderCategoryNav();
  initFormSelects();
  toast('カテゴリーを追加しました');
}

function addPartsCategoryFromEdit() {
  const input = document.getElementById('edit-parts-category-input');
  const name = input?.value.trim();
  if (!name) { toast('カテゴリー名を入力してください'); return; }
  if (name === 'ALL' || name === 'カスタム') { toast('この名前は使えません'); return; }
  if (getAllCategoryLeaves().includes(name)) { toast('既に存在するカテゴリーです'); return; }

  const custom = getCustomPartsCategories();
  custom.push(name);
  saveCustomPartsCategories(custom);
  if (input) input.value = '';

  fillSectionSelect('edit-section', name);
  renderCategoryNav();
  toast('パーツカテゴリーを追加しました');
}

function categoryBtn(cat, isChild = false) {
  const active = cat === activeCategory ? ' active' : '';
  const childClass = isChild ? ' is-child' : '';
  return `<button type="button" class="nav-btn category-btn${active}${childClass}"
    data-category="${esc(cat)}" onclick="selectCategory(${JSON.stringify(cat)})">
    <span class="label">${esc(cat)}</span>
  </button>`;
}

function renderCategoryNav() {
  const nav = document.getElementById('category-nav');
  let html = categoryBtn('ALL');

  BUILTIN_CATEGORY_TREE.forEach(({ group, items }) => {
    const groupItems = group === 'パーツ' ? getPartsCategoryItems() : items;
    if (!groupItems.length) {
      html += categoryBtn(group);
    } else {
      html += categoryBtn(group);
      groupItems.forEach(item => { html += categoryBtn(item, true); });
    }
  });

  const custom = getCustomCategories();
  if (custom.length) {
    html += '<div class="category-group category-custom">';
    custom.forEach(name => { html += categoryBtn(name, true); });
    html += '</div>';
  }

  nav.innerHTML = html;
}

/* ── Navigation ── */
function goHome() {
  activeCategory = 'ALL';
  renderCategoryNav();
  navigate('home');
}

function selectCategory(cat) {
  activeCategory = cat;
  renderCategoryNav();
  if (document.getElementById('view-home').classList.contains('active')) {
    applyHomeFilter();
  } else {
    navigate('home');
  }
}

function navigate(view) {
  const prev = document.querySelector('.view.active');
  const prevView = prev?.id?.replace('view-', '');
  if (prevView === 'add') captureAddFormDraft();

  const next = document.getElementById('view-' + view);

  document.querySelectorAll('.nav-btn[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  document.querySelectorAll('.category-btn').forEach(b => {
    b.classList.toggle('active', view === 'home' && b.dataset.category === activeCategory);
  });

  if (prev && next && prev !== next) {
    const switchView = () => {
      prev.classList.remove('active');
      next.classList.add('active');
      onViewEnter(view);
    };

    if (typeof gsap === 'undefined') {
      switchView();
    } else {
      gsap.to(prev, { opacity: 0, duration: 0.2, onComplete: () => {
        switchView();
        gsap.fromTo(next, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
      }});
    }
  } else if (next) {
    next.classList.add('active');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(next, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
    onViewEnter(view);
  }
}

function onViewEnter(view) {
  if (view === 'add') {
    restoreAddFormDraft();
  }
  if (view === 'home') renderHome();
  if (view === 'detail' && currentId) renderDetail(currentId);
  if (view === 'edit' && currentId) renderEdit(currentId);
}

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

document.getElementById('setup-btn').addEventListener('click', openSetupModal);

document.getElementById('logo-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  goHome();
});

document.getElementById('custom-category-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addCustomCategory();
  }
});

document.getElementById('edit-parts-category-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addPartsCategoryFromEdit();
  }
});

/* ── SVG Placeholder ── */
function placeholderSVG() {
  return `<svg class="placeholder-svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="4" fill="#A4A4A4"/><path d="M16 32l8-10 6 8 4-5 8 7H16z" fill="#F3F3F3"/><circle cx="20" cy="18" r="4" fill="#F3F3F3"/></svg>`;
}

/* ── Card Render ── */
function normalizeSiteKey(url) {
  if (!url) return '';
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function getItemsForSameSite(item) {
  if (!item) return [];
  const key = normalizeSiteKey(item.url);
  if (!key) return [item];
  return items
    .filter(i => normalizeSiteKey(i.url) === key)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function groupItemsBySite(list) {
  const map = new Map();
  list.forEach(item => {
    const key = normalizeSiteKey(item.url) || `__item_${item.id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return Array.from(map.values()).map(group => {
    const sorted = group.sort((a, b) => b.createdAt - a.createdAt);
    return {
      representative: sorted[0],
      items: sorted,
      count: sorted.length
    };
  });
}

function renderCard(group) {
  const item = group.representative || group;
  const siteItems = group.items || [item];
  const thumbItem = siteItems.find(i => i.image) || item;

  const thumb = thumbItem.image
    ? `<img src="${thumbItem.image}" alt="${item.title}">`
    : placeholderSVG();

  const siteLink = item.url
    ? `<a href="${esc(item.url)}" class="card-site-link" target="_blank" rel="noopener noreferrer" title="サイトを開く" aria-label="サイトを開く">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>`
    : '';

  return `
    <div class="card" data-id="${item.id}">
      <div class="card-thumb" onclick="openDetail('${item.id}')">${thumb}</div>
      <div class="card-body">
        <div class="card-title-row">
          <p class="card-title">${esc(item.title)}</p>
          ${siteLink}
        </div>
      </div>
    </div>`;
}

function renderGrid(containerId, list) {
  const el = document.getElementById(containerId);
  if (list.length === 0) {
    el.innerHTML = `
      <div class="empty-gallery" style="grid-column:1/-1">
        <div class="icon-box lg"></div>
        <p>まだリファレンスがありません</p>
        <button class="btn" style="margin-top:24px" onclick="navigate('add')">最初の参考を追加</button>
      </div>`;
    return;
  }
  el.innerHTML = list.map(renderCard).join('');
  gsap.from(el.querySelectorAll('.card'), { opacity: 0, y: 20, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
}

/* ── Home ── */
function getFilterOptions(key) {
  if (key === 'font_name') {
    return [...new Set([
      ...ALL_LISTED_FONTS,
      ...items.flatMap(i => parseMultiValue(i.font_name))
    ])].sort();
  }
  const staticOptions = {
    industry: INDUSTRIES,
    site_type: SITE_TYPES,
    color: COLORS,
    taste: TASTES,
    motion: MOTION_TYPES,
    font_type: FONT_TYPES
  };
  return staticOptions[key] || [];
}

const FILTER_LABELS = {
  industry: '業界',
  site_type: 'サイトタイプ',
  color: 'カラー',
  taste: '特徴・テイスト',
  motion: '動き・技術',
  font_type: 'フォント種別',
  font_name: 'フォント名'
};

function updateFilterTrigger(key) {
  const wrap = document.querySelector(`.multi-select[data-filter-key="${key}"]`);
  if (!wrap) return;
  const trigger = wrap.querySelector('.multi-select-trigger');
  const selected = filterSelections[key];
  const label = FILTER_LABELS[key] || key;
  trigger.classList.toggle('has-selection', selected.length > 0);
  if (!selected.length) trigger.textContent = label;
  else if (selected.length === 1) trigger.textContent = `${label}：${selected[0]}`;
  else trigger.textContent = `${label}（${selected.length}）`;
}

function updateAllFilterTriggers() {
  Object.keys(filterSelections).forEach(updateFilterTrigger);
}

function buildFilterPanel(key) {
  const panel = document.getElementById(`filter-panel-${key}`);
  if (!panel) return;
  const options = getFilterOptions(key);
  const selected = filterSelections[key];
  panel.innerHTML = options.map(opt => `
    <label class="multi-select-option">
      <input type="checkbox" value="${esc(opt)}" data-filter-key="${key}"${selected.includes(opt) ? ' checked' : ''}>
      <span>${esc(opt)}</span>
    </label>
  `).join('');
}

function refreshHeaderFilterPanels() {
  Object.keys(filterSelections).forEach(buildFilterPanel);
  document.querySelectorAll('.multi-select-panel').forEach(panel => {
    panel.addEventListener('click', (e) => e.stopPropagation());
  });
}

function toggleFilterOption(key, value, checked) {
  if (checked) {
    if (!filterSelections[key].includes(value)) filterSelections[key].push(value);
  } else {
    filterSelections[key] = filterSelections[key].filter(v => v !== value);
  }
  updateFilterTrigger(key);
  applyHomeFilter();
}

function closeAllFilterPanels() {
  document.querySelectorAll('.multi-select.open').forEach(el => el.classList.remove('open'));
}

function initHeaderFilters() {
  refreshHeaderFilterPanels();
  updateAllFilterTriggers();

  document.querySelectorAll('.multi-select-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = trigger.closest('.multi-select');
      const wasOpen = wrap.classList.contains('open');
      closeAllFilterPanels();
      if (!wasOpen) wrap.classList.add('open');
    });
  });

  document.querySelector('.header-filters')?.addEventListener('change', (e) => {
    const input = e.target;
    if (input.type !== 'checkbox' || !input.dataset.filterKey) return;
    toggleFilterOption(input.dataset.filterKey, input.value, input.checked);
  });

  document.getElementById('filter-search')?.addEventListener('input', applyHomeFilter);

  if (!initHeaderFilters.boundOutsideClick) {
    document.addEventListener('click', closeAllFilterPanels);
    initHeaderFilters.boundOutsideClick = true;
  }
}

function parseMultiValue(value) {
  if (!value) return [];
  return String(value).split(/[,、]/).map(v => v.trim()).filter(Boolean);
}

function joinMultiValue(values) {
  return values.filter(Boolean).join(', ');
}

function matchesMultiFilter(key, itemValue) {
  const selected = filterSelections[key];
  if (!selected.length) return true;
  const itemValues = parseMultiValue(itemValue);
  if (!itemValues.length) return false;
  return selected.some(s => itemValues.includes(s));
}

function getFilteredItems() {
  const q = (document.getElementById('filter-search')?.value || '').toLowerCase();

  return items.filter(item => {
    if (!categoryMatchesItem(item, activeCategory)) return false;
    if (!matchesMultiFilter('industry', item.industry)) return false;
    if (!matchesMultiFilter('site_type', item.site_type)) return false;
    if (!matchesMultiFilter('color', item.color)) return false;
    if (!matchesMultiFilter('taste', item.taste)) return false;
    if (!matchesMultiFilter('motion', item.motion)) return false;
    if (!matchesMultiFilter('font_type', item.font_type)) return false;
    if (!matchesMultiFilter('font_name', item.font_name)) return false;
    if (q) {
      const hay = `${item.title} ${item.memo} ${item.company} ${item.section} ${item.industry} ${item.font_name}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);
}

function applyHomeFilter() {
  const filtered = getFilteredItems();
  const grouped = groupItemsBySite(filtered);
  const countEl = document.getElementById('home-count');
  if (countEl) {
    countEl.textContent = grouped.length === filtered.length
      ? `${filtered.length} 件`
      : `${grouped.length} サイト（${filtered.length} 件）`;
  }
  renderGrid('home-grid', grouped);
}

function renderHome() {
  refreshHeaderFilterPanels();
  updateAllFilterTriggers();
  applyHomeFilter();
}

/* ── Detail ── */
function openDetail(id) {
  currentId = id;
  navigate('detail');
}

function renderDetail(id) {
  const item = items.find(i => i.id === id);
  if (!item) return navigate('home');

  const siteItems = getItemsForSameSite(item);
  const heroItem = siteItems.find(i => i.image) || item;

  document.getElementById('detail-title').textContent = item.title;
  document.getElementById('detail-subtitle').textContent =
    [item.url ? normalizeSiteKey(item.url) : '', item.industry].filter(Boolean).join(' · ') || '未分類';

  const hero = document.getElementById('detail-hero');
  hero.innerHTML = heroItem.image
    ? `<img src="${heroItem.image}" alt="${item.title}">`
    : `<div style="padding:80px;text-align:center;color:#A4A4A4">${placeholderSVG()}<p style="margin-top:16px">画像未登録</p></div>`;

  document.getElementById('detail-info').innerHTML = `
    ${item.url ? `<p>URL: <a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.url)}</a></p>` : ''}
    ${item.site_type ? `<p>サイトタイプ: ${esc(item.site_type)}</p>` : ''}
    ${item.color ? `<p>カラー: ${esc(item.color)}</p>` : ''}
    ${item.taste ? `<p>テイスト: ${esc(item.taste)}</p>` : ''}
    ${item.font_type || item.font_name ? `<p>フォント: ${esc([item.font_type, item.font_name].filter(Boolean).join(' / '))}</p>` : ''}
    ${item.memo ? `<p>メモ: ${esc(item.memo)}</p>` : '<p>メモなし</p>'}
    <p>登録日: ${new Date(item.createdAt).toLocaleDateString('ja-JP')}</p>`;

  const sectionsTitle = document.getElementById('detail-sections-title');
  const secEl = document.getElementById('detail-sections');
  if (siteItems.length > 1) {
    if (sectionsTitle) sectionsTitle.textContent = '同一サイトの参考';
    secEl.innerHTML = siteItems.map(si => `
      <div class="section-item${si.id === item.id ? ' is-current' : ''}" onclick="openDetail('${si.id}')">
        ${si.image ? `<img src="${si.image}" alt="${esc(si.section || si.title)}">` : `<div style="aspect-ratio:16/10;background:#F3F3F3;display:flex;align-items:center;justify-content:center">${placeholderSVG()}</div>`}
        <p class="section-label">${esc(si.section || '未分類')}</p>
      </div>`).join('');
  } else if (item.sections && item.sections.length > 0) {
    if (sectionsTitle) sectionsTitle.textContent = 'セクション';
    secEl.innerHTML = item.sections.map(s => `
      <div class="section-item">
        ${s.image ? `<img src="${s.image}" alt="${s.name}">` : `<div style="aspect-ratio:16/10;background:#F3F3F3;display:flex;align-items:center;justify-content:center">${placeholderSVG()}</div>`}
        <p class="section-label">${esc(s.name)}</p>
      </div>`).join('');
  } else {
    if (sectionsTitle) sectionsTitle.textContent = 'セクション';
    secEl.innerHTML = `<p style="color:#A4A4A4;font-size:16px">セクション分割は未登録です</p>`;
  }

  gsap.from('#detail-hero', { opacity: 0, scale: 0.98, duration: 0.5, ease: 'power2.out' });
}

/* ── Edit ── */
function renderEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  const preview = document.getElementById('edit-preview');
  preview.innerHTML = item.image
    ? `<img src="${item.image}" alt="">`
    : `<div class="empty-state">${placeholderSVG()}<p>画像なし</p></div>`;

  document.getElementById('edit-title').value = item.title || '';
  document.getElementById('edit-url').value = item.url || '';
  document.getElementById('edit-industry').value = item.industry || '';
  document.getElementById('edit-site-type').value = item.site_type || '';
  document.getElementById('edit-memo').value = item.memo || '';
  fillSectionSelect('edit-section', item.section || '');
  initEditFormPickers(item);
}

function updateItem() {
  if (!supabaseClient) { toast('Supabase に接続してください'); return; }
  updateItemAsync();
}

async function updateItemAsync() {
  const item = items.find(i => i.id === currentId);
  if (!item) return;

  const updates = {
    title: document.getElementById('edit-title').value.trim() || '無題',
    url: document.getElementById('edit-url').value.trim(),
    company: '',
    industry: document.getElementById('edit-industry').value,
    site_type: document.getElementById('edit-site-type').value,
    color: document.getElementById('edit-color').value,
    taste: document.getElementById('edit-taste').value,
    motion: document.getElementById('edit-motion').value,
    font_type: document.getElementById('edit-font-type').value,
    font_name: getFontNameValue('edit'),
    section: document.getElementById('edit-section').value,
    memo: document.getElementById('edit-memo').value.trim()
  };

  showLoading(true);
  const { error } = await supabaseClient.from(TABLE).update(updates).eq('id', currentId);
  showLoading(false);

  if (error) { toast(formatDbError(error)); return; }
  Object.assign(item, updates);
  toast('更新しました');
  navigate('detail');
}

function deleteCurrent() {
  if (!supabaseClient) { toast('Supabase に接続してください'); return; }
  deleteCurrentAsync();
}

async function deleteCurrentAsync() {
  if (!confirm('このリファレンスを削除しますか？')) return;
  const item = items.find(i => i.id === currentId);

  showLoading(true);
  if (item && item.image_path) {
    await supabaseClient.storage.from(BUCKET).remove([item.image_path]);
  }
  const { error } = await supabaseClient.from(TABLE).delete().eq('id', currentId);
  showLoading(false);

  if (error) { toast('削除に失敗しました'); return; }
  currentId = null;
  toast('削除しました');
  await fetchItems();
  navigate('home');
}

/* ── Add ── */
function showUrlForm() {
  pendingImage = null;
}

function previewChoiceHTML() {
  return `<div class="preview-choice">
    <button type="button" class="preview-choice-btn" onclick="startCapture()">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      <span>画面キャプチャ</span>
    </button>
    <div class="preview-choice-divider"></div>
    <button type="button" class="preview-choice-btn" onclick="document.getElementById('file-input').click()">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <span>画像アップロード</span>
    </button>
  </div>`;
}

function loadAddFormDraftFromStorage() {
  try {
    return JSON.parse(sessionStorage.getItem(ADD_DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveAddFormDraftToStorage(draft) {
  try {
    const { pendingImage: _image, ...rest } = draft;
    sessionStorage.setItem(ADD_DRAFT_KEY, JSON.stringify(rest));
  } catch (err) {
    console.warn('下書きの保存に失敗しました', err);
  }
}

function captureAddFormDraft() {
  const draft = {
    title: document.getElementById('add-title')?.value || '',
    url: document.getElementById('add-url')?.value || '',
    industry: document.getElementById('add-industry')?.value || '',
    site_type: document.getElementById('add-site-type')?.value || '',
    color: document.getElementById('add-color')?.value || '',
    taste: document.getElementById('add-taste')?.value || '',
    motion: document.getElementById('add-motion')?.value || '',
    font_type: document.getElementById('add-font-type')?.value || '',
    font_name: getFontNameValue('add'),
    memo: document.getElementById('add-memo')?.value || '',
    pendingImage: pendingImage || null,
    addTitleTouched,
    lastAutoTitle
  };

  const hasContent = draft.title || draft.url || draft.industry || draft.site_type
    || draft.color || draft.taste || draft.motion || draft.font_type
    || draft.font_name || draft.memo || draft.pendingImage;

  if (!hasContent) {
    addFormDraft = null;
    sessionStorage.removeItem(ADD_DRAFT_KEY);
    return;
  }

  addFormDraft = draft;
  saveAddFormDraftToStorage(draft);
}

function applyAddFormDraft(d) {
  if (!d) return;
  document.getElementById('add-title').value = d.title || '';
  document.getElementById('add-url').value = d.url || '';
  document.getElementById('add-industry').value = d.industry || '';
  document.getElementById('add-site-type').value = d.site_type || '';
  document.getElementById('add-color').value = d.color || '';
  document.getElementById('add-taste').value = d.taste || '';
  document.getElementById('add-motion').value = d.motion || '';
  document.getElementById('add-font-type').value = d.font_type || '';
  const addFontHidden = document.getElementById('add-font-name');
  if (addFontHidden) addFontHidden.value = '';
  const addOtherEl = document.getElementById('add-font-name-other');
  if (addOtherEl) {
    addOtherEl.value = '';
    addOtherEl.hidden = true;
  }
  document.getElementById('add-memo').value = d.memo || '';
  addTitleTouched = !!d.addTitleTouched;
  lastAutoTitle = d.lastAutoTitle || '';
  initAddFormPickers();
  updateFontNameUI('add', d.font_name || '');
  pendingImage = d.pendingImage || null;
  if (pendingImage) setPreview(pendingImage);
  else document.getElementById('preview-area').innerHTML = previewChoiceHTML();
}

function restoreAddFormDraft() {
  if (!addFormDraft) addFormDraft = loadAddFormDraftFromStorage();
  if (!addFormDraft) return;
  applyAddFormDraft(addFormDraft);
}

function resetAddForm() {
  addFormDraft = null;
  sessionStorage.removeItem(ADD_DRAFT_KEY);
  document.getElementById('add-title').value = '';
  document.getElementById('add-url').value = '';
  document.getElementById('add-industry').value = '';
  document.getElementById('add-site-type').value = '';
  document.getElementById('add-color').value = '';
  const addFontHidden = document.getElementById('add-font-name');
  if (addFontHidden) addFontHidden.value = '';
  const addOtherEl = document.getElementById('add-font-name-other');
  if (addOtherEl) {
    addOtherEl.value = '';
    addOtherEl.hidden = true;
  }
  document.getElementById('add-memo').value = '';
  lastAutoTitle = '';
  addTitleTouched = false;
  clearAddFormPickers();
  pendingImage = null;
  document.getElementById('preview-area').innerHTML = previewChoiceHTML();
}

let captureDraftTimer;
function scheduleCaptureAddFormDraft() {
  clearTimeout(captureDraftTimer);
  captureDraftTimer = setTimeout(captureAddFormDraft, 200);
}

function initAddFormDraftAutoSave() {
  const form = document.getElementById('add-form');
  if (!form || form.dataset.draftBound) return;
  form.dataset.draftBound = '1';
  form.addEventListener('input', scheduleCaptureAddFormDraft);
  form.addEventListener('change', scheduleCaptureAddFormDraft);
  form.addEventListener('click', (e) => {
    if (e.target.closest('.option-btn')) scheduleCaptureAddFormDraft();
  });
}

function clearAddForm() {
  resetAddForm();
  toast('入力内容をクリアしました');
}

function siteNameFromUrl(url) {
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const host = new URL(normalized).hostname.replace(/^www\./i, '');
    const base = host.split('.')[0];
    if (!base) return '';
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return '';
  }
}

function canAutoFillSiteName() {
  const titleEl = document.getElementById('add-title');
  if (!titleEl) return false;
  const current = titleEl.value.trim();
  return !addTitleTouched || !current || current === lastAutoTitle;
}

function applyAutoSiteName(name) {
  if (!name || !canAutoFillSiteName()) return;
  const titleEl = document.getElementById('add-title');
  titleEl.value = name;
  lastAutoTitle = name;
}

async function fetchPageTitle(url) {
  const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const proxies = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`
  ];

  for (const toProxyUrl of proxies) {
    try {
      const res = await fetch(toProxyUrl(fullUrl));
      if (!res.ok) continue;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const pageTitle = doc.querySelector('title')?.textContent?.trim();
      if (pageTitle) return pageTitle;
    } catch {
      // 次のプロキシを試す
    }
  }
  return '';
}

async function updateSiteNameFromUrl() {
  const url = document.getElementById('add-url')?.value.trim();
  if (!url || !canAutoFillSiteName()) return;

  const pageTitle = await fetchPageTitle(url);
  if (pageTitle) {
    applyAutoSiteName(pageTitle.slice(0, 200));
    return;
  }

  applyAutoSiteName(siteNameFromUrl(url));
}

function initAddFormAutoTitle() {
  const urlEl = document.getElementById('add-url');
  const titleEl = document.getElementById('add-title');
  if (!urlEl || !titleEl) return;

  let timer;
  urlEl.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(updateSiteNameFromUrl, 400);
  });
  urlEl.addEventListener('blur', updateSiteNameFromUrl);

  titleEl.addEventListener('input', () => {
    const val = titleEl.value.trim();
    if (!val) {
      addTitleTouched = false;
      lastAutoTitle = '';
      return;
    }
    if (val !== lastAutoTitle) addTitleTouched = true;
  });
}

function setPreview(dataUrl) {
  pendingImage = dataUrl;
  document.getElementById('preview-area').innerHTML = `
    <img src="${dataUrl}" alt="preview">
    <button type="button" class="preview-remove-btn" onclick="clearPreviewImage()" title="画像を削除" aria-label="画像を削除">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  `;
  scheduleCaptureAddFormDraft();
}

function clearPreviewImage() {
  pendingImage = null;
  document.getElementById('preview-area').innerHTML = previewChoiceHTML();
  scheduleCaptureAddFormDraft();
}

function saveItem() {
  if (!supabaseClient) { toast('Supabase に接続してください'); return; }
  saveItemAsync();
}

async function saveItemAsync() {
  const title = document.getElementById('add-title').value.trim();
  if (!title) { toast('サイト名を入力してください'); return; }

  showLoading(true);
  try {
    let imagePath = null;
    if (pendingImage) {
      imagePath = await uploadImage(pendingImage);
    }

    const row = {
      title,
      url: document.getElementById('add-url').value.trim(),
      company: '',
      section: resolveSectionFromActiveCategory(),
      industry: document.getElementById('add-industry').value,
      site_type: document.getElementById('add-site-type').value,
      color: document.getElementById('add-color').value,
      taste: document.getElementById('add-taste').value,
      motion: document.getElementById('add-motion').value,
      font_type: document.getElementById('add-font-type').value,
      font_name: getFontNameValue('add'),
      memo: document.getElementById('add-memo').value.trim(),
      image_path: imagePath,
      sections: []
    };

    const { error } = await supabaseClient.from(TABLE).insert(row);
    if (error) throw error;

    pendingImage = null;
    captureAddFormDraft();
    toast('Supabase に保存しました');
    await fetchItems();
    navigate('home');
  } catch (err) {
    toast(formatDbError(err));
    console.error(err);
  } finally {
    showLoading(false);
  }
}

document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    const webpDataUrl = await convertToWebP(ev.target.result);
    setPreview(webpDataUrl);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

/* ── Screen Capture ── */
async function startCapture() {
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    captureMode = 'screen';
    const video = document.getElementById('capture-video');
    const img = document.getElementById('capture-image');
    const overlay = document.getElementById('capture-overlay');
    const hint = document.getElementById('capture-hint');

    video.style.display = 'block';
    img.style.display = 'none';
    video.srcObject = captureStream;

    overlay.classList.add('active');
    overlay.style.opacity = '1';
    selection = null;
    resetSelectionBox();

    if (hint) {
      hint.textContent = 'REF Gallery のタブで、ドラッグして範囲を選択 → 離すとキャプチャ';
    }

    captureStream.getVideoTracks()[0].addEventListener('ended', closeCapture);

    toast('REF Gallery のタブに戻って範囲を選択してください');
  } catch (err) {
    toast('画面共有がキャンセルされました');
  }
}

function closeCapture() {
  if (captureStream) {
    captureStream.getTracks().forEach(t => t.stop());
    captureStream = null;
  }
  document.getElementById('capture-overlay').classList.remove('active');
  document.getElementById('capture-video').srcObject = null;
  isDragging = false;
  selection = null;
  resetSelectionBox();
}

function resetSelectionBox() {
  const box = document.getElementById('selection-box');
  box.classList.remove('visible');
  box.style.cssText = '';
}

const stage = document.getElementById('capture-stage');

if (stage) stage.addEventListener('mousedown', e => {
  if (e.target.closest('.capture-toolbar')) return;
  isDragging = true;
  const rect = stage.getBoundingClientRect();
  dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  selection = { x: dragStart.x, y: dragStart.y, w: 0, h: 0 };
  updateSelectionBox();
});

if (stage) stage.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const rect = stage.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  selection = {
    x: Math.min(dragStart.x, cx),
    y: Math.min(dragStart.y, cy),
    w: Math.abs(cx - dragStart.x),
    h: Math.abs(cy - dragStart.y)
  };
  updateSelectionBox();
});

if (stage) stage.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  if (selection && selection.w > 8 && selection.h > 8) {
    confirmCapture();
  }
});

function updateSelectionBox() {
  if (!selection) return;
  const box = document.getElementById('selection-box');
  box.classList.add('visible');
  box.style.left = selection.x + 'px';
  box.style.top = selection.y + 'px';
  box.style.width = selection.w + 'px';
  box.style.height = selection.h + 'px';
}

function confirmCapture() {
  if (!selection || selection.w < 8 || selection.h < 8) {
    toast('範囲をドラッグで選択してください');
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const video = document.getElementById('capture-video');
  const img = document.getElementById('capture-image');

  let sourceEl = captureMode === 'screen' ? video : img;
  if (captureMode === 'screen' && !video.videoWidth) {
    toast('映像の準備中です。少々お待ちください');
    return;
  }

  const srcW = captureMode === 'screen' ? video.videoWidth : img.naturalWidth;
  const srcH = captureMode === 'screen' ? video.videoHeight : img.naturalHeight;

  const elW = stageRect.width;
  const elH = stageRect.height;
  const scale = Math.min(elW / srcW, elH / srcH);
  const renderedW = srcW * scale;
  const renderedH = srcH * scale;
  const offsetX = (elW - renderedW) / 2;
  const offsetY = (elH - renderedH) / 2;

  const sx = (selection.x - offsetX) / scale;
  const sy = (selection.y - offsetY) / scale;
  const sw = selection.w / scale;
  const sh = selection.h / scale;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  closeCapture();
  setPreview(dataUrl);
  toast('キャプチャしました');
}

/* ── Form selects ── */
function fillSelect(id, options, placeholder = '選択してください') {
  const el = document.getElementById(id);
  if (!el) return;
  const current = el.value;
  el.innerHTML = `<option value="">${placeholder}</option>` +
    options.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if ([...el.options].some(o => o.value === current)) el.value = current;
}

function getAllSectionOptions() {
  const options = [];
  BUILTIN_CATEGORY_TREE.forEach(({ group, items }) => {
    const groupItems = group === 'パーツ' ? getPartsCategoryItems() : items;
    if (groupItems.length) options.push({ group, items: groupItems });
    else options.push({ group, items: [group] });
  });
  const custom = getCustomCategories();
  if (custom.length) options.push({ group: 'カスタム', items: custom });
  return options;
}

function fillSectionSelect(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  let html = '<option value="">未分類</option>';
  getAllSectionOptions().forEach(({ group, items }) => {
    html += `<optgroup label="${esc(group)}">`;
    items.forEach(v => { html += `<option value="${esc(v)}">${esc(v)}</option>`; });
    html += '</optgroup>';
  });
  el.innerHTML = html;

  const val = value || '';
  if (val && ![...el.options].some(o => o.value === val)) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    el.add(opt);
  }
  if (val) el.value = val;
}

function isOtherFontType(types) {
  return types.includes('その他');
}

function getFontsForTypes(types) {
  const filtered = types.filter(t => t !== 'その他');
  if (!filtered.length) return ALL_LISTED_FONTS;
  return [...new Set(filtered.flatMap(t => FONTS_BY_TYPE[t] || []))];
}

function getFontNameValue(prefix) {
  const fromButtons = parseMultiValue(document.getElementById(`${prefix}-font-name`)?.value || '');
  const fromOther = parseMultiValue(document.getElementById(`${prefix}-font-name-other`)?.value || '');
  return joinMultiValue([...fromButtons, ...fromOther]);
}

function updateFontNameUI(prefix, fontName) {
  const types = parseMultiValue(document.getElementById(`${prefix}-font-type`)?.value || '');
  const hasOtherType = isOtherFontType(types);
  const onlyOther = hasOtherType && types.filter(t => t !== 'その他').length === 0;
  const container = document.getElementById(`${prefix}-font-name-options`);
  const hidden = document.getElementById(`${prefix}-font-name`);
  const otherEl = document.getElementById(`${prefix}-font-name-other`);
  if (!hidden) return;

  const allSelected = fontName !== undefined
    ? parseMultiValue(fontName)
    : [...parseMultiValue(hidden.value), ...parseMultiValue(otherEl?.value || '')];

  if (onlyOther) {
    if (container) container.innerHTML = '';
    hidden.value = '';
    if (otherEl) {
      otherEl.hidden = false;
      otherEl.value = joinMultiValue(allSelected);
    }
    return;
  }

  const availableFonts = getFontsForTypes(types.filter(t => t !== 'その他'));
  const listedSelected = allSelected.filter(f => availableFonts.includes(f) || ALL_LISTED_FONTS.includes(f));
  const customSelected = allSelected.filter(f => !ALL_LISTED_FONTS.includes(f));
  const options = [...new Set([...availableFonts, ...listedSelected])];

  hidden.value = joinMultiValue(listedSelected);
  renderMultiOptionButtons(`${prefix}-font-name-options`, `${prefix}-font-name`, options);

  if (otherEl) {
    otherEl.hidden = !hasOtherType;
    otherEl.value = hasOtherType ? joinMultiValue(customSelected) : '';
  }
}

function resolveSectionFromActiveCategory() {
  if (!activeCategory || activeCategory === 'ALL') return '';
  const parent = BUILTIN_CATEGORY_TREE.find(g => g.group === activeCategory);
  if (parent) return parent.items.length ? '' : parent.group;
  if (getAllCategoryLeaves().includes(activeCategory)) return activeCategory;
  return '';
}

function initFormSelects() {
  ['add', 'edit'].forEach(prefix => {
    fillSelect(`${prefix}-site-type`, SITE_TYPES);
    fillSelect(`${prefix}-industry`, INDUSTRIES);
  });
  initAddFormPickers();
  updateFontNameUI('add');
  updateFontNameUI('edit');
}

function renderMultiOptionButtons(containerId, hiddenInputId, options) {
  const container = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  if (!container || !hidden) return;
  const selected = parseMultiValue(hidden.value);
  container.innerHTML = options.map(opt => `
    <button type="button" class="option-btn${selected.includes(opt) ? ' active' : ''}"
      data-value="${esc(opt)}" data-target="${hiddenInputId}"
      onclick="toggleFormOption('${hiddenInputId}', this)">${esc(opt)}</button>
  `).join('');
}

function toggleFormOption(hiddenInputId, btn) {
  const hidden = document.getElementById(hiddenInputId);
  const value = btn.dataset.value;
  let selected = parseMultiValue(hidden.value);
  if (selected.includes(value)) {
    selected = selected.filter(v => v !== value);
    btn.classList.remove('active');
  } else {
    selected.push(value);
    btn.classList.add('active');
  }
  hidden.value = joinMultiValue(selected);
  if (hiddenInputId === 'add-font-type' || hiddenInputId === 'edit-font-type') {
    updateFontNameUI(hiddenInputId.replace('-font-type', ''));
  }
}

function clearMultiOptionPicker(hiddenInputId) {
  const hidden = document.getElementById(hiddenInputId);
  if (hidden) hidden.value = '';
  document.querySelectorAll(`.option-btn[data-target="${hiddenInputId}"]`).forEach(b => b.classList.remove('active'));
}

function initAddFormPickers() {
  renderMultiOptionButtons('add-color-options', 'add-color', COLORS);
  renderMultiOptionButtons('add-taste-options', 'add-taste', TASTES);
  renderMultiOptionButtons('add-motion-options', 'add-motion', MOTION_TYPES);
  renderMultiOptionButtons('add-font-type-options', 'add-font-type', FONT_TYPES);
}

function initEditFormPickers(item) {
  document.getElementById('edit-color').value = item.color || '';
  renderMultiOptionButtons('edit-color-options', 'edit-color', COLORS);
  document.getElementById('edit-taste').value = item.taste || '';
  renderMultiOptionButtons('edit-taste-options', 'edit-taste', TASTES);
  document.getElementById('edit-motion').value = item.motion || '';
  renderMultiOptionButtons('edit-motion-options', 'edit-motion', MOTION_TYPES);
  document.getElementById('edit-font-type').value = item.font_type || '';
  renderMultiOptionButtons('edit-font-type-options', 'edit-font-type', FONT_TYPES);
  updateFontNameUI('edit', item.font_name || '');
}

function clearAddFormPickers() {
  ['add-color', 'add-taste', 'add-motion', 'add-font-type', 'add-font-name'].forEach(clearMultiOptionPicker);
  const container = document.getElementById('add-font-name-options');
  if (container) container.innerHTML = '';
  const otherEl = document.getElementById('add-font-name-other');
  if (otherEl) {
    otherEl.value = '';
    otherEl.hidden = true;
  }
}

/* ── Utils ── */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Init ── */
function runIntroAnimation() {
  if (typeof gsap === 'undefined') return;
  gsap.from('.sidebar', { x: -20, opacity: 0, duration: 0.5, ease: 'power2.out' });
  gsap.from('.main', { opacity: 0, duration: 0.6, delay: 0.15, ease: 'power2.out' });
}

function initHeaderScroll() {
  const header = document.getElementById('app-header');
  const main = document.querySelector('.main');
  if (!header) return;

  const updateHeaderScroll = () => {
    const scrolled = (main?.scrollTop || 0) > 0 || window.scrollY > 0;
    header.classList.toggle('is-scrolled', scrolled);
  };

  main?.addEventListener('scroll', updateHeaderScroll, { passive: true });
  window.addEventListener('scroll', updateHeaderScroll, { passive: true });
  updateHeaderScroll();
}

async function initApp() {
  runIntroAnimation();
  renderCategoryNav();
  initFormSelects();
  initAddFormAutoTitle();
  initAddFormDraftAutoSave();
  initHeaderFilters();
  initHeaderScroll();
  addFormDraft = loadAddFormDraftFromStorage();

  const cfg = loadConfig();
  if (cfg && cfg.url && cfg.key) {
    initSupabase(cfg);
    try {
      await fetchItems();
      initFormSelects();
      await seedSampleData();
    } catch (err) {
      updateDbStatus(false);
      console.error(err);
      toast('Supabase からデータを取得できませんでした');
      openSetupModal();
    }
  } else {
    openSetupModal();
  }

  renderHome();
}

initApp();