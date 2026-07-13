/* Google Fonts プレビューページ */
const FONTS_EXTRA_KEY = 'ref-gallery-extra-google-fonts';
const PREVIEW_TEXT = {
  ja: '美しいデザインと技術の融合。ひらがな、カタカナ、漢字、ABC 123',
  latin: 'The quick brown fox jumps over the lazy dog. 0123456789'
};

const fontsPageState = {
  language: 'ja',
  weight: 400,
  fontsLoaded: false
};

function getFontsCatalog() {
  const base = window.GOOGLE_FONTS_CATALOG || [];
  let extra = [];
  try {
    extra = JSON.parse(localStorage.getItem(FONTS_EXTRA_KEY) || '[]');
  } catch { /* ignore */ }
  return [...base, ...extra];
}

function toGoogleFamilyParam(name) {
  return name.trim().replace(/\s+/g, '+');
}

function buildGoogleFontsUrl(fonts) {
  const params = fonts.map(f => `family=${toGoogleFamilyParam(f.googleFamily || f.family)}:wght@400;700`);
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

function injectGoogleFonts(fonts) {
  const id = 'google-fonts-catalog-link';
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = buildGoogleFontsUrl(fonts);
  fontsPageState.fontsLoaded = true;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function getFilteredFonts() {
  return getFontsCatalog().filter(f => f.language === fontsPageState.language);
}

function renderFontRow(font) {
  const preview = PREVIEW_TEXT[font.language] || PREVIEW_TEXT.latin;
  const fallback = font.language === 'ja' ? 'sans-serif' : 'serif';
  const jaClass = font.language === 'ja' ? ' is-ja' : '';
  return `
    <article class="font-row" data-font-id="${escHtml(font.id)}">
      <div class="font-row-header">
        <span class="font-row-name">${escHtml(font.name)}</span>
        <span class="font-row-meta">2 styles</span>
      </div>
      <p class="font-row-desc">${escHtml(font.description)}</p>
      <p class="font-row-preview${jaClass}" style="font-family:'${escHtml(font.family)}',${fallback}">${escHtml(preview)}</p>
    </article>
  `;
}

function renderFontsPage() {
  const root = document.getElementById('fonts-page');
  const grid = document.getElementById('fonts-grid');
  const countEl = document.getElementById('fonts-count');
  if (!root || !grid) return;

  root.dataset.weight = String(fontsPageState.weight);
  root.dataset.language = fontsPageState.language;

  const fonts = getFilteredFonts();
  if (countEl) countEl.textContent = `${fonts.length} フォント`;

  if (!fonts.length) {
    grid.innerHTML = '<p class="fonts-empty">表示するフォントがありません</p>';
    return;
  }

  grid.innerHTML = `<div class="fonts-list">${fonts.map(renderFontRow).join('')}</div>`;
}

function updateToggleUI() {
  const weightToggle = document.getElementById('fonts-weight-toggle');
  const langToggle = document.getElementById('fonts-lang-toggle');
  if (weightToggle) {
    weightToggle.checked = fontsPageState.weight === 700;
    weightToggle.setAttribute('aria-checked', String(fontsPageState.weight === 700));
  }
  if (langToggle) {
    langToggle.checked = fontsPageState.language === 'latin';
    langToggle.setAttribute('aria-checked', String(fontsPageState.language === 'latin'));
  }
  document.querySelectorAll('[data-fonts-weight-label]').forEach(el => {
    el.classList.toggle('is-active', el.dataset.fontsWeightLabel === String(fontsPageState.weight));
  });
  document.querySelectorAll('[data-fonts-lang-label]').forEach(el => {
    const active = fontsPageState.language === 'ja'
      ? el.dataset.fontsLangLabel === 'ja'
      : el.dataset.fontsLangLabel === 'latin';
    el.classList.toggle('is-active', active);
  });
}

function setFontWeight(weight) {
  fontsPageState.weight = weight;
  updateToggleUI();
  renderFontsPage();
}

function setFontLanguage(language) {
  fontsPageState.language = language;
  updateToggleUI();
  renderFontsPage();
}

function bindFontsPageControls() {
  const weightToggle = document.getElementById('fonts-weight-toggle');
  const langToggle = document.getElementById('fonts-lang-toggle');
  if (weightToggle && !weightToggle.dataset.bound) {
    weightToggle.dataset.bound = '1';
    weightToggle.addEventListener('change', () => {
      setFontWeight(weightToggle.checked ? 700 : 400);
    });
  }
  if (langToggle && !langToggle.dataset.bound) {
    langToggle.dataset.bound = '1';
    langToggle.addEventListener('change', () => {
      setFontLanguage(langToggle.checked ? 'latin' : 'ja');
    });
  }
}

function initFontsPage() {
  if (!fontsPageState.fontsLoaded) {
    injectGoogleFonts(getFontsCatalog());
  }
  bindFontsPageControls();
  updateToggleUI();
  renderFontsPage();
}

/* 新規追加画面からの拡張用 */
function registerExtraGoogleFont(font) {
  const required = ['id', 'name', 'family', 'googleFamily', 'category', 'description', 'language'];
  if (!font || required.some(k => !font[k])) return false;
  const list = JSON.parse(localStorage.getItem(FONTS_EXTRA_KEY) || '[]');
  if (list.some(f => f.id === font.id)) return false;
  list.push(font);
  localStorage.setItem(FONTS_EXTRA_KEY, JSON.stringify(list));
  fontsPageState.fontsLoaded = false;
  injectGoogleFonts(getFontsCatalog());
  if (document.getElementById('view-fonts')?.classList.contains('active')) {
    renderFontsPage();
  }
  return true;
}

window.initFontsPage = initFontsPage;
window.registerExtraGoogleFont = registerExtraGoogleFont;
