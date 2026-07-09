const API_BASE = '../api/';
const DEFAULT_PRODUCT_IMAGE = 'assets/products/engineering-plastics-catalog.png';

const navGroups = [
  {
    id: 'general',
    title: 'Genel',
    items: [['dashboard', 'Dashboard']],
  },
  {
    id: 'products',
    title: 'Ürün Yönetimi',
    items: [
      ['products', 'Ürünler'],
      ['imports', 'Stok Sync'],
      ['restStocks', 'Rest Stokları'],
      ['gallery', 'Galeri'],
    ],
  },
  {
    id: 'pages',
    title: 'Sayfa Düzenlemeleri',
    items: [
      ['hero', 'Hero Slider'],
      ['pages', 'Sayfa Metinleri'],
      ['about', 'Hakkımızda'],
      ['sectors', 'Sektörler'],
      ['blog', 'Blog'],
      ['contact', 'İletişim'],
      ['legal', 'Bilgi Sayfaları'],
    ],
  },
  {
    id: 'operations',
    title: 'Operasyon',
    items: [
      ['orders', 'Siparişler'],
      ['formSubmissions', 'Form Talepleri'],
      ['membership', 'Üyelik'],
      ['members', 'Üyeler'],
      ['newsletter', 'Bülten Üyeleri'],
      ['emails', 'E-postalar'],
      ['mailSettings', 'Mail Ayarları'],
      ['forms', 'Form Ayarları'],
      ['payments', 'Ödeme'],
    ],
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    items: [
      ['social', 'Sosyal Medya'],
      ['settings', 'Genel Ayarlar'],
      ['media', 'Dosyalar / JSON'],
    ],
  },
];

const views = navGroups.flatMap((group) => group.items);

const state = {
  authenticated: false,
  content: null,
  view: 'dashboard',
  query: '',
  selectedProductId: null,
  selectedBlogPostId: null,
  selectedLegalPageId: null,
  selectedOrderId: null,
  selectedFormSubmissionId: null,
  selectedMemberId: null,
  selectedNewsletterSubscriberId: null,
  selectedEmailTemplateId: null,
  testMail: {
    to: 'info@plastik24.com.tr',
    subject: 'Plastik24 test maili',
    body: 'Bu mail Plastik24 admin panelinden gönderilen test mesajıdır.',
  },
  blogStatusFilter: 'all',
  blogCategoryFilter: 'all',
  blogSelectedIds: [],
  productTab: 'general',
  openNavGroups: navGroups.map((group) => group.id),
  importPreview: [],
  dirty: false,
};

const defaultContentPatch = {
  pageTextsEn: {
    hero: {},
    home: {},
    portfolio: {},
    sectors: {},
    blog: {},
    contact: {},
    info: { blocks: [] },
  },
  heroSlides: [],
  blogPosts: [],
  aboutPage: {
    title: 'Hakkımızda',
    titleEn: 'About Us',
    subtitle: '',
    subtitleEn: '',
    content: '',
    contentEn: '',
    image: DEFAULT_PRODUCT_IMAGE,
    sourceUrl: '',
    highlights: [],
  },
  legalPages: [],
  contactPage: {
    title: 'Raceplast ile İletişime Geçin',
    titleEn: 'Contact Raceplast',
    description: '',
    descriptionEn: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    mapEmbedUrl: '',
    workingHours: '',
    departments: [],
  },
  formSettings: {
    quoteFormEmail: '',
    contactFormEmail: '',
    requireGdprConsent: true,
    successMessage: '',
    successMessageEn: '',
    fields: [],
  },
  membershipSettings: {
    title: 'Kurumsal Üyelik',
    description: '',
    emailVerificationRequired: true,
    requireCompanyInfo: true,
    approvalMode: 'manual',
    successMessage: '',
    companyFields: [],
  },
  members: [],
  newsletterSubscribers: [],
  formSubmissions: [],
  emailSettings: {
    senderName: 'Plastik24',
    senderEmail: 'info@plastik24.com.tr',
    accountingEmail: 'info@plastik24.com.tr',
    orderDetailTemplateId: 'order-details',
    paymentReceivedTemplateId: 'payment-received',
    verificationTemplateId: 'email-verification',
    templates: [],
  },
  mailSettings: {
    defaultFromName: 'Plastik24',
    defaultFromEmail: 'info@plastik24.com.tr',
    notificationEmail: 'info@plastik24.com.tr',
    smtpHost: 'mail.plastik24.com.tr',
    smtpPort: 465,
    smtpSecure: 'ssl',
    smtpAuth: true,
    smtpUsername: '_mainaccount@plastik24.com.tr',
    smtpPassword: 'plastik24.com.tr',
    imapHost: 'mail.plastik24.com.tr',
    imapPort: 993,
    pop3Host: 'mail.plastik24.com.tr',
    pop3Port: 995,
    nilveraEnabled: false,
    nilveraApiBase: 'https://apitest.nilvera.com',
    nilveraApiKey: '',
  },
  mediaLibrary: [],
  socialLinks: {
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    x: '',
    whatsapp: '',
  },
  paymentSettings: {
    currency: 'EUR',
    taxEnabled: true,
    providers: [],
    bankAccounts: [],
  },
  orders: [],
  importSettings: {
    googleSheetCsvUrl: '',
    lastSyncAt: '',
    syncMode: 'upsert-products',
    skuColumn: 'sku',
    stockColumn: 'stock',
  },
};

const els = {
  loginView: document.querySelector('#loginView'),
  appView: document.querySelector('#appView'),
  loginForm: document.querySelector('#loginForm'),
  loginMessage: document.querySelector('#loginMessage'),
  nav: document.querySelector('#mainNav'),
  viewTitle: document.querySelector('#viewTitle'),
  main: document.querySelector('#mainContent'),
  drawer: document.querySelector('#editorDrawer'),
  saveButton: document.querySelector('#saveButton'),
  logoutButton: document.querySelector('#logoutButton'),
  search: document.querySelector('#globalSearch'),
  syncStatus: document.querySelector('#syncStatus'),
  alertBar: document.querySelector('#alertBar'),
  toast: document.querySelector('#toast'),
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function imageSrc(url) {
  if (!url) return '';
  if (/^(https?:|data:|\/)/.test(url)) return url;
  return `../${url}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseByKind(value, kind) {
  if (kind === 'number') return value === '' ? undefined : Number(value);
  if (kind === 'int') return value === '' ? 0 : parseInt(value, 10);
  if (kind === 'bool') return Boolean(value);
  if (kind === 'lines') return String(value).split('\n').map((item) => item.trim()).filter(Boolean);
  if (kind === 'tags') return String(value).split(',').map((item) => item.trim()).filter(Boolean);
  if (kind === 'attributes') {
    return String(value)
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, values = ''] = line.split(':');
        return {
          name: (name || '').trim(),
          values: values.split(',').map((part) => part.trim()).filter(Boolean),
          visible: true,
          variation: false,
        };
      })
      .filter((item) => item.name);
  }
  if (kind === 'variations-lines') {
    return String(value)
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((line) => {
        const [measure = '', sku = '', stock = ''] = line.split('|').map((part) => part.trim());
        return {
          id: uid('variation'),
          sku,
          attributes: { Ölçü: measure },
          stock: num(stock, 0),
          isPublished: true,
        };
      })
      .filter((item) => item.attributes.Ölçü);
  }
  if (kind === 'json-array') {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      showToast('JSON formatı okunamadı.');
      return [];
    }
  }
  return value;
}

function deepMergeDefaults(target, defaults) {
  Object.entries(defaults).forEach(([key, value]) => {
    if (target[key] === undefined || target[key] === null) {
      target[key] = structuredClone(value);
      return;
    }
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      deepMergeDefaults(target[key], value);
    }
  });
}

function ensureContentShape() {
  if (!state.content) return;
  deepMergeDefaults(state.content, defaultContentPatch);
  if (!Array.isArray(state.content.products)) state.content.products = [];
  if (!Array.isArray(state.content.restStocks)) state.content.restStocks = [];
  if (!Array.isArray(state.content.sectors)) state.content.sectors = [];
  if (!Array.isArray(state.content.blogPosts)) state.content.blogPosts = [];
  if (!Array.isArray(state.content.legalPages)) state.content.legalPages = [];
  if (!Array.isArray(state.content.pageTexts?.info?.blocks)) state.content.pageTexts.info.blocks = [];
  if (!Array.isArray(state.content.aboutPage.highlights)) state.content.aboutPage.highlights = [];
  if (!Array.isArray(state.content.contactPage.departments)) state.content.contactPage.departments = [];
  if (!Array.isArray(state.content.formSettings.fields)) state.content.formSettings.fields = [];
  if (!Array.isArray(state.content.membershipSettings.companyFields)) state.content.membershipSettings.companyFields = [];
  if (!Array.isArray(state.content.members)) state.content.members = [];
  if (!Array.isArray(state.content.newsletterSubscribers)) state.content.newsletterSubscribers = [];
  if (!Array.isArray(state.content.formSubmissions)) state.content.formSubmissions = [];
  if (!Array.isArray(state.content.emailSettings.templates)) state.content.emailSettings.templates = [];
  if (!Array.isArray(state.content.mediaLibrary)) state.content.mediaLibrary = [];
  if (!Array.isArray(state.content.paymentSettings.providers)) state.content.paymentSettings.providers = [];
  if (!Array.isArray(state.content.paymentSettings.bankAccounts)) state.content.paymentSettings.bankAccounts = [];
  products().forEach(normalizeProduct);
}

function normalizeProduct(product) {
  product.image ||= DEFAULT_PRODUCT_IMAGE;
  if (!Array.isArray(product.gallery)) product.gallery = product.image ? [product.image] : [];
  if (!Array.isArray(product.foodCompliance)) product.foodCompliance = ['None'];
  if (!Array.isArray(product.technicalProperties)) product.technicalProperties = [];
  if (!Array.isArray(product.technicalPropertiesEn)) product.technicalPropertiesEn = [];
  if (!Array.isArray(product.tags)) product.tags = [];
  if (!Array.isArray(product.attributes)) product.attributes = [];
  if (!Array.isArray(product.variations)) product.variations = [];
  product.materialType ||= product.material || '';
  product.stockUnit ||= 'Adet';
  product.currency ||= state.content?.paymentSettings?.currency || 'EUR';
  product.taxStatus ||= 'taxable';
  product.manageStock ??= true;
  product.stockStatus ||= Number(product.realStock || 0) > 0 ? 'instock' : 'outofstock';
  product.backorders ||= 'no';
  product.catalogVisibility ||= 'visible';
  product.isPublished ??= true;
}

function getPath(target, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), target);
}

function setPath(target, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const parent = parts.reduce((acc, key) => {
    if (acc[key] === undefined) acc[key] = Number.isInteger(Number(key)) ? [] : {};
    return acc[key];
  }, target);
  parent[last] = value;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, message: text || 'Sunucu yanıtı okunamadı.' };
  }
  if (!response.ok || data.ok === false) {
    const error = new Error(data.message || 'İşlem tamamlanamadı.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function keepPendingContent() {
  if (!state.content) return;
  try {
    localStorage.setItem('raceplast_pending_content', JSON.stringify(state.content));
  } catch {
    // Storage may be unavailable; the current in-memory editor still keeps the data until refresh.
  }
}

function restorePendingContentIfNeeded() {
  const pending = localStorage.getItem('raceplast_pending_content');
  if (!pending) return false;
  if (!window.confirm('Önceki oturumda kaydedilemeyen değişiklikler bulundu. Geri yüklensin mi?')) {
    localStorage.removeItem('raceplast_pending_content');
    return false;
  }
  try {
    state.content = JSON.parse(pending);
    ensureContentShape();
    localStorage.removeItem('raceplast_pending_content');
    markDirty('Kaydedilemeyen değişiklikler geri yüklendi. Lütfen tekrar kaydedin.');
    return true;
  } catch {
    localStorage.removeItem('raceplast_pending_content');
    return false;
  }
}

function handleAuthError(error) {
  if (error?.status !== 401) return false;
  keepPendingContent();
  setAuthenticated(false);
  els.loginMessage.textContent = 'Oturum süresi doldu. Tekrar giriş yapın; kaydedilemeyen değişiklikler korunur.';
  showToast('Oturum yenileme gerekli. Tekrar giriş yapın.');
  return true;
}

async function loadContent() {
  try {
    const response = await fetch(`${API_BASE}admin-data.php`, { cache: 'no-store', credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      const error = new Error(data.message || 'Admin verisi yüklenemedi.');
      error.status = response.status;
      throw error;
    }
    state.content = data.content || data;
    ensureContentShape();
    setSyncStatus('Admin API verisi yüklendi');
  } catch (error) {
    if (handleAuthError(error)) return;
    const response = await fetch(`${API_BASE}content.php`, { cache: 'no-store' });
    state.content = await response.json();
    ensureContentShape();
    setSyncStatus('Public içerik verisi yüklendi');
  }
}

function setSyncStatus(message) {
  els.syncStatus.textContent = message;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 3200);
}

function markDirty(message = 'Kaydedilmemiş değişiklik var') {
  state.dirty = true;
  els.saveButton.textContent = 'Kaydet';
  els.alertBar.hidden = false;
  els.alertBar.textContent = message;
  setSyncStatus('Değişiklik bekliyor');
}

function markClean(message = 'Kaydedildi') {
  state.dirty = false;
  els.alertBar.hidden = true;
  els.saveButton.textContent = 'Kaydedildi';
  setSyncStatus(message);
  window.setTimeout(() => {
    els.saveButton.textContent = 'Kaydet';
  }, 1400);
}

function setAuthenticated(isAuthenticated) {
  state.authenticated = isAuthenticated;
  els.loginView.hidden = isAuthenticated;
  els.appView.hidden = !isAuthenticated;
}

function renderNav() {
  els.nav.innerHTML = navGroups
    .map(
      (group) => {
        const isActiveGroup = group.items.some(([id]) => id === state.view);
        const isOpen = state.openNavGroups.includes(group.id) || isActiveGroup;
        return `
        <div class="nav-group ${isOpen ? 'open' : ''}">
          <button class="nav-group-trigger" type="button" data-nav-group="${group.id}" aria-expanded="${isOpen ? 'true' : 'false'}">
            <span>${group.title}</span>
            <span class="nav-group-chevron">${isOpen ? '−' : '+'}</span>
          </button>
          <div class="nav-group-items" ${isOpen ? '' : 'hidden'}>
            ${group.items
              .map(
                ([id, label]) => `
                  <button class="nav-button ${state.view === id ? 'active' : ''}" type="button" data-view="${id}">
                    <span>${label}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </div>
      `;
      }
    )
    .join('');
}

function currentTitle() {
  return views.find(([id]) => id === state.view)?.[1] || 'Dashboard';
}

function products() {
  return state.content.products || [];
}

function restStocks() {
  return state.content.restStocks || [];
}

function published(items) {
  return items.filter((item) => item.isPublished !== false);
}

function render() {
  if (!state.content) return;
  renderNav();
  els.viewTitle.textContent = currentTitle();
  els.search.style.display = ['products', 'dashboard', 'orders', 'blog'].includes(state.view) ? '' : 'none';

  if (state.view !== 'products') {
    state.selectedProductId = null;
    els.drawer.hidden = true;
  }

  const renderers = {
    dashboard: renderDashboard,
    products: renderProducts,
    imports: renderImports,
    hero: renderHero,
    restStocks: renderRestStocks,
    gallery: renderGallery,
    sectors: renderSectors,
    blog: renderBlog,
    about: renderAbout,
    legal: renderLegal,
    orders: renderOrders,
    formSubmissions: renderFormSubmissions,
    membership: renderMembership,
    members: renderMembers,
    newsletter: renderNewsletterSubscribers,
    emails: renderEmails,
    mailSettings: renderMailSettings,
    contact: renderContact,
    forms: renderForms,
    social: renderSocial,
    payments: renderPayments,
    pages: renderPages,
    settings: renderSettings,
    media: renderMedia,
  };

  els.main.innerHTML = (renderers[state.view] || renderDashboard)();
  if (state.view === 'products') renderProductDrawer();
}

function renderDashboard() {
  const lowStock = products().filter((p) => Number(p.realStock || 0) <= 5).length;
  const activeRest = published(restStocks()).length;
  const activeProducts = published(products()).length;
  const hiddenProducts = products().length - activeProducts;
  const pendingOrders = (state.content.orders || []).filter((order) => ['pending', 'processing', 'on-hold'].includes(order.status)).length;
  const latest = products().slice(0, 5);

  return `
    <div class="kpi-grid">
      ${kpi('Yayındaki Ürün', activeProducts)}
      ${kpi('Düşük Stok', lowStock)}
      ${kpi('Rest Stok', activeRest)}
      ${kpi('Açık Sipariş', pendingOrders)}
      ${kpi('Gizli Taslak', hiddenProducts)}
    </div>
    <div class="split">
      <section class="panel">
        <div class="panel-header">
          <h2>Hızlı Ürün Kontrolü</h2>
          <button class="secondary-action" type="button" data-action="add-product">Yeni Ürün</button>
        </div>
        <div class="table-wrap">
          ${productTable(latest)}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>Kurulum Durumu</h2></div>
        <div class="panel-body stack">
          <div class="badge-row">
            <span class="badge good">PHP JSON API</span>
            <span class="badge good">Görsel Yükleme</span>
            <span class="badge good">Otomatik Yedek</span>
          </div>
          <p class="muted">Panel kayıtları <span class="mono">api/data/site-data.json</span> dosyasına yazar. Her kayıttan önce <span class="mono">api/data/backups</span> altına yedek alınır.</p>
          <button class="primary-action" type="button" data-view="products">Ürünleri Yönet</button>
        </div>
      </section>
    </div>
  `;
}

function kpi(label, value) {
  return `<div class="kpi-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderProducts() {
  const query = state.query.trim().toLowerCase();
  const filtered = products().filter((product) => {
    if (!query) return true;
    return [product.name, product.sku, product.material, product.category, product.color]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Ürün Kataloğu</h2>
          <span class="muted">${filtered.length} kayıt gösteriliyor</span>
        </div>
        <div class="row-actions">
          <button class="ghost-action" type="button" data-action="export-json">JSON İndir</button>
          <button class="secondary-action" type="button" data-action="add-product">Yeni Ürün</button>
        </div>
      </div>
      <div class="table-wrap">
        ${productTable(filtered)}
      </div>
    </section>
  `;
}

function productTable(items) {
  return `
    <table>
      <thead>
        <tr>
          <th>Görsel</th>
          <th>SKU</th>
          <th>Ürün</th>
          <th>Kategori</th>
          <th>Malzeme</th>
          <th>Kalınlık</th>
          <th>Stok</th>
          <th>Uyum</th>
          <th>Durum</th>
          <th>Aksiyon</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (product) => `
              <tr>
                <td><img class="thumb" src="${escapeHtml(imageSrc(product.image))}" alt="" /></td>
                <td class="mono">${escapeHtml(product.sku)}</td>
                <td><strong>${escapeHtml(product.name)}</strong><br /><span class="muted">${escapeHtml(product.color || product.grade || '')}</span></td>
                <td>${escapeHtml(product.category || '')}</td>
                <td>${escapeHtml(product.material || '')}</td>
                <td class="mono">${escapeHtml(product.thicknessStr || (product.thickness ? `${product.thickness} mm` : ''))}</td>
                <td><strong>${Number(product.realStock || 0)}</strong> ${escapeHtml(product.stockUnit || '')}</td>
                <td><div class="badge-row">${(product.foodCompliance || ['None'])
                  .map((item) => `<span class="badge ${item === 'None' ? '' : 'good'}">${escapeHtml(item)}</span>`)
                  .join('')}</div></td>
                <td><span class="badge ${product.isPublished === false ? 'warn' : 'good'}">${product.isPublished === false ? 'Gizli' : 'Yayında'}</span></td>
                <td>
                  <div class="row-actions">
                    <button class="mini-button" type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}">Düzenle</button>
                    <button class="mini-button" type="button" data-action="duplicate-product" data-id="${escapeHtml(product.id)}">Kopyala</button>
                    <button class="mini-button danger" type="button" data-action="delete-product" data-id="${escapeHtml(product.id)}">Sil</button>
                  </div>
                </td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function emptyProduct() {
  return {
    id: uid('product'),
    sku: '#RP-NEW',
    name: 'Yeni Teknik Plastik Ürünü',
    nameEn: '',
    image: DEFAULT_PRODUCT_IMAGE,
    gallery: [DEFAULT_PRODUCT_IMAGE],
    category: 'Plaka / Levha',
    categoryEn: '',
    material: 'POM-C (Polyacetal)',
    materialEn: '',
    materialType: 'POM-C (Polyacetal)',
    dimensions: '',
    thickness: undefined,
    thicknessStr: '',
    diameter: '',
    length: '',
    width: '',
    weight: '',
    specificGravity: '',
    calculatedWeight: '',
    foodCompliance: ['None'],
    realStock: 0,
    stockUnit: 'Adet',
    isLimitedStock: false,
    tempRange: '',
    hardness: '',
    color: '',
    grade: '',
    minOrderQty: 1,
    maxOrderQty: undefined,
    regularPrice: 0,
    salePrice: 0,
    currency: state.content?.paymentSettings?.currency || 'EUR',
    taxStatus: 'taxable',
    taxClass: '',
    manageStock: true,
    stockStatus: 'instock',
    backorders: 'no',
    soldIndividually: false,
    virtual: false,
    downloadable: false,
    shippingClass: '',
    purchaseNote: '',
    priceNote: '',
    description: '',
    descriptionEn: '',
    technicalProperties: [],
    technicalPropertiesEn: [],
    attributes: [],
    variations: [],
    tags: [],
    featured: false,
    catalogVisibility: 'visible',
    sortOrder: products().length + 1,
    isPublished: false,
    seoTitle: '',
    seoDescription: '',
    seoTitleEn: '',
    seoDescriptionEn: '',
  };
}

function selectedProduct() {
  return products().find((product) => product.id === state.selectedProductId) || null;
}

function renderProductDrawer() {
  const product = selectedProduct();
  if (!product) {
    els.drawer.hidden = true;
    return;
  }

  els.drawer.hidden = false;
  const tabs = [
    ['general', 'Genel'],
    ['translations', 'TR / EN'],
    ['technical', 'Teknik'],
    ['stock', 'Stok'],
    ['commerce', 'Ticaret'],
    ['media', 'Görsel'],
    ['attributes', 'Ölçüler'],
    ['seo', 'SEO'],
  ];

  els.drawer.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-title-row">
        <div>
          <span class="eyebrow">${escapeHtml(product.sku || 'ÜRÜN')}</span>
          <h2>${escapeHtml(product.name || 'Yeni Ürün')}</h2>
        </div>
        <button class="icon-action" type="button" data-action="close-drawer">Kapat</button>
      </div>
      <div class="drawer-tabs">
        ${tabs
          .map(
            ([id, label]) => `<button type="button" data-tab="${id}" class="${state.productTab === id ? 'active' : ''}">${label}</button>`
          )
          .join('')}
      </div>
    </div>
    <div class="drawer-body">
      ${renderProductTab(product)}
    </div>
    <div class="drawer-footer">
      <button class="danger-action" type="button" data-action="delete-product" data-id="${escapeHtml(product.id)}">Ürünü Sil</button>
      <button class="primary-action" type="button" data-action="save-now">Kaydet ve Yayına Hazırla</button>
    </div>
  `;
}

function field(label, fieldName, product, options = {}) {
  const { kind = 'text', wide = false, type = 'text', placeholder = '' } = options;
  const value = product[fieldName] ?? '';
  return `
    <label class="${wide ? 'wide' : ''}">
      ${label}
      <input type="${type}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" data-product-field="${fieldName}" data-kind="${kind}" />
    </label>
  `;
}

function renderProductTab(product) {
  if (state.productTab === 'translations') {
    return `
      <div class="form-grid">
        ${field('TR Ürün Adı', 'name', product, { wide: true })}
        ${field('EN Product Name', 'nameEn', product, { wide: true })}
        ${field('TR Kategori', 'category', product)}
        ${field('EN Category', 'categoryEn', product)}
        ${field('TR Malzeme', 'material', product)}
        ${field('EN Material', 'materialEn', product)}
        <label class="wide">
          TR Kısa Açıklama
          <textarea data-product-field="description">${escapeHtml(product.description || '')}</textarea>
        </label>
        <label class="wide">
          EN Short Description
          <textarea data-product-field="descriptionEn">${escapeHtml(product.descriptionEn || '')}</textarea>
        </label>
      </div>
    `;
  }

  if (state.productTab === 'technical') {
    return `
      <div class="form-grid">
        ${field('Malzeme cinsi', 'materialType', product, { placeholder: 'POM-C Natural' })}
        ${field('Boyutlar', 'dimensions', product, { placeholder: '1000x2000 mm' })}
        ${field('Kalınlık Sayısal', 'thickness', product, { type: 'number', kind: 'number', placeholder: '20' })}
        ${field('Kalınlık Metni', 'thicknessStr', product, { placeholder: '20.0 mm' })}
        ${field('Çap', 'diameter', product, { placeholder: 'Ø 80 mm' })}
        ${field('Boy', 'length', product, { placeholder: '3000 mm' })}
        ${field('En', 'width', product, { placeholder: '1000 mm' })}
        ${field('Öz ağırlık', 'specificGravity', product, { placeholder: '1.41 g/cm3' })}
        ${field('Ağırlık', 'weight', product, { placeholder: '18.42 kg/ad' })}
        ${field('Hesaplanan Ağırlık', 'calculatedWeight', product, { placeholder: '18.42 kg' })}
        ${field('Sıcaklık Aralığı', 'tempRange', product, { placeholder: '-200°C / +260°C' })}
        ${field('Sertlik', 'hardness', product, { placeholder: '62 Shore D' })}
        ${field('Renk / Varyant', 'color', product)}
        ${field('Grade / Sınıf', 'grade', product)}
        <label class="wide">
          Teknik Özellikler (her satır ayrı gösterilir)
          <textarea data-product-field="technicalProperties" data-kind="lines">${escapeHtml((product.technicalProperties || []).join('\n'))}</textarea>
        </label>
        <label class="wide">
          Technical Properties EN (one per line)
          <textarea data-product-field="technicalPropertiesEn" data-kind="lines">${escapeHtml((product.technicalPropertiesEn || []).join('\n'))}</textarea>
        </label>
      </div>
    `;
  }

  if (state.productTab === 'stock') {
    const compliance = product.foodCompliance || ['None'];
    return `
      <div class="stack">
        <div class="form-grid three">
          ${field('Gerçek Stok', 'realStock', product, { type: 'number', kind: 'int' })}
          ${field('Stok Birimi', 'stockUnit', product)}
          ${field('Minimum Sipariş', 'minOrderQty', product, { type: 'number', kind: 'int' })}
          ${field('Maksimum Sipariş', 'maxOrderQty', product, { type: 'number', kind: 'int' })}
          ${field('Sıralama', 'sortOrder', product, { type: 'number', kind: 'int' })}
          ${field('Fiyat / Not', 'priceNote', product, { wide: true, placeholder: 'Fiyat için teklif alın' })}
        </div>
        <div class="check-row">
          <label class="check-pill"><input type="checkbox" data-product-bool="isLimitedStock" ${product.isLimitedStock ? 'checked' : ''} /> Sınırlı stok</label>
          <label class="check-pill"><input type="checkbox" data-product-bool="isPublished" ${product.isPublished !== false ? 'checked' : ''} /> Yayında</label>
          <label class="check-pill"><input type="checkbox" data-product-bool="manageStock" ${product.manageStock !== false ? 'checked' : ''} /> Stok yönetimi</label>
        </div>
        <div class="form-grid three">
          <label>
            Stok Durumu
            <select data-product-field="stockStatus">
              ${option('instock', 'Stokta', product.stockStatus || 'instock')}
              ${option('outofstock', 'Stok Yok', product.stockStatus || 'instock')}
              ${option('onbackorder', 'Ön Sipariş', product.stockStatus || 'instock')}
            </select>
          </label>
          <label>
            Backorder
            <select data-product-field="backorders">
              ${option('no', 'Kapalı', product.backorders || 'no')}
              ${option('notify', 'Bilgilendirerek izin ver', product.backorders || 'no')}
              ${option('yes', 'İzin ver', product.backorders || 'no')}
            </select>
          </label>
          <label>
            Katalog Görünürlüğü
            <select data-product-field="catalogVisibility">
              ${option('visible', 'Katalog ve arama', product.catalogVisibility || 'visible')}
              ${option('catalog', 'Sadece katalog', product.catalogVisibility || 'visible')}
              ${option('search', 'Sadece arama', product.catalogVisibility || 'visible')}
              ${option('hidden', 'Gizli', product.catalogVisibility || 'visible')}
            </select>
          </label>
        </div>
        <label>
          Gıda Uyumluluğu
          <span class="check-row">
            ${['FDA', 'EU', 'None']
              .map((item) => `<label class="check-pill"><input type="checkbox" data-food="${item}" ${compliance.includes(item) ? 'checked' : ''} /> ${item}</label>`)
              .join('')}
          </span>
        </label>
      </div>
    `;
  }

  if (state.productTab === 'commerce') {
    return `
      <div class="form-grid three">
        ${field('Normal Fiyat', 'regularPrice', product, { type: 'number', kind: 'number' })}
        ${field('İndirimli Fiyat', 'salePrice', product, { type: 'number', kind: 'number' })}
        ${field('Para Birimi', 'currency', product)}
        <label>
          Vergi Durumu
          <select data-product-field="taxStatus">
            ${option('taxable', 'Vergilendirilebilir', product.taxStatus || 'taxable')}
            ${option('shipping', 'Sadece kargo', product.taxStatus || 'taxable')}
            ${option('none', 'Vergisiz', product.taxStatus || 'taxable')}
          </select>
        </label>
        ${field('Vergi Sınıfı', 'taxClass', product)}
        ${field('Kargo Sınıfı', 'shippingClass', product)}
        <label class="wide">
          Satın Alma Notu
          <textarea data-product-field="purchaseNote">${escapeHtml(product.purchaseNote || '')}</textarea>
        </label>
        <div class="check-row wide">
          <label class="check-pill"><input type="checkbox" data-product-bool="soldIndividually" ${product.soldIndividually ? 'checked' : ''} /> Tekil satılsın</label>
          <label class="check-pill"><input type="checkbox" data-product-bool="virtual" ${product.virtual ? 'checked' : ''} /> Sanal ürün</label>
          <label class="check-pill"><input type="checkbox" data-product-bool="downloadable" ${product.downloadable ? 'checked' : ''} /> İndirilebilir</label>
          <label class="check-pill"><input type="checkbox" data-product-bool="featured" ${product.featured ? 'checked' : ''} /> Öne çıkan</label>
        </div>
      </div>
    `;
  }

  if (state.productTab === 'media') {
    return `
      <div class="stack">
        ${product.image ? `<img class="preview-image" src="${escapeHtml(imageSrc(product.image))}" alt="" />` : '<div class="preview-image"></div>'}
        ${field('Görsel URL', 'image', product, { wide: true, placeholder: 'https:// veya uploads/products/...' })}
        <label class="wide">
          Galeri URL'leri (her satır ayrı görsel)
          <textarea data-product-field="gallery" data-kind="lines">${escapeHtml((product.gallery || []).join('\n'))}</textarea>
        </label>
        <div class="file-row">
          <strong>Ürün Görseli Yükle</strong>
          <input type="file" accept="image/*" data-upload-product-image />
          <span class="muted">JPG, PNG, WEBP veya GIF. Yükleme sonrası URL otomatik forma yazılır.</span>
        </div>
        <div class="file-row">
          <strong>Galeriye Görsel Ekle</strong>
          <input type="file" accept="image/*" data-upload-gallery-image />
          <span class="muted">Aynı görsel birden fazla üründe kullanılabilir; sadece URL ürün kaydına bağlanır.</span>
        </div>
        <div class="gallery-grid">
          ${(product.gallery || [])
            .map((url) => `<img src="${escapeHtml(imageSrc(url))}" alt="" />`)
            .join('')}
        </div>
      </div>
    `;
  }

  if (state.productTab === 'attributes') {
    const attributesText = (product.attributes || [])
      .map((attribute) => `${attribute.name}: ${(attribute.values || []).join(', ')}`)
      .join('\n');
    const variationsText = (product.variations || [])
      .map((variation) => {
        const attributeText = Object.entries(variation.attributes || {})
          .map(([key, value]) => (key === 'Ölçü' ? value : `${key}: ${value}`))
          .join(' / ');
        return [attributeText, variation.sku || '', variation.stock ?? ''].join(' | ');
      })
      .join('\n');
    return `
      <div class="stack">
        <label>
          Ürün Özellikleri (Örnek: Malzeme: POM-C, PA6)
          <textarea data-product-field="attributes" data-kind="attributes">${escapeHtml(attributesText)}</textarea>
        </label>
        <label>
          Ölçü Seçenekleri (Ölçü | SKU | Stok)
          <textarea data-product-field="variations" data-kind="variations-lines" placeholder="1000x2000 mm / 20 mm | #RP-10442-20 | 24">${escapeHtml(variationsText)}</textarea>
        </label>
        <p class="muted">Her satır ürün sayfasındaki ölçü seçim listesine eklenir. Basit ürünlerde bu alanı boş bırakabilirsiniz.</p>
      </div>
    `;
  }

  if (state.productTab === 'seo') {
    return `
      <div class="form-grid">
        ${field('Slug', 'slug', product, { wide: true, placeholder: 'pom-c-natural' })}
        ${field('SEO Başlığı', 'seoTitle', product, { wide: true })}
        <label class="wide">
          SEO Açıklaması
          <textarea data-product-field="seoDescription">${escapeHtml(product.seoDescription || '')}</textarea>
        </label>
        ${field('SEO Başlığı EN', 'seoTitleEn', product, { wide: true })}
        <label class="wide">
          SEO Açıklaması EN
          <textarea data-product-field="seoDescriptionEn">${escapeHtml(product.seoDescriptionEn || '')}</textarea>
        </label>
        <label class="wide">
          Etiketler (virgülle ayırın)
          <input value="${escapeHtml((product.tags || []).join(', '))}" data-product-field="tags" data-kind="tags" />
        </label>
      </div>
    `;
  }

  return `
    <div class="form-grid">
      ${field('Ürün ID', 'id', product)}
      ${field('SKU', 'sku', product)}
      ${field('Ürün Adı', 'name', product, { wide: true })}
      ${field('Kategori', 'category', product)}
      ${field('Malzeme', 'material', product)}
      <label class="wide">
        Kısa Açıklama
        <textarea data-product-field="description">${escapeHtml(product.description || '')}</textarea>
      </label>
    </div>
  `;
}

function option(value, label, selectedValue) {
  return `<option value="${escapeHtml(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function renderRestStocks() {
  return collectionPanel('Rest Stokları', 'restStocks', restStocks(), restStockTemplate);
}

function restStockTemplate(item, index) {
  return `
    <div class="form-grid three">
      ${collectionField('SKU', 'restStocks', index, 'sku', item.sku)}
      ${collectionField('Malzeme', 'restStocks', index, 'material', item.material)}
      ${collectionField('Boyut', 'restStocks', index, 'dimensions', item.dimensions)}
      ${collectionField('Kalınlık', 'restStocks', index, 'thickness', item.thickness)}
      ${collectionField('Adet', 'restStocks', index, 'qty', item.qty, 'int', 'number')}
      ${collectionField('Fiyat', 'restStocks', index, 'price', item.price, 'number', 'number')}
      ${collectionField('Not', 'restStocks', index, 'note', item.note || '', 'text', 'text', true)}
      <label class="check-pill"><input type="checkbox" data-collection="restStocks" data-index="${index}" data-field="isPublished" data-kind="checkbox" ${item.isPublished !== false ? 'checked' : ''} /> Yayında</label>
    </div>
  `;
}

function renderImports() {
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Google Sheet / Excel Ürün Aktarımı</h2>
            <span class="muted">SKU eşleşirse günceller, yeni SKU gelirse ürün ekler.</span>
          </div>
        </div>
        <div class="panel-body stack">
          <div class="form-grid">
            ${pathField('Google Sheet CSV URL', 'importSettings.googleSheetCsvUrl', 'input', true)}
            ${pathField('SKU Kolonu', 'importSettings.skuColumn')}
            ${pathField('Stok Kolonu', 'importSettings.stockColumn')}
            <label>
              Aktarım Modu
              <select data-path="importSettings.syncMode">
                ${option('upsert-products', 'Ürün ekle / güncelle', state.content.importSettings.syncMode)}
                ${option('stock-only', 'Sadece stok güncelle', state.content.importSettings.syncMode)}
              </select>
            </label>
          </div>
          <div class="file-row">
            <strong>Excel / CSV Dosyası</strong>
            <input id="sheetFile" type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            <button class="secondary-action" type="button" data-action="load-excel">Dosyayı Önizle</button>
            <button class="ghost-action" type="button" data-action="load-google-sheet">Google Sheet Önizle</button>
          </div>
          <div class="row-actions">
            <a class="ghost-action" href="../templates/raceplast-product-import-template.csv" download>Örnek CSV İndir</a>
            <a class="ghost-action" href="../templates/raceplast-product-import-template.xlsx" download>Örnek Excel İndir</a>
            <button class="primary-action" type="button" data-action="apply-import" ${state.importPreview.length ? '' : 'disabled'}>Önizlemeyi Ürünlere Uygula</button>
          </div>
          <p class="muted">Google Sheet için dosyayı “Web'de yayınla” veya CSV çıktısı linki olarak paylaşın. Canlı stok güncellemesi admin panelden tek tıkla yapılır.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>Aktarım Önizleme</h2></div>
        <div class="table-wrap">${renderImportPreview()}</div>
      </section>
    </div>
  `;
}

function renderImportPreview() {
  if (!state.importPreview.length) {
    return '<div class="empty-state">Henüz import önizlemesi yok.</div>';
  }
  return `
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Ürün</th>
          <th>Kategori</th>
          <th>Malzeme</th>
          <th>Boy</th>
          <th>En</th>
          <th>Kalınlık</th>
          <th>Stok</th>
          <th>Öz ağırlık</th>
          <th>Fiyat</th>
          <th>Görsel</th>
        </tr>
      </thead>
      <tbody>
        ${state.importPreview
          .slice(0, 50)
          .map(
            (product) => `
              <tr>
                <td class="mono">${escapeHtml(product.sku || '')}</td>
                <td><strong>${escapeHtml(product.name || '')}</strong><br><span class="muted">${escapeHtml(product.nameEn || '')}</span></td>
                <td>${escapeHtml(product.category || '')}</td>
                <td>${escapeHtml(product.materialType || product.material || '')}</td>
                <td>${escapeHtml(product.length || '')}</td>
                <td>${escapeHtml(product.width || '')}</td>
                <td>${escapeHtml(product.thicknessStr || (product.thickness ? `${product.thickness} mm` : ''))}</td>
                <td>${Number(product.realStock || 0)} ${escapeHtml(product.stockUnit || 'Adet')}</td>
                <td>${escapeHtml(product.specificGravity || '')}</td>
                <td>${escapeHtml(product.currency || '')} ${Number(product.regularPrice || 0)}</td>
                <td>${product.image ? '<span class="badge good">Var</span>' : '<span class="badge warn">Yok</span>'}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function renderHero() {
  return collectionPanel('Hero Slider', 'heroSlides', state.content.heroSlides || [], heroTemplate);
}

function heroTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'heroSlides', index, 'id', item.id)}
      ${collectionField('Sıralama', 'heroSlides', index, 'sortOrder', item.sortOrder || index + 1, 'int', 'number')}
      ${collectionField('Rozet', 'heroSlides', index, 'badge', item.badge)}
      ${collectionField('Başlık', 'heroSlides', index, 'title', item.title, 'text', 'text', true)}
      ${collectionTextarea('Açıklama', 'heroSlides', index, 'description', item.description)}
      ${collectionField('Görsel URL', 'heroSlides', index, 'image', item.image, 'text', 'text', true)}
      ${collectionField('Slider Süresi (ms)', 'heroSlides', index, 'durationMs', item.durationMs || 6000, 'int', 'number')}
      ${pathField('EN Rozet', `heroSlides.${index}.translations.en.badge`)}
      ${pathField('EN Başlık', `heroSlides.${index}.translations.en.title`, 'input', true)}
      ${pathField('EN Açıklama', `heroSlides.${index}.translations.en.description`, 'textarea', true)}
      <label class="check-pill"><input type="checkbox" data-collection="heroSlides" data-index="${index}" data-field="autoplayEnabled" data-kind="checkbox" ${item.autoplayEnabled !== false ? 'checked' : ''} /> Autoplay açık</label>
      <label class="check-pill"><input type="checkbox" data-collection="heroSlides" data-index="${index}" data-field="isPublished" data-kind="checkbox" ${item.isPublished !== false ? 'checked' : ''} /> Yayında</label>
    </div>
  `;
}

function renderGallery() {
  const images = allMediaItems();
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>Galeri / Medya Havuzu</h2></div>
        <div class="panel-body stack">
          <div class="file-row">
            <strong>Yeni Görsel Yükle</strong>
            <input id="mediaUploader" type="file" accept="image/*" />
            <button class="primary-action" type="button" data-action="upload-media">Yükle</button>
            <input id="lastUploadUrl" readonly placeholder="Yüklenen görsel URL'si burada görünür" />
          </div>
          <p class="muted">Yüklenen URL'yi birden fazla üründe ana görsel veya galeri görseli olarak kullanabilirsiniz.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>Galerideki Görseller</h2><span class="muted">${images.length} benzersiz URL</span></div>
        <div class="gallery-grid large">
          ${images.length
            ? images.map((item) => `
                <figure>
                  <img src="${escapeHtml(imageSrc(item.url))}" alt="" />
                  <figcaption>
                    <strong>${escapeHtml(item.name || 'Görsel')}</strong>
                    <input class="media-url-input" readonly value="${escapeHtml(item.url)}" />
                    <span class="gallery-actions">
                      <button class="mini-button" type="button" data-action="copy-media-url" data-url="${escapeHtml(item.url)}">Linki Al</button>
                      <button class="mini-button danger" type="button" data-action="delete-media" data-url="${escapeHtml(item.url)}">Sil</button>
                    </span>
                  </figcaption>
                </figure>
              `).join('')
            : '<div class="empty-state">Henüz galeri görseli yok.</div>'}
        </div>
      </section>
    </div>
  `;
}

function allMediaItems() {
  const itemsByUrl = new Map();
  (state.content.mediaLibrary || []).forEach((item) => {
    if (item?.url) itemsByUrl.set(item.url, item);
  });
  allImageUrls().forEach((url) => {
    if (!itemsByUrl.has(url)) {
      itemsByUrl.set(url, {
        id: `linked-${itemsByUrl.size + 1}`,
        url,
        name: 'İçerikte kullanılan görsel',
      });
    }
  });
  return Array.from(itemsByUrl.values());
}

function allImageUrls() {
  const urls = new Set();
  products().forEach((product) => {
    if (product.image) urls.add(product.image);
    (product.gallery || []).forEach((url) => urls.add(url));
  });
  (state.content.heroSlides || []).forEach((slide) => slide.image && urls.add(slide.image));
  (state.content.blogPosts || []).forEach((post) => post.image && urls.add(post.image));
  if (state.content.aboutPage?.image) urls.add(state.content.aboutPage.image);
  return Array.from(urls);
}

function getSelectedCollectionIndex(collectionKey, selectedId) {
  const items = getPath(state.content, collectionKey) || [];
  if (!items.length) return -1;
  const index = selectedId ? items.findIndex((item) => item.id === selectedId) : -1;
  return index >= 0 ? index : 0;
}

function compactRecordTitle(item) {
  return item.title || item.companyName || item.email || item.orderNumber || item.name || item.slug || item.id || 'Kayıt';
}

function compactRecordStatus(item) {
  if (item.status) return item.status;
  return item.isPublished === false ? 'Gizli' : 'Yayında';
}

function renderCompactCollectionEditor({
  title,
  collectionKey,
  items,
  selectedId,
  emptyText,
  addLabel,
  renderEditor,
  summary,
  itemTitle = compactRecordTitle,
  itemStatus = compactRecordStatus,
}) {
  const selectedIndex = getSelectedCollectionIndex(collectionKey, selectedId);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;
  return `
    <section class="panel compact-editor">
      <div class="panel-header">
        <div>
          <h2>${title}</h2>
          <span class="muted">${items.length} kayıt</span>
        </div>
        <button class="secondary-action" type="button" data-action="add-collection" data-collection-type="${collectionKey}">${addLabel}</button>
      </div>
      <div class="compact-editor-grid">
        <aside class="record-list">
          ${items.length
            ? items
                .map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return `
                    <button
                      class="record-list-item ${isSelected ? 'active' : ''}"
                      type="button"
                      data-action="select-collection-item"
                      data-collection-type="${collectionKey}"
                      data-id="${escapeHtml(item.id || '')}"
                    >
                      <strong>${escapeHtml(itemTitle(item))}</strong>
                      <span>${escapeHtml(summary(item))}</span>
                      <small>${escapeHtml(itemStatus(item))}</small>
                    </button>
                  `;
                })
                .join('')
            : `<div class="empty-state">${emptyText}</div>`}
        </aside>

        <section class="record-editor">
          ${selectedItem
            ? `
              <div class="record-editor-header">
                <div>
                  <span class="eyebrow">Seçili Kayıt</span>
                  <h3>${escapeHtml(itemTitle(selectedItem))}</h3>
                </div>
                <button class="mini-button danger" type="button" data-action="delete-collection" data-collection-type="${collectionKey}" data-index="${selectedIndex}">Sil</button>
              </div>
              <div class="record-editor-body">
                ${renderEditor(selectedItem, selectedIndex)}
              </div>
            `
            : '<div class="empty-state">Düzenlemek için soldan bir kayıt seçin.</div>'}
        </section>
      </div>
    </section>
  `;
}

function renderBlog() {
  const posts = state.content.blogPosts || [];
  const query = (state.query || '').toLocaleLowerCase('tr-TR');
  const categories = Array.from(new Set(posts.map((post) => post.category).filter(Boolean)));
  const filtered = posts.filter((post) => {
    const matchesStatus =
      state.blogStatusFilter === 'all' ||
      (state.blogStatusFilter === 'published' && post.isPublished !== false) ||
      (state.blogStatusFilter === 'draft' && post.isPublished === false);
    const matchesCategory = state.blogCategoryFilter === 'all' || post.category === state.blogCategoryFilter;
    const haystack = `${post.title || ''} ${post.slug || ''} ${post.category || ''} ${post.author || ''}`.toLocaleLowerCase('tr-TR');
    return matchesStatus && matchesCategory && (!query || haystack.includes(query));
  });
  const selectedIndex = getSelectedCollectionIndex('blogPosts', state.selectedBlogPostId);
  const selectedPost = selectedIndex >= 0 ? posts[selectedIndex] : null;
  const publishedCount = posts.filter((post) => post.isPublished !== false).length;
  const draftCount = posts.length - publishedCount;

  return `
    <section class="panel wp-posts-panel">
      <div class="wp-titlebar">
        <div>
          <h2>Yazılar</h2>
          <p class="muted">WordPress mantığında yazı listesi, filtre, arama ve seçili yazı düzenleme alanı.</p>
        </div>
        <button class="mini-button primary" type="button" data-action="add-collection" data-collection-type="blogPosts">Yeni Ekle</button>
      </div>

      <div class="wp-status-links">
        ${blogStatusButton('all', `Tümü (${posts.length})`)}
        ${blogStatusButton('published', `Yayında (${publishedCount})`)}
        ${blogStatusButton('draft', `Taslak (${draftCount})`)}
      </div>

      <div class="wp-toolbar">
        <select id="blogBulkAction">
          <option value="">Toplu işlemler</option>
          <option value="publish">Yayına al</option>
          <option value="draft">Taslak yap</option>
          <option value="delete">Sil</option>
        </select>
        <button class="mini-button" type="button" data-action="blog-bulk-apply">Uygula</button>
        <select data-blog-category-filter>
          <option value="all">Tüm kategoriler</option>
          ${categories.map((category) => option(category, category, state.blogCategoryFilter)).join('')}
        </select>
        <button class="mini-button" type="button" data-action="blog-reset-filters">Filtreyi temizle</button>
        <div class="wp-search">
          <input data-blog-search value="${escapeHtml(state.query || '')}" placeholder="Yazılarda ara..." />
          <button class="mini-button" type="button" data-action="blog-search">Yazılarda Ara</button>
        </div>
      </div>

      <div class="wp-table-wrap">
        <table class="wp-posts-table">
          <thead>
            <tr>
              <th class="check-col"><input type="checkbox" data-blog-select-all ${filtered.length && filtered.every((post) => state.blogSelectedIds.includes(post.id)) ? 'checked' : ''} /></th>
              <th>Başlık</th>
              <th>Yazar</th>
              <th>Kategori</th>
              <th>Etiketler</th>
              <th>Durum</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            ${filtered
              .map((post) => {
                const index = posts.findIndex((item) => item.id === post.id);
                return `
                  <tr class="${state.selectedBlogPostId === post.id ? 'selected' : ''}">
                    <td class="check-col"><input type="checkbox" data-blog-select="${escapeHtml(post.id)}" ${state.blogSelectedIds.includes(post.id) ? 'checked' : ''} /></td>
                    <td>
                      <button class="wp-title-link" type="button" data-action="select-collection-item" data-collection-type="blogPosts" data-id="${escapeHtml(post.id)}">${escapeHtml(post.title || 'Başlıksız')}</button>
                      <div class="wp-row-actions">
                        <button type="button" data-action="select-collection-item" data-collection-type="blogPosts" data-id="${escapeHtml(post.id)}">Düzenle</button>
                        <span>|</span>
                        <button type="button" data-action="delete-collection" data-collection-type="blogPosts" data-index="${index}">Sil</button>
                      </div>
                    </td>
                    <td>${escapeHtml(post.author || 'admin')}</td>
                    <td><span class="wp-pill">${escapeHtml(post.category || 'Uncategorized')}</span></td>
                    <td>${escapeHtml(post.keywords || '—')}</td>
                    <td>${post.isPublished === false ? 'Taslak' : 'Yayında'}</td>
                    <td>${escapeHtml(post.publishedAt || '—')}</td>
                  </tr>
                `;
              })
              .join('')}
            ${filtered.length ? '' : '<tr><td colspan="7" class="empty-cell">Bu filtreyle eşleşen yazı yok.</td></tr>'}
          </tbody>
        </table>
      </div>

      <section class="wp-editor-panel">
        <div class="record-editor-header">
          <span>Seçili Yazı</span>
          <strong>${selectedPost ? escapeHtml(selectedPost.title || 'Başlıksız') : 'Düzenlemek için tablodan yazı seçin'}</strong>
        </div>
        ${
          selectedPost
            ? `<div class="record-editor-body">${blogTemplate(selectedPost, selectedIndex)}</div>`
            : '<div class="empty-state">Tablodaki başlığa tıklayın; düzenleme alanı burada açılır.</div>'
        }
      </section>
    </section>
  `;
}

function blogStatusButton(status, label) {
  return `<button type="button" data-action="blog-status-filter" data-status="${status}" class="${state.blogStatusFilter === status ? 'active' : ''}">${label}</button>`;
}

function blogTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'blogPosts', index, 'id', item.id)}
      ${collectionField('Slug', 'blogPosts', index, 'slug', item.slug)}
      ${collectionField('Başlık TR', 'blogPosts', index, 'title', item.title, 'text', 'text', true)}
      ${collectionField('Başlık EN', 'blogPosts', index, 'titleEn', item.titleEn || '', 'text', 'text', true)}
      ${collectionField('Kategori', 'blogPosts', index, 'category', item.category)}
      ${collectionField('Yazar', 'blogPosts', index, 'author', item.author)}
      ${collectionField('Tarih', 'blogPosts', index, 'publishedAt', item.publishedAt, 'text', 'date')}
      ${collectionField('Okuma Süresi', 'blogPosts', index, 'readingTime', item.readingTime || '')}
      ${collectionField('Görsel URL', 'blogPosts', index, 'image', item.image, 'text', 'text', true)}
      ${collectionField('Görsel Alt Metni', 'blogPosts', index, 'imageAlt', item.imageAlt || '', 'text', 'text', true)}
      ${collectionTextarea('Anahtar Kelimeler', 'blogPosts', index, 'keywords', item.keywords || '')}
      ${collectionTextarea('Özet TR', 'blogPosts', index, 'excerpt', item.excerpt)}
      ${collectionTextarea('Özet EN', 'blogPosts', index, 'excerptEn', item.excerptEn || '')}
      ${collectionTextarea('İçerik TR', 'blogPosts', index, 'content', item.content)}
      ${collectionTextarea('HTML İçerik TR', 'blogPosts', index, 'contentHtml', item.contentHtml || '')}
      ${collectionTextarea('İçerik EN', 'blogPosts', index, 'contentEn', item.contentEn || '')}
      ${collectionField('SEO Başlık', 'blogPosts', index, 'seoTitle', item.seoTitle || '', 'text', 'text', true)}
      ${collectionTextarea('SEO Açıklama', 'blogPosts', index, 'seoDescription', item.seoDescription || '')}
      <label class="check-pill"><input type="checkbox" data-collection="blogPosts" data-index="${index}" data-field="isPublished" data-kind="checkbox" ${item.isPublished !== false ? 'checked' : ''} /> Yayında</label>
    </div>
  `;
}

function renderAbout() {
  return `
    <section class="panel">
      <div class="panel-header"><h2>Hakkımızda Sayfası</h2></div>
      <div class="panel-body stack">
        ${sectionFields('Sayfa İçeriği', [
          ['Başlık TR', 'aboutPage.title'],
          ['Başlık EN', 'aboutPage.titleEn'],
          ['Alt Başlık TR', 'aboutPage.subtitle', 'textarea'],
          ['Alt Başlık EN', 'aboutPage.subtitleEn', 'textarea'],
          ['İçerik TR', 'aboutPage.content', 'textarea'],
          ['İçerik EN', 'aboutPage.contentEn', 'textarea'],
          ['Görsel URL', 'aboutPage.image'],
          ['Kaynak URL', 'aboutPage.sourceUrl'],
        ])}
        ${collectionPanel('Öne Çıkan Bilgiler', 'aboutPage.highlights', state.content.aboutPage.highlights || [], aboutHighlightTemplate)}
      </div>
    </section>
  `;
}

function aboutHighlightTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'aboutPage.highlights', index, 'id', item.id)}
      ${collectionField('Başlık', 'aboutPage.highlights', index, 'title', item.title)}
      ${collectionTextarea('Açıklama', 'aboutPage.highlights', index, 'description', item.description)}
    </div>
  `;
}

function renderLegal() {
  return renderCompactCollectionEditor({
    title: 'Bilgi Sayfaları',
    collectionKey: 'legalPages',
    items: state.content.legalPages || [],
    selectedId: state.selectedLegalPageId,
    emptyText: 'Henüz bilgi sayfası yok.',
    addLabel: 'Yeni Bilgi Sayfası',
    renderEditor: legalTemplate,
    summary: (item) => `Sıra ${item.sortOrder || '-'} · ${item.slug || 'slug yok'}`,
  });
}

function legalTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'legalPages', index, 'id', item.id)}
      ${collectionField('Slug', 'legalPages', index, 'slug', item.slug || '')}
      ${collectionField('Sıralama', 'legalPages', index, 'sortOrder', item.sortOrder || index + 1, 'int', 'number')}
      ${collectionField('Başlık TR', 'legalPages', index, 'title', item.title, 'text', 'text', true)}
      ${collectionField('Başlık EN', 'legalPages', index, 'titleEn', item.titleEn || '', 'text', 'text', true)}
      ${collectionTextarea('İçerik TR', 'legalPages', index, 'content', item.content || '')}
      ${collectionTextarea('İçerik EN', 'legalPages', index, 'contentEn', item.contentEn || '')}
      <label class="check-pill"><input type="checkbox" data-collection="legalPages" data-index="${index}" data-field="isPublished" data-kind="checkbox" ${item.isPublished !== false ? 'checked' : ''} /> Yayında</label>
    </div>
  `;
}

function renderOrders() {
  return renderCompactCollectionEditor({
    title: 'Sipariş Takibi',
    collectionKey: 'orders',
    items: state.content.orders || [],
    selectedId: state.selectedOrderId,
    emptyText: 'Henüz sipariş kaydı yok.',
    addLabel: 'Yeni Sipariş',
    renderEditor: orderTemplate,
    itemTitle: (item) => item.orderNumber || item.id || 'Sipariş',
    itemStatus: (item) => orderStatusLabel(item.status || 'pending'),
    summary: (item) => `${item.customerName || 'Müşteri yok'} · ${item.createdAt?.slice(0, 10) || 'tarih yok'} · ${item.grandTotal || 0} ${item.currency || ''}`,
  });
}

function orderStatusLabel(status) {
  const labels = {
    pending: 'Beklemede',
    processing: 'İşlemde',
    'on-hold': 'Askıda',
    shipped: 'Kargoya Verildi',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    refunded: 'İade',
    failed: 'Başarısız',
  };
  return labels[status] || status || 'Beklemede';
}

function orderTemplate(item, index) {
  const receiptHtml = item.receiptUrl
    ? `<div class="wide"><label>Dekont<br/><a href="../${escapeHtml(item.receiptUrl)}" target="_blank" class="ghost-action" style="display:inline-block;margin-top:4px;">Dekontu Görüntüle</a></label></div>`
    : `<div class="wide"><label class="muted">Dekont: Yüklenmemiş</label></div>`;

  const shippedHtml = item.shippedAt
    ? `<div class="wide" style="padding:8px 0;"><span class="badge good">✓ Kargoya verildi: ${escapeHtml(item.shippedAt?.slice(0, 10) || '')}</span></div>`
    : '';

  return `
    <div class="form-grid three">
      ${collectionField('Sipariş No', 'orders', index, 'orderNumber', item.orderNumber)}
      <label>
        Durum
        <select data-collection="orders" data-index="${index}" data-field="status">
          ${['pending', 'processing', 'on-hold', 'shipped', 'completed', 'cancelled', 'refunded', 'failed']
            .map((status) => option(status, orderStatusLabel(status), item.status || 'pending'))
            .join('')}
        </select>
      </label>
      ${collectionField('Tarih', 'orders', index, 'createdAt', item.createdAt?.slice(0, 10) || '', 'text', 'text')}
      ${collectionField('Firma', 'orders', index, 'companyName', item.companyName || '')}
      ${collectionField('Müşteri', 'orders', index, 'customerName', item.customerName || '')}
      ${collectionField('E-posta', 'orders', index, 'customerEmail', item.customerEmail || '')}
      ${collectionField('Telefon', 'orders', index, 'customerPhone', item.customerPhone || '')}
      ${collectionField('Vergi No', 'orders', index, 'taxNo', item.taxNo || '')}
      ${collectionField('Para Birimi', 'orders', index, 'currency', item.currency || 'EUR')}
      ${collectionField('Ara Toplam', 'orders', index, 'subtotal', item.subtotal || 0, 'number', 'number')}
      ${collectionField('Vergi', 'orders', index, 'taxTotal', item.taxTotal || 0, 'number', 'number')}
      ${collectionField('Genel Toplam', 'orders', index, 'grandTotal', item.grandTotal || 0, 'number', 'number')}
      ${receiptHtml}
      ${shippedHtml}
    </div>
    <div style="margin-top:12px;padding:16px;background:var(--surface-alt, #18191e);border:1px solid var(--border-soft, #2a2d3a);border-radius:8px;">
      <strong style="font-size:13px;display:block;margin-bottom:10px;">🚚 Kargo Bildirimi</strong>
      <div class="form-grid three" style="padding:0;">
        <label>Kargo Firması<input type="text" id="carrier-${index}" placeholder="Aras, MNG, Yurtiçi..." value="${escapeHtml(item.carrier || '')}" /></label>
        <label class="wide">Kargo Takip No<input type="text" id="tracking-${index}" placeholder="Takip numarası" value="${escapeHtml(item.trackingNumber || '')}" /></label>
      </div>
      <div style="margin-top:10px;">
        <button class="primary-action" type="button" data-action="ship-order" data-id="${escapeHtml(item.id || '')}" data-index="${index}">
          ${item.shippedAt ? '✓ Kargo Bildirimini Güncelle' : '🚚 Kargoya Verildi – Müşteriye Bildir'}
        </button>
        ${item.shippedAt ? '' : ''}
      </div>
    </div>
    <div style="margin-top:10px;">
      ${collectionTextarea('Fatura Adresi', 'orders', index, 'billingAddress', item.billingAddress || '')}
      ${collectionTextarea('Teslimat Adresi', 'orders', index, 'shippingAddress', item.shippingAddress || '')}
      ${collectionTextarea('Notlar', 'orders', index, 'notes', item.notes || '')}
      ${collectionTextarea('Ürünler JSON', 'orders', index, 'items', JSON.stringify(item.items || [], null, 2), 'json-array')}
    </div>
  `;
}

function renderFormSubmissions() {
  return renderCompactCollectionEditor({
    title: 'Form Talepleri',
    collectionKey: 'formSubmissions',
    items: state.content.formSubmissions || [],
    selectedId: state.selectedFormSubmissionId,
    emptyText: 'Henüz form talebi yok.',
    addLabel: 'Yeni Talep',
    renderEditor: formSubmissionTemplate,
    itemTitle: (item) => item.code || item.company || item.fullName || item.name || item.email || item.id || 'Form Talebi',
    itemStatus: (item) => formSubmissionStatusLabel(item.status || 'new'),
    summary: (item) => `${formSubmissionTypeLabel(item.type)} · ${item.createdAt || 'tarih yok'} · ${item.email || 'mail yok'}`,
  });
}

function formSubmissionTypeLabel(type) {
  const labels = {
    contact: 'İletişim',
    quote: 'Teklif',
    order: 'Sipariş',
    payment: 'Ödeme',
  };
  return labels[type] || type || 'Form';
}

function formSubmissionStatusLabel(status) {
  const labels = {
    new: 'Yeni',
    'in-review': 'İnceleniyor',
    responded: 'Yanıtlandı',
    archived: 'Arşiv',
  };
  return labels[status] || status || 'Yeni';
}

function formSubmissionTemplate(item, index) {
  const nameField = item.type === 'quote' || item.fullName !== undefined ? 'fullName' : 'name';
  return `
    <div class="form-grid three">
      ${collectionField('ID', 'formSubmissions', index, 'id', item.id || '')}
      <label>
        Talep Tipi
        <select data-collection="formSubmissions" data-index="${index}" data-field="type">
          ${option('contact', 'İletişim', item.type || 'contact')}
          ${option('quote', 'Teklif', item.type || 'contact')}
          ${option('order', 'Sipariş', item.type || 'contact')}
          ${option('payment', 'Ödeme', item.type || 'contact')}
        </select>
      </label>
      <label>
        Durum
        <select data-collection="formSubmissions" data-index="${index}" data-field="status">
          ${option('new', 'Yeni', item.status || 'new')}
          ${option('in-review', 'İnceleniyor', item.status || 'new')}
          ${option('responded', 'Yanıtlandı', item.status || 'new')}
          ${option('archived', 'Arşiv', item.status || 'new')}
        </select>
      </label>
      ${collectionField('Talep / Sipariş No', 'formSubmissions', index, 'code', item.code || '')}
      ${collectionField('Tarih', 'formSubmissions', index, 'createdAt', item.createdAt || '', 'text', 'text')}
      ${collectionField('Ad Soyad', 'formSubmissions', index, nameField, item.fullName || item.name || '')}
      ${collectionField('Şirket', 'formSubmissions', index, 'company', item.company || '')}
      ${collectionField('E-posta', 'formSubmissions', index, 'email', item.email || '', 'text', 'email')}
      ${collectionField('Telefon', 'formSubmissions', index, 'phone', item.phone || '', 'text', 'tel')}
      ${collectionField('Şehir', 'formSubmissions', index, 'city', item.city || '')}
      ${collectionField('Aciliyet', 'formSubmissions', index, 'urgency', item.urgency || '')}
      ${collectionField('Kaynak', 'formSubmissions', index, 'source', item.source || '')}
      ${collectionTextarea('Mesaj', 'formSubmissions', index, 'message', item.message || '')}
      ${collectionTextarea('Notlar', 'formSubmissions', index, 'notes', item.notes || '')}
      ${collectionTextarea('Ürünler JSON', 'formSubmissions', index, 'items', JSON.stringify(item.items || [], null, 2), 'json-array')}
    </div>
  `;
}

function renderMembership() {
  const settings = state.content.membershipSettings;
  return `
    <section class="panel">
      <div class="panel-header"><h2>Kurumsal Üyelik</h2></div>
      <div class="panel-body stack">
        ${sectionFields('Üyelik Sayfası', [
          ['Başlık', 'membershipSettings.title'],
          ['Açıklama', 'membershipSettings.description', 'textarea'],
          ['Başarı Mesajı', 'membershipSettings.successMessage', 'textarea'],
        ])}
        <section class="collection-item">
          <div class="collection-heading"><strong>Üyelik Kuralları</strong></div>
          <div class="form-grid">
            <label>
              Onay Modu
              <select data-path="membershipSettings.approvalMode">
                ${option('manual', 'Manuel firma onayı', settings.approvalMode || 'manual')}
                ${option('auto', 'Otomatik onay', settings.approvalMode || 'manual')}
              </select>
            </label>
            <label class="check-pill"><input type="checkbox" data-path-checkbox="membershipSettings.emailVerificationRequired" ${settings.emailVerificationRequired ? 'checked' : ''} /> E-posta doğrulama zorunlu</label>
            <label class="check-pill"><input type="checkbox" data-path-checkbox="membershipSettings.requireCompanyInfo" ${settings.requireCompanyInfo ? 'checked' : ''} /> Firma bilgileri zorunlu</label>
          </div>
        </section>
        ${collectionPanel('Firma Bilgi Alanları', 'membershipSettings.companyFields', settings.companyFields || [], membershipFieldTemplate)}
      </div>
    </section>
  `;
}

function membershipFieldTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'membershipSettings.companyFields', index, 'id', item.id)}
      ${collectionField('Etiket', 'membershipSettings.companyFields', index, 'label', item.label)}
      <label class="check-pill"><input type="checkbox" data-collection="membershipSettings.companyFields" data-index="${index}" data-field="required" data-kind="checkbox" ${item.required ? 'checked' : ''} /> Zorunlu</label>
    </div>
  `;
}

function renderMembers() {
  return renderCompactCollectionEditor({
    title: 'Üyeler',
    collectionKey: 'members',
    items: state.content.members || [],
    selectedId: state.selectedMemberId,
    emptyText: 'Henüz üye kaydı yok.',
    addLabel: 'Yeni Üye',
    renderEditor: memberTemplate,
    itemTitle: (item) => item.companyName || item.authorizedEmail || item.id || 'Üye',
    itemStatus: (item) => memberStatusLabel(item.status || 'pending'),
    summary: (item) => `${item.authorizedName || 'Yetkili yok'} · ${item.authorizedEmail || 'mail yok'} · ${item.createdAt || 'tarih yok'}`,
  });
}

function memberStatusLabel(status) {
  const labels = {
    pending: 'Onay bekliyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    inactive: 'Pasif',
  };
  return labels[status] || status || 'Onay bekliyor';
}

function memberTemplate(item, index) {
  return `
    <div class="form-grid three">
      ${collectionField('ID', 'members', index, 'id', item.id)}
      <label>
        Durum
        <select data-collection="members" data-index="${index}" data-field="status">
          ${option('pending', 'Onay bekliyor', item.status || 'pending')}
          ${option('approved', 'Onaylandı', item.status || 'pending')}
          ${option('rejected', 'Reddedildi', item.status || 'pending')}
          ${option('inactive', 'Pasif', item.status || 'pending')}
        </select>
      </label>
      ${collectionField('Kayıt Tarihi', 'members', index, 'createdAt', item.createdAt || '', 'text', 'text')}
      ${collectionField('Firma Adı', 'members', index, 'companyName', item.companyName || '', 'text', 'text', true)}
      ${collectionField('Vergi No', 'members', index, 'taxNo', item.taxNo || '', 'text', 'text')}
      ${collectionField('Vergi Dairesi', 'members', index, 'taxOffice', item.taxOffice || '')}
      ${collectionTextarea('Adres', 'members', index, 'address', item.address || '')}
      ${collectionField('Yetkili Adı', 'members', index, 'authorizedName', item.authorizedName || '')}
      ${collectionField('Yetkili Telefonu', 'members', index, 'authorizedPhone', item.authorizedPhone || '', 'text', 'tel')}
      ${collectionField('Yetkili E-postası', 'members', index, 'authorizedEmail', item.authorizedEmail || '', 'text', 'email')}
      <label class="check-pill"><input type="checkbox" data-collection="members" data-index="${index}" data-field="emailVerified" data-kind="checkbox" ${item.emailVerified ? 'checked' : ''} /> Mail doğrulandı</label>
      <label class="check-pill"><input type="checkbox" data-collection="members" data-index="${index}" data-field="agreement" data-kind="checkbox" ${item.agreement ? 'checked' : ''} /> Koşullar kabul edildi</label>
      ${collectionTextarea('Admin Notu', 'members', index, 'notes', item.notes || '')}
    </div>
  `;
}

function renderNewsletterSubscribers() {
  return renderCompactCollectionEditor({
    title: 'Bülten Üyeleri',
    collectionKey: 'newsletterSubscribers',
    items: state.content.newsletterSubscribers || [],
    selectedId: state.selectedNewsletterSubscriberId,
    emptyText: 'Henüz bülten üyesi yok.',
    addLabel: 'Yeni Bülten Üyesi',
    renderEditor: newsletterSubscriberTemplate,
    itemTitle: (item) => item.email || item.id || 'Bülten Üyesi',
    itemStatus: (item) => (item.status === 'unsubscribed' ? 'Ayrıldı' : 'Aktif'),
    summary: (item) => `${item.source || 'website'} · ${item.createdAt || 'tarih yok'}`,
  });
}

function newsletterSubscriberTemplate(item, index) {
  return `
    <div class="form-grid three">
      ${collectionField('ID', 'newsletterSubscribers', index, 'id', item.id)}
      ${collectionField('E-posta', 'newsletterSubscribers', index, 'email', item.email || '', 'text', 'email', true)}
      <label>
        Durum
        <select data-collection="newsletterSubscribers" data-index="${index}" data-field="status">
          ${option('active', 'Aktif', item.status || 'active')}
          ${option('unsubscribed', 'Ayrıldı', item.status || 'active')}
        </select>
      </label>
      ${collectionField('Kaynak', 'newsletterSubscribers', index, 'source', item.source || 'website')}
      ${collectionField('Kayıt Tarihi', 'newsletterSubscribers', index, 'createdAt', item.createdAt || '', 'text', 'text')}
      ${collectionField('Güncelleme Tarihi', 'newsletterSubscribers', index, 'updatedAt', item.updatedAt || '', 'text', 'text')}
      ${collectionTextarea('Not', 'newsletterSubscribers', index, 'notes', item.notes || '')}
    </div>
  `;
}

function renderEmails() {
  const templates = state.content.emailSettings.templates || [];
  return `
    <div class="stack">
      <section class="panel">
        <div class="panel-header"><h2>Mail İçerikleri ve Bildirimler</h2></div>
        <div class="panel-body stack">
          ${sectionFields('Gönderici ve Muhasebe', [
            ['Gönderici Adı', 'emailSettings.senderName'],
            ['Gönderici E-posta', 'emailSettings.senderEmail'],
            ['Muhasebe E-postası', 'emailSettings.accountingEmail'],
          ])}
          <section class="collection-item">
            <div class="collection-heading"><strong>Otomatik Bildirim Eşleşmeleri</strong></div>
            <div class="form-grid three">
              ${templateSelect('Üyelik Doğrulama Şablonu', 'emailSettings.verificationTemplateId', templates)}
              ${templateSelect('Sipariş Detayı Şablonu', 'emailSettings.orderDetailTemplateId', templates)}
              ${templateSelect('Ödeme Alındı Şablonu', 'emailSettings.paymentReceivedTemplateId', templates)}
            </div>
            <p class="muted">Kullanılabilir değişkenler: {{customerName}}, {{customerEmail}}, {{companyName}}, {{authorizedName}}, {{verificationCode}}, {{orderNumber}}, {{orderItems}}, {{subtotal}}, {{taxTotal}}, {{grandTotal}}, {{currency}}.</p>
          </section>
        </div>
      </section>
      ${renderCompactCollectionEditor({
        title: 'Mail Şablonları',
        collectionKey: 'emailSettings.templates',
        items: templates,
        selectedId: state.selectedEmailTemplateId,
        emptyText: 'Henüz mail şablonu yok.',
        addLabel: 'Yeni Şablon',
        renderEditor: emailTemplateTemplate,
        itemTitle: (item) => item.name || item.subject || item.id || 'Mail Şablonu',
        itemStatus: (item) => (item.enabled === false ? 'Pasif' : 'Aktif'),
        summary: (item) => `${item.trigger || 'manual'} · ${item.subject || 'konu yok'}`,
      })}
    </div>
  `;
}

function renderMailSettings() {
  const settings = state.content.mailSettings || {};
  const testMail = state.testMail || {};
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Mail Ayarları</h2>
          <span class="muted">Formlar, üyelik doğrulama, sipariş ve bildirim mailleri bu ayarları kullanır.</span>
        </div>
      </div>
      <div class="panel-body stack">
        <section class="collection-item">
          <div class="collection-heading"><strong>Varsayılan Gönderim</strong></div>
          <div class="form-grid three">
            ${pathField('Gönderici Adı', 'mailSettings.defaultFromName')}
            ${pathField('Gönderici Mail', 'mailSettings.defaultFromEmail')}
            ${pathField('Bildirim Maili', 'mailSettings.notificationEmail')}
          </div>
        </section>
        <section class="collection-item">
          <div class="collection-heading"><strong>SMTP</strong></div>
          <div class="form-grid three">
            ${pathField('SMTP Sunucusu', 'mailSettings.smtpHost')}
            <label>
              SMTP Port
              <input type="number" value="${escapeHtml(settings.smtpPort ?? 465)}" data-path="mailSettings.smtpPort" />
            </label>
            <label>
              Güvenlik
              <select data-path="mailSettings.smtpSecure">
                ${option('ssl', 'SSL/TLS', settings.smtpSecure || 'ssl')}
                ${option('tls', 'STARTTLS', settings.smtpSecure || 'ssl')}
                ${option('', 'Yok', settings.smtpSecure || 'ssl')}
              </select>
            </label>
            ${pathField('SMTP Kullanıcı Adı', 'mailSettings.smtpUsername')}
            <label>
              SMTP Şifre
              <input type="password" value="${escapeHtml(settings.smtpPassword || '')}" data-path="mailSettings.smtpPassword" autocomplete="new-password" />
            </label>
            <label class="check-pill"><input type="checkbox" data-path-checkbox="mailSettings.smtpAuth" ${settings.smtpAuth !== false ? 'checked' : ''} /> SMTP kimlik doğrulama aktif</label>
          </div>
        </section>
        <section class="collection-item">
          <div class="collection-heading">
            <strong>Test Mail</strong>
            <span class="muted">Kaydetmeden önce bu ekrandaki SMTP bilgileriyle deneme gönderimi yapar.</span>
          </div>
          <div class="form-grid">
            <label>
              Test Alıcısı
              <input type="email" value="${escapeHtml(testMail.to || settings.notificationEmail || 'info@plastik24.com.tr')}" data-test-mail-field="to" placeholder="info@plastik24.com.tr" />
            </label>
            <label>
              Konu
              <input type="text" value="${escapeHtml(testMail.subject || 'Plastik24 test maili')}" data-test-mail-field="subject" />
            </label>
            <label class="wide">
              Mesaj
              <textarea rows="5" data-test-mail-field="body">${escapeHtml(testMail.body || 'Bu mail Plastik24 admin panelinden gönderilen test mesajıdır.')}</textarea>
            </label>
          </div>
          <div class="row-actions">
            <button class="primary-action" type="button" data-action="send-test-mail">Test Maili Gönder</button>
          </div>
        </section>
        <section class="collection-item">
          <div class="collection-heading"><strong>Gelen Posta Bilgileri</strong></div>
          <div class="form-grid three">
            ${pathField('IMAP Sunucusu', 'mailSettings.imapHost')}
            <label>
              IMAP Port
              <input type="number" value="${escapeHtml(settings.imapPort ?? 993)}" data-path="mailSettings.imapPort" />
            </label>
            ${pathField('POP3 Sunucusu', 'mailSettings.pop3Host')}
            <label>
              POP3 Port
              <input type="number" value="${escapeHtml(settings.pop3Port ?? 995)}" data-path="mailSettings.pop3Port" />
            </label>
          </div>
        </section>
        <section class="collection-item">
          <div class="collection-heading"><strong>Vergi No Doğrulama</strong></div>
          <div class="form-grid">
            <label class="check-pill"><input type="checkbox" data-path-checkbox="mailSettings.nilveraEnabled" ${settings.nilveraEnabled ? 'checked' : ''} /> Nilvera VKN sorgusunu kullan</label>
            ${pathField('Nilvera API Base URL', 'mailSettings.nilveraApiBase', 'input', true)}
            <label class="wide">
              Nilvera API Anahtarı
              <input type="password" value="${escapeHtml(settings.nilveraApiKey || '')}" data-path="mailSettings.nilveraApiKey" autocomplete="new-password" />
            </label>
            <p class="muted wide">API anahtarı girilmezse sadece 10 hane/sadece rakam kontrolü uygulanır.</p>
          </div>
        </section>
      </div>
    </section>
  `;
}

function templateSelect(label, path, templates) {
  const value = getPath(state.content, path) || '';
  return `
    <label>
      ${label}
      <select data-path="${path}">
        ${templates.map((template) => option(template.id, template.name || template.id, value)).join('')}
      </select>
    </label>
  `;
}

function emailTemplateTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'emailSettings.templates', index, 'id', item.id)}
      ${collectionField('Şablon Adı', 'emailSettings.templates', index, 'name', item.name, 'text', 'text', true)}
      <label>
        Tetikleyici
        <select data-collection="emailSettings.templates" data-index="${index}" data-field="trigger">
          ${['email-verification', 'order-details', 'payment-received', 'shipping-notification', 'manual']
            .map((trigger) => option(trigger, trigger, item.trigger || 'manual'))
            .join('')}
        </select>
      </label>
      ${collectionField('Konu', 'emailSettings.templates', index, 'subject', item.subject || '', 'text', 'text', true)}
      ${collectionTextarea('Mail İçeriği', 'emailSettings.templates', index, 'body', item.body || '')}
      <label class="check-pill"><input type="checkbox" data-collection="emailSettings.templates" data-index="${index}" data-field="enabled" data-kind="checkbox" ${item.enabled !== false ? 'checked' : ''} /> Aktif</label>
    </div>
  `;
}

function renderContact() {
  return `
    <section class="panel">
      <div class="panel-header"><h2>İletişim Sayfası</h2></div>
      <div class="panel-body stack">
        ${sectionFields('Sayfa Bilgileri', [
          ['Başlık TR', 'contactPage.title'],
          ['Başlık EN', 'contactPage.titleEn'],
          ['Açıklama TR', 'contactPage.description', 'textarea'],
          ['Açıklama EN', 'contactPage.descriptionEn', 'textarea'],
          ['E-posta', 'contactPage.email'],
          ['Telefon', 'contactPage.phone'],
          ['WhatsApp', 'contactPage.whatsapp'],
          ['Adres', 'contactPage.address', 'textarea'],
          ['Çalışma Saatleri', 'contactPage.workingHours'],
          ['Harita Embed URL', 'contactPage.mapEmbedUrl', 'textarea'],
        ])}
        ${collectionPanel('Departmanlar', 'contactPage.departments', state.content.contactPage.departments || [], departmentTemplate)}
      </div>
    </section>
  `;
}

function departmentTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'contactPage.departments', index, 'id', item.id)}
      ${collectionField('Başlık', 'contactPage.departments', index, 'title', item.title)}
      ${collectionField('E-posta', 'contactPage.departments', index, 'email', item.email)}
      ${collectionField('Telefon', 'contactPage.departments', index, 'phone', item.phone || '')}
    </div>
  `;
}

function renderForms() {
  return `
    <section class="panel">
      <div class="panel-header"><h2>Form Ayarları</h2></div>
      <div class="panel-body stack">
        ${sectionFields('Alıcılar ve Mesajlar', [
          ['Teklif Formu E-postası', 'formSettings.quoteFormEmail'],
          ['İletişim Formu E-postası', 'formSettings.contactFormEmail'],
          ['Başarı Mesajı TR', 'formSettings.successMessage', 'textarea'],
          ['Başarı Mesajı EN', 'formSettings.successMessageEn', 'textarea'],
        ])}
        <label class="check-pill"><input type="checkbox" data-path-checkbox="formSettings.requireGdprConsent" ${state.content.formSettings.requireGdprConsent ? 'checked' : ''} /> KVKK/GDPR onayı zorunlu olsun</label>
        ${collectionPanel('Form Alanları', 'formSettings.fields', state.content.formSettings.fields || [], formFieldTemplate)}
      </div>
    </section>
  `;
}

function formFieldTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'formSettings.fields', index, 'id', item.id)}
      ${collectionField('Etiket', 'formSettings.fields', index, 'label', item.label)}
      <label>
        Tip
        <select data-collection="formSettings.fields" data-index="${index}" data-field="type">
          ${['text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'file']
            .map((type) => option(type, type, item.type || 'text'))
            .join('')}
        </select>
      </label>
      ${collectionTextarea('Seçenekler (her satır ayrı)', 'formSettings.fields', index, 'options', (item.options || []).join('\n'), 'lines')}
      <label class="check-pill"><input type="checkbox" data-collection="formSettings.fields" data-index="${index}" data-field="required" data-kind="checkbox" ${item.required ? 'checked' : ''} /> Zorunlu</label>
      <label class="check-pill"><input type="checkbox" data-collection="formSettings.fields" data-index="${index}" data-field="enabled" data-kind="checkbox" ${item.enabled !== false ? 'checked' : ''} /> Aktif</label>
    </div>
  `;
}

function renderSocial() {
  return `
    <section class="panel">
      <div class="panel-header"><h2>Sosyal Medya Hesapları</h2></div>
      <div class="panel-body form-grid">
        ${pathField('LinkedIn', 'socialLinks.linkedin', 'input', true)}
        ${pathField('Instagram', 'socialLinks.instagram', 'input', true)}
        ${pathField('Facebook', 'socialLinks.facebook', 'input', true)}
        ${pathField('YouTube', 'socialLinks.youtube', 'input', true)}
        ${pathField('X / Twitter', 'socialLinks.x', 'input', true)}
        ${pathField('WhatsApp', 'socialLinks.whatsapp', 'input', true)}
      </div>
    </section>
  `;
}

function renderPayments() {
  return `
    <section class="panel">
      <div class="panel-header"><h2>Ödeme Altyapısı</h2></div>
      <div class="panel-body stack">
        <div class="form-grid">
          ${pathField('Varsayılan Para Birimi', 'paymentSettings.currency')}
          <label class="check-pill"><input type="checkbox" data-path-checkbox="paymentSettings.taxEnabled" ${state.content.paymentSettings.taxEnabled ? 'checked' : ''} /> Vergi hesaplama aktif</label>
        </div>
        ${collectionPanel('Ödeme Sağlayıcıları', 'paymentSettings.providers', state.content.paymentSettings.providers || [], providerTemplate)}
        ${collectionPanel('Banka Hesapları', 'paymentSettings.bankAccounts', state.content.paymentSettings.bankAccounts || [], bankTemplate)}
      </div>
    </section>
  `;
}

function providerTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'paymentSettings.providers', index, 'id', item.id)}
      ${collectionField('Sağlayıcı Adı', 'paymentSettings.providers', index, 'name', item.name)}
      <label>
        Mod
        <select data-collection="paymentSettings.providers" data-index="${index}" data-field="mode">
          ${option('test', 'Test', item.mode || 'test')}
          ${option('live', 'Canlı', item.mode || 'test')}
        </select>
      </label>
      ${collectionField('Public Key', 'paymentSettings.providers', index, 'publicKey', item.publicKey || '', 'text', 'text', true)}
      ${collectionField('Merchant ID', 'paymentSettings.providers', index, 'merchantId', item.merchantId || '', 'text', 'text', true)}
      ${collectionTextarea('Açıklama', 'paymentSettings.providers', index, 'description', item.description || '')}
      <label class="check-pill"><input type="checkbox" data-collection="paymentSettings.providers" data-index="${index}" data-field="enabled" data-kind="checkbox" ${item.enabled ? 'checked' : ''} /> Aktif</label>
    </div>
  `;
}

function bankTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('ID', 'paymentSettings.bankAccounts', index, 'id', item.id)}
      ${collectionField('Banka', 'paymentSettings.bankAccounts', index, 'bankName', item.bankName)}
      ${collectionField('Hesap Adı', 'paymentSettings.bankAccounts', index, 'accountName', item.accountName)}
      ${collectionField('IBAN', 'paymentSettings.bankAccounts', index, 'iban', item.iban, 'text', 'text', true)}
      ${collectionField('Para Birimi', 'paymentSettings.bankAccounts', index, 'currency', item.currency || 'EUR')}
      <label class="check-pill"><input type="checkbox" data-collection="paymentSettings.bankAccounts" data-index="${index}" data-field="enabled" data-kind="checkbox" ${item.enabled !== false ? 'checked' : ''} /> Aktif</label>
    </div>
  `;
}

function renderSectors() {
  return collectionPanel('Sektörler', 'sectors', state.content.sectors || [], sectorTemplate);
}

function sectorTemplate(item, index) {
  return `
    <div class="form-grid">
      ${collectionField('Başlık', 'sectors', index, 'title', item.title)}
      ${collectionField('İkon Anahtarı', 'sectors', index, 'icon', item.icon || '')}
      ${collectionField('Sıralama', 'sectors', index, 'sortOrder', item.sortOrder || index + 1, 'int', 'number')}
      ${collectionTextarea('Açıklama', 'sectors', index, 'description', item.description)}
      <label class="check-pill"><input type="checkbox" data-collection="sectors" data-index="${index}" data-field="isPublished" data-kind="checkbox" ${item.isPublished !== false ? 'checked' : ''} /> Yayında</label>
    </div>
  `;
}

function collectionPanel(title, key, items, template) {
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>${title}</h2>
        <button class="secondary-action" type="button" data-action="add-collection" data-collection-type="${key}">Yeni Kayıt</button>
      </div>
      <div class="panel-body collection-list">
        ${items
          .map(
            (item, index) => `
              <article class="collection-item">
                <div class="collection-heading">
                  <strong>${escapeHtml(item.title || item.companyName || item.email || item.orderNumber || item.name || item.material || item.sku || item.id)}</strong>
                  <button class="mini-button danger" type="button" data-action="delete-collection" data-collection-type="${key}" data-index="${index}">Sil</button>
                </div>
                ${template(item, index)}
              </article>
            `
          )
          .join('')}
      </div>
    </section>
  `;
}

function collectionField(label, collection, index, fieldName, value = '', kind = 'text', type = 'text', wide = false) {
  return `
    <label class="${wide ? 'wide' : ''}">
      ${label}
      <input type="${type}" value="${escapeHtml(value ?? '')}" data-collection="${collection}" data-index="${index}" data-field="${fieldName}" data-kind="${kind}" />
    </label>
  `;
}

function collectionTextarea(label, collection, index, fieldName, value = '', kind = 'text') {
  return `
    <label class="wide">
      ${label}
      <textarea data-collection="${collection}" data-index="${index}" data-field="${fieldName}" data-kind="${kind}">${escapeHtml(value ?? '')}</textarea>
    </label>
  `;
}

function renderPages() {
  const page = state.content.pageTexts;
  return `
    <section class="panel">
      <div class="panel-header"><h2>Sayfa Metinleri</h2></div>
      <div class="panel-body stack">
        ${sectionFields('Hero', [
          ['Rozet', 'pageTexts.hero.badge'],
          ['Başlık', 'pageTexts.hero.title'],
          ['Açıklama', 'pageTexts.hero.description', 'textarea'],
          ['Arama Placeholder', 'pageTexts.hero.searchPlaceholder'],
          ['Arama Butonu', 'pageTexts.hero.searchButton'],
          ['Arka Plan Kelimesi', 'pageTexts.hero.backgroundWord'],
        ])}
        ${sectionFields('Ana Sayfa Bölümleri', [
          ['Popüler Eyebrow', 'pageTexts.home.popularEyebrow'],
          ['Popüler Başlık', 'pageTexts.home.popularTitle'],
          ['Popüler Aksiyon', 'pageTexts.home.popularAction'],
          ['Sektör Eyebrow', 'pageTexts.home.sectorsEyebrow'],
          ['Sektör Başlık', 'pageTexts.home.sectorsTitle'],
        ])}
        ${sectionFields('Katalog / Blog / İletişim / Sektör', [
          ['Katalog Başlığı', 'pageTexts.portfolio.title'],
          ['Katalog Açıklaması', 'pageTexts.portfolio.description', 'textarea'],
          ['Boş Sonuç Başlığı', 'pageTexts.portfolio.emptyTitle'],
          ['Boş Sonuç Açıklaması', 'pageTexts.portfolio.emptyDescription', 'textarea'],
          ['Blog Eyebrow', 'pageTexts.blog.eyebrow'],
          ['Blog Başlık', 'pageTexts.blog.title'],
          ['Blog Açıklama', 'pageTexts.blog.description', 'textarea'],
          ['İletişim Eyebrow', 'pageTexts.contact.eyebrow'],
          ['İletişim Başlık', 'pageTexts.contact.title'],
          ['İletişim Açıklama', 'pageTexts.contact.description', 'textarea'],
          ['Sektör Eyebrow', 'pageTexts.sectors.eyebrow'],
          ['Sektör Başlık', 'pageTexts.sectors.title'],
          ['Sektör Açıklama', 'pageTexts.sectors.description', 'textarea'],
          ['Bilgi Merkezi Başlık', 'pageTexts.info.title'],
        ])}
        <section class="collection-item">
          <div class="collection-heading">
            <strong>Bilgi Merkezi Blokları</strong>
            <button class="secondary-action" type="button" data-action="add-info-block">Blok Ekle</button>
          </div>
          <div class="collection-list">
            ${(page.info.blocks || [])
              .map(
                (block, index) => `
                  <div class="collection-item">
                    <div class="collection-heading">
                      <strong>${escapeHtml(block.title || 'Bilgi Bloğu')}</strong>
                      <button class="mini-button danger" type="button" data-action="delete-info-block" data-index="${index}">Sil</button>
                    </div>
                    <div class="form-grid">
                      ${pathField('Başlık', `pageTexts.info.blocks.${index}.title`)}
                      ${pathField('İkon', `pageTexts.info.blocks.${index}.icon`)}
                      ${pathField('Açıklama', `pageTexts.info.blocks.${index}.description`, 'textarea', true)}
                    </div>
                  </div>
                `
              )
              .join('')}
          </div>
        </section>
      </div>
    </section>
  `;
}

function sectionFields(title, fields) {
  return `
    <section class="collection-item">
      <div class="collection-heading"><strong>${title}</strong></div>
      <div class="form-grid">
        ${fields.map(([label, path, type]) => pathField(label, path, type, type === 'textarea')).join('')}
      </div>
    </section>
  `;
}

function pathField(label, path, type = 'input', wide = false) {
  const value = getPath(state.content, path) ?? '';
  if (type === 'textarea') {
    return `
      <label class="${wide ? 'wide' : ''}">
        ${label}
        <textarea data-path="${path}">${escapeHtml(value)}</textarea>
      </label>
    `;
  }
  return `
    <label class="${wide ? 'wide' : ''}">
      ${label}
      <input value="${escapeHtml(value)}" data-path="${path}" />
    </label>
  `;
}

function renderSettings() {
  return `
    <div class="split">
      <div class="stack">
        <section class="panel">
          <div class="panel-header"><h2>Genel Ayarlar</h2></div>
          <div class="panel-body form-grid">
            ${settingsField('Site Başlığı', 'settings.siteTitle')}
            ${settingsField('WhatsApp Telefonu', 'settings.whatsapp')}
            ${settingsField('Adres', 'settings.address', true)}
            ${settingsField('SEO Başlık (TR)', 'settings.seoTitle', true)}
            ${settingsField('SEO Açıklama (TR)', 'settings.seoDescription', true, 'textarea')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header"><h2>Header (Başlık) Ayarları</h2></div>
          <div class="panel-body form-grid">
            ${settingsField('Site Logosu URL', 'settings.logoUrl', true)}
            ${settingsField('Header Telefonu', 'settings.phone')}
            ${settingsField('Header E-postası', 'settings.email')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header"><h2>Footer (Altbilgi) Ayarları</h2></div>
          <div class="panel-body form-grid">
            ${settingsField('Footer Logosu URL', 'settings.footerLogoUrl', true)}
            ${settingsField('Şirket Açıklaması', 'settings.companyDescription', true, 'textarea')}
            ${settingsField('Telif Şirket Adı', 'settings.copyrightCompany')}
            ${pathField('Instagram Linki', 'socialLinks.instagram')}
            ${pathField('Facebook Linki', 'socialLinks.facebook')}
            ${pathField('LinkedIn Linki', 'socialLinks.linkedin')}
            ${settingsField('ISO Kalite Belgesi URL', 'settings.isoBadgeUrl', true)}
            ${settingsField('FDA Uyumluluk Belgesi URL', 'settings.fdaBadgeUrl', true)}
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header"><h2>Güvenlik</h2></div>
        <form id="passwordForm" class="panel-body stack">
          <label>Kullanıcı adı<input name="username" value="admin" /></label>
          <label>Mevcut şifre<input name="currentPassword" type="password" required /></label>
          <label>Yeni şifre<input name="newPassword" type="password" minlength="8" required /></label>
          <button class="primary-action" type="submit">Şifreyi Değiştir</button>
          <p class="muted">İlk kurulum hesabı admin / admin123. Yayına almadan önce mutlaka değiştirin.</p>
        </form>
      </section>
    </div>
  `;
}

function settingsField(label, path, wide = false, type = 'input') {
  return pathField(label, path, type, wide);
}

function renderMedia() {
  return `
    <div class="split">
      <section class="panel">
        <div class="panel-header"><h2>Görsel Yükle</h2></div>
        <div class="panel-body stack">
          <div class="file-row">
            <strong>Yeni Görsel</strong>
            <input id="mediaUploader" type="file" accept="image/*" />
            <button class="primary-action" type="button" data-action="upload-media">Yükle</button>
            <input id="lastUploadUrl" readonly placeholder="Yüklenen görsel URL'si burada görünür" />
          </div>
          <p class="muted">Ürün formundaki görsel alanına bu URL'yi yazabilirsiniz. Ürün düzenleyici içinden yükleme yaptığınızda alan otomatik doldurulur.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>JSON İçerik</h2></div>
        <div class="panel-body stack">
          <button class="ghost-action" type="button" data-action="export-json">Mevcut JSON'u İndir</button>
          <div class="file-row">
            <strong>JSON İçe Aktar</strong>
            <input id="jsonImporter" type="file" accept="application/json,.json" />
            <button class="danger-action" type="button" data-action="import-json">Seçili JSON'u İçeri Al</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function addProduct() {
  const product = emptyProduct();
  state.content.products.unshift(product);
  state.selectedProductId = product.id;
  state.productTab = 'general';
  state.view = 'products';
  markDirty('Yeni ürün taslak olarak eklendi.');
  render();
}

function duplicateProduct(id) {
  const original = products().find((product) => product.id === id);
  if (!original) return;
  const clone = {
    ...structuredClone(original),
    id: uid('product'),
    sku: `${original.sku}-COPY`,
    name: `${original.name} Kopya`,
    isPublished: false,
    sortOrder: products().length + 1,
  };
  state.content.products.unshift(clone);
  state.selectedProductId = clone.id;
  markDirty('Ürün kopyalandı ve taslak olarak eklendi.');
  render();
}

function deleteProduct(id) {
  const product = products().find((item) => item.id === id);
  if (!product) return;
  if (!window.confirm(`${product.name} silinsin mi?`)) return;
  state.content.products = products().filter((item) => item.id !== id);
  if (state.selectedProductId === id) state.selectedProductId = null;
  markDirty('Ürün silindi.');
  render();
}

function addCollection(type) {
  const target = getPath(state.content, type);
  if (!Array.isArray(target)) return showToast('Koleksiyon bulunamadı.');
  const defaults = {
    restStocks: { id: uid('rest'), sku: '#RP-REST', material: 'POM-C Natural', dimensions: '300 x 400 mm', thickness: '20 mm', qty: 1, price: 0, isPublished: true },
    sectors: { id: uid('sector'), title: 'Yeni Sektör', description: '', icon: 'settings', sortOrder: (state.content.sectors || []).length + 1, isPublished: true },
    heroSlides: {
      id: uid('hero'),
      badge: 'Yeni Hero',
      title: 'Yeni Slider Başlığı',
      description: '',
      image: DEFAULT_PRODUCT_IMAGE,
      autoplayEnabled: true,
      durationMs: 6000,
      translations: { en: {} },
      sortOrder: target.length + 1,
      isPublished: true,
    },
    blogPosts: {
      id: uid('blog'),
      slug: 'yeni-yazi',
      title: 'Yeni Blog Yazısı',
      titleEn: '',
      excerpt: '',
      excerptEn: '',
      content: '',
      contentHtml: '',
      contentEn: '',
      image: DEFAULT_PRODUCT_IMAGE,
      imageAlt: '',
      category: 'Teknik Bilgi',
      author: 'Raceplast',
      publishedAt: new Date().toISOString().slice(0, 10),
      readingTime: '',
      keywords: '',
      isPublished: false,
    },
    legalPages: {
      id: uid('legal'),
      slug: 'yeni-bilgi-sayfasi',
      title: 'Yeni Bilgi Sayfası',
      titleEn: '',
      content: '',
      contentEn: '',
      sortOrder: target.length + 1,
      isPublished: true,
    },
    members: {
      id: uid('member'),
      status: 'pending',
      companyName: 'Yeni Firma',
      address: '',
      taxNo: '',
      taxOffice: '',
      authorizedName: '',
      authorizedPhone: '',
      authorizedEmail: '',
      createdAt: new Date().toISOString(),
      notes: '',
      emailVerified: false,
      agreement: false,
    },
    newsletterSubscribers: {
      id: uid('newsletter'),
      email: '',
      status: 'active',
      source: 'admin',
      createdAt: new Date().toISOString(),
      notes: '',
    },
    formSubmissions: {
      id: uid('form'),
      type: 'contact',
      status: 'new',
      createdAt: new Date().toISOString(),
      name: '',
      company: '',
      email: '',
      phone: '',
      message: '',
      notes: '',
      items: [],
    },
    orders: {
      id: uid('order'),
      orderNumber: `RP-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      customerName: 'Yeni Müşteri',
      customerEmail: '',
      customerPhone: '',
      billingAddress: '',
      shippingAddress: '',
      paymentMethod: '',
      shippingMethod: '',
      currency: state.content.paymentSettings.currency || 'EUR',
      subtotal: 0,
      taxTotal: 0,
      shippingTotal: 0,
      grandTotal: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      notes: '',
      items: [],
    },
    'aboutPage.highlights': { id: uid('about'), title: 'Yeni Bilgi', description: '' },
    'contactPage.departments': { id: uid('dept'), title: 'Yeni Departman', email: '', phone: '' },
    'formSettings.fields': { id: uid('field'), label: 'Yeni Alan', type: 'text', required: false, enabled: true, options: [] },
    'membershipSettings.companyFields': { id: uid('company-field'), label: 'Yeni Firma Alanı', required: true },
    'emailSettings.templates': { id: uid('mail'), name: 'Yeni Mail Şablonu', trigger: 'manual', subject: '', body: '', enabled: true },
    'paymentSettings.providers': { id: uid('provider'), name: 'Yeni Sağlayıcı', enabled: false, mode: 'test', publicKey: '', merchantId: '', description: '' },
    'paymentSettings.bankAccounts': { id: uid('bank'), bankName: 'Banka', accountName: 'Raceplast Industrial', iban: '', currency: state.content.paymentSettings.currency || 'EUR', enabled: true },
  };
  const item = structuredClone(defaults[type] || { id: uid('item') });
  target.push(item);
  if (type === 'blogPosts') state.selectedBlogPostId = item.id;
  if (type === 'legalPages') state.selectedLegalPageId = item.id;
  if (type === 'orders') state.selectedOrderId = item.id;
  if (type === 'formSubmissions') state.selectedFormSubmissionId = item.id;
  if (type === 'members') state.selectedMemberId = item.id;
  if (type === 'newsletterSubscribers') state.selectedNewsletterSubscriberId = item.id;
  if (type === 'emailSettings.templates') state.selectedEmailTemplateId = item.id;
  markDirty('Yeni kayıt eklendi.');
  render();
}

function deleteCollection(type, index) {
  const target = getPath(state.content, type);
  if (!Array.isArray(target)) return showToast('Koleksiyon bulunamadı.');
  const deleted = target[index];
  target.splice(index, 1);
  if (type === 'blogPosts' && deleted?.id === state.selectedBlogPostId) {
    state.selectedBlogPostId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  if (type === 'legalPages' && deleted?.id === state.selectedLegalPageId) {
    state.selectedLegalPageId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  if (type === 'orders' && deleted?.id === state.selectedOrderId) {
    state.selectedOrderId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  if (type === 'formSubmissions' && deleted?.id === state.selectedFormSubmissionId) {
    state.selectedFormSubmissionId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  if (type === 'members' && deleted?.id === state.selectedMemberId) {
    state.selectedMemberId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  if (type === 'newsletterSubscribers' && deleted?.id === state.selectedNewsletterSubscriberId) {
    state.selectedNewsletterSubscriberId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  if (type === 'emailSettings.templates' && deleted?.id === state.selectedEmailTemplateId) {
    state.selectedEmailTemplateId = target[Math.max(0, index - 1)]?.id || target[0]?.id || null;
  }
  markDirty('Kayıt silindi.');
  render();
}

async function saveContent() {
  if (!state.content) return;
  els.saveButton.disabled = true;
  els.saveButton.textContent = 'Kaydediliyor';
  try {
    await api('save.php', {
      method: 'POST',
      body: JSON.stringify(state.content),
    });
    markClean('API ile kaydedildi');
    showToast('İçerik başarıyla kaydedildi.');
  } catch (error) {
    if (handleAuthError(error)) return;
    els.alertBar.hidden = false;
    els.alertBar.textContent = error.message;
    showToast(error.message);
    els.saveButton.textContent = 'Kaydet';
  } finally {
    els.saveButton.disabled = false;
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api('upload.php', {
    method: 'POST',
    body: formData,
  });
}

function addMediaLibraryItem(url, name = '') {
  if (!url) return;
  if (!Array.isArray(state.content.mediaLibrary)) state.content.mediaLibrary = [];
  const existing = state.content.mediaLibrary.find((item) => item.url === url);
  if (existing) {
    if (name && !existing.name) existing.name = name;
    return;
  }
  state.content.mediaLibrary.unshift({
    id: uid('media'),
    url,
    name,
    createdAt: new Date().toISOString(),
  });
}

function removeMediaUrl(url) {
  if (!url) return;
  state.content.mediaLibrary = (state.content.mediaLibrary || []).filter((item) => item.url !== url);
  products().forEach((product) => {
    product.gallery = (product.gallery || []).filter((item) => item !== url);
    if (product.image === url) {
      product.image = product.gallery[0] || DEFAULT_PRODUCT_IMAGE;
    }
  });
  (state.content.heroSlides || []).forEach((slide) => {
    if (slide.image === url) slide.image = DEFAULT_PRODUCT_IMAGE;
  });
  (state.content.blogPosts || []).forEach((post) => {
    if (post.image === url) post.image = DEFAULT_PRODUCT_IMAGE;
  });
  if (state.content.aboutPage?.image === url) {
    state.content.aboutPage.image = DEFAULT_PRODUCT_IMAGE;
  }
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast('Link panoya kopyalandı.');
  } catch {
    const input = document.createElement('input');
    input.value = value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    showToast('Link seçildi ve kopyalandı.');
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `raceplast-site-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importJson() {
  const input = document.querySelector('#jsonImporter');
  const file = input?.files?.[0];
  if (!file) return showToast('Önce JSON dosyası seçin.');
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.products || !data.settings) throw new Error('Bu dosya Raceplast içerik JSON formatında değil.');
  state.content = data;
  ensureContentShape();
  markDirty('JSON içe aktarıldı. Kalıcı olması için kaydedin.');
  render();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  return rows;
}

function arraysToObjects(rows) {
  const headers = (rows[0] || []).map((header) => normalizeKey(header));
  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] ?? '';
    });
    return item;
  });
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pick(row, keys, fallback = '') {
  for (const key of keys) {
    const value = row[normalizeKey(key)];
    if (value !== undefined && String(value).trim() !== '') return String(value).trim();
  }
  return fallback;
}

function num(value, fallback = 0) {
  const normalized = String(value ?? '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value, fallback = true) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'evet', 'yes', 'yayinda', 'published', 'aktif'].includes(normalizeKey(value));
}

function splitList(value) {
  return String(value || '')
    .split(/[|;\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function rowsToProducts(rows) {
  const skuColumn = state.content.importSettings.skuColumn || 'sku';
  const stockColumn = state.content.importSettings.stockColumn || 'stock';
  return rows
    .map((row, index) => {
      const sku = pick(row, [skuColumn, 'sku', 'urun_kodu', 'stok_kodu', 'artikelnummer', 'article_number']);
      if (!sku) return null;
      const image = pick(row, ['image', 'gorsel', 'resim', 'main_image'], DEFAULT_PRODUCT_IMAGE);
      const product = {
        id: uid('product'),
        sku,
        slug: pick(row, ['slug'], sku.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')),
        name: pick(row, ['name', 'urun_adi', 'urun', 'product_name'], sku),
        nameEn: pick(row, ['name_en', 'english_name', 'product_name_en']),
        image,
        gallery: Array.from(new Set([image, ...splitList(pick(row, ['gallery', 'galeri', 'images', 'gorseller']))])).filter(Boolean),
        category: pick(row, ['category', 'kategori'], 'Plaka / Levha'),
        categoryEn: pick(row, ['category_en', 'kategori_en']),
        material: pick(row, ['material', 'malzeme', 'material_type', 'malzeme_cinsi'], ''),
        materialEn: pick(row, ['material_en', 'malzeme_en']),
        materialType: pick(row, ['material_type', 'malzeme_cinsi', 'malzeme'], ''),
        dimensions: pick(row, ['dimensions', 'boyut', 'olcu', 'size']),
        thickness: num(pick(row, ['thickness', 'kalinlik'], ''), undefined),
        thicknessStr: pick(row, ['thickness_text', 'kalinlik_metni', 'kalinlik_mm']),
        diameter: pick(row, ['diameter', 'cap']),
        length: pick(row, ['length', 'boy', 'uzunluk']),
        width: pick(row, ['width', 'en', 'genislik']),
        weight: pick(row, ['weight', 'agirlik']),
        specificGravity: pick(row, ['specific_gravity', 'oz_agirlik', 'ozgul_agirlik', 'density', 'yogunluk']),
        calculatedWeight: pick(row, ['calculated_weight', 'hesaplanan_agirlik', 'agirlik']),
        foodCompliance: splitList(pick(row, ['food_compliance', 'gida_uyumu', 'certificates'], 'None')),
        realStock: num(pick(row, [stockColumn, 'real_stock', 'stok', 'stock', 'adet'], '0'), 0),
        stockUnit: pick(row, ['stock_unit', 'birim'], 'Adet'),
        regularPrice: num(pick(row, ['regular_price', 'price', 'fiyat'], '0'), 0),
        salePrice: num(pick(row, ['sale_price', 'indirimli_fiyat'], '0'), 0),
        currency: pick(row, ['currency', 'para_birimi'], state.content.paymentSettings.currency || 'EUR'),
        description: pick(row, ['description', 'aciklama']),
        descriptionEn: pick(row, ['description_en', 'aciklama_en']),
        color: pick(row, ['color', 'renk']),
        grade: pick(row, ['grade', 'sinif']),
        technicalProperties: splitList(pick(row, ['technical_properties', 'teknik_ozellikler'])),
        tags: splitList(pick(row, ['tags', 'etiketler'])),
        sortOrder: num(pick(row, ['sort_order', 'siralama'], String(products().length + index + 1)), products().length + index + 1),
        isPublished: bool(pick(row, ['published', 'yayinda', 'status'], 'true'), true),
        manageStock: true,
        stockStatus: 'instock',
        backorders: 'no',
        taxStatus: 'taxable',
        catalogVisibility: 'visible',
      };
      product.stockStatus = product.realStock > 0 ? 'instock' : 'outofstock';
      normalizeProduct(product);
      return product;
    })
    .filter(Boolean);
}

async function loadGoogleSheetPreview() {
  const url = state.content.importSettings.googleSheetCsvUrl;
  if (!url) return showToast('Önce Google Sheet CSV URL alanını doldurun.');
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Google Sheet CSV okunamadı.');
  const rows = parseCsv(await response.text());
  state.importPreview = rowsToProducts(arraysToObjects(rows));
  setSyncStatus(`${state.importPreview.length} ürün önizlendi`);
  render();
}

async function loadExcelPreview() {
  const input = document.querySelector('#sheetFile');
  const file = input?.files?.[0];
  if (!file) return showToast('Önce Excel veya CSV dosyası seçin.');

  if (file.name.toLowerCase().endsWith('.csv')) {
    const rows = parseCsv(await file.text());
    state.importPreview = rowsToProducts(arraysToObjects(rows));
  } else {
    if (!window.XLSX) throw new Error('Excel okuyucu yüklenemedi. İnternet bağlantısını veya CDN erişimini kontrol edin.');
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' }).map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]))
    );
    state.importPreview = rowsToProducts(rows);
  }

  setSyncStatus(`${state.importPreview.length} ürün önizlendi`);
  render();
}

function applyImportPreview() {
  if (!state.importPreview.length) return showToast('Önce bir tablo önizleyin.');
  let added = 0;
  let updated = 0;
  const stockOnly = state.content.importSettings.syncMode === 'stock-only';

  state.importPreview.forEach((incoming) => {
    const existing = products().find((product) => product.sku === incoming.sku);
    if (existing) {
      existing.realStock = incoming.realStock;
      existing.stockStatus = incoming.stockStatus;
      existing.manageStock = true;
      if (!stockOnly) {
        const id = existing.id;
        Object.assign(existing, incoming, { id });
      }
      updated += 1;
      return;
    }
    if (!stockOnly) {
      products().push(incoming);
      added += 1;
    }
  });

  state.content.importSettings.lastSyncAt = new Date().toISOString();
  state.importPreview = [];
  markDirty(`${added} ürün eklendi, ${updated} ürün güncellendi. Kalıcı olması için kaydedin.`);
  render();
}

function bindEvents() {
  els.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    els.loginMessage.textContent = '';
    const formData = new FormData(els.loginForm);
    try {
      await api('login.php', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      setAuthenticated(true);
      await loadContent();
      restorePendingContentIfNeeded();
      render();
    } catch (error) {
      els.loginMessage.textContent = error.message;
    }
  });

  els.logoutButton.addEventListener('click', async () => {
    await api('logout.php', { method: 'POST', body: '{}' }).catch(() => {});
    setAuthenticated(false);
  });

  els.saveButton.addEventListener('click', saveContent);

  els.search.addEventListener('input', (event) => {
    state.query = event.target.value;
    if (state.view !== 'products') state.view = 'products';
    render();
  });

  els.nav.addEventListener('click', (event) => {
    const groupButton = event.target.closest('[data-nav-group]');
    if (groupButton) {
      const groupId = groupButton.dataset.navGroup;
      state.openNavGroups = state.openNavGroups.includes(groupId)
        ? state.openNavGroups.filter((id) => id !== groupId)
        : [...state.openNavGroups, groupId];
      renderNav();
      return;
    }

    const button = event.target.closest('[data-view]');
    if (!button) return;
    state.view = button.dataset.view;
    render();
  });

  els.main.addEventListener('click', handleMainClick);
  els.main.addEventListener('input', handleMainInput);
  els.main.addEventListener('change', handleMainInput);
  els.drawer.addEventListener('click', handleDrawerClick);
  els.drawer.addEventListener('input', handleDrawerInput);
  els.drawer.addEventListener('change', handleDrawerInput);

  document.addEventListener('submit', async (event) => {
    if (event.target.id !== 'passwordForm') return;
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
      const result = await api('password.php', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      showToast(result.message || 'Şifre güncellendi.');
      event.target.reset();
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveContent();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

async function handleMainClick(event) {
  const button = event.target.closest('button, [data-view]');
  if (!button) return;
  const action = button.dataset.action;

  if (button.dataset.view) {
    state.view = button.dataset.view;
    render();
    return;
  }

  if (action === 'add-product') return addProduct();
  if (action === 'send-test-mail') return sendTestMail(button);
  if (action === 'load-google-sheet') {
    try {
      await loadGoogleSheetPreview();
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
    return;
  }
  if (action === 'load-excel') {
    try {
      await loadExcelPreview();
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
    return;
  }
  if (action === 'apply-import') return applyImportPreview();
  if (action === 'edit-product') {
    state.selectedProductId = button.dataset.id;
    state.view = 'products';
    state.productTab = 'general';
    return render();
  }
  if (action === 'duplicate-product') return duplicateProduct(button.dataset.id);
  if (action === 'delete-product') return deleteProduct(button.dataset.id);
  if (action === 'select-collection-item') {
    if (button.dataset.collectionType === 'blogPosts') state.selectedBlogPostId = button.dataset.id;
    if (button.dataset.collectionType === 'legalPages') state.selectedLegalPageId = button.dataset.id;
    if (button.dataset.collectionType === 'orders') state.selectedOrderId = button.dataset.id;
    if (button.dataset.collectionType === 'formSubmissions') state.selectedFormSubmissionId = button.dataset.id;
    if (button.dataset.collectionType === 'members') state.selectedMemberId = button.dataset.id;
    if (button.dataset.collectionType === 'newsletterSubscribers') state.selectedNewsletterSubscriberId = button.dataset.id;
    if (button.dataset.collectionType === 'emailSettings.templates') state.selectedEmailTemplateId = button.dataset.id;
    render();
    return;
  }
  if (action === 'blog-status-filter') {
    state.blogStatusFilter = button.dataset.status || 'all';
    render();
    return;
  }
  if (action === 'blog-reset-filters') {
    state.blogStatusFilter = 'all';
    state.blogCategoryFilter = 'all';
    state.query = '';
    render();
    return;
  }
  if (action === 'blog-search') {
    const input = document.querySelector('[data-blog-search]');
    state.query = input?.value || '';
    render();
    return;
  }
  if (action === 'blog-bulk-apply') {
    const bulkAction = document.querySelector('#blogBulkAction')?.value || '';
    if (!bulkAction) return showToast('Toplu işlem seçin.');
    if (!state.blogSelectedIds.length) return showToast('Önce yazı seçin.');
    if (bulkAction === 'delete' && !window.confirm(`${state.blogSelectedIds.length} yazı silinsin mi?`)) return;
    if (bulkAction === 'delete') {
      state.content.blogPosts = (state.content.blogPosts || []).filter((post) => !state.blogSelectedIds.includes(post.id));
      state.selectedBlogPostId = '';
    } else {
      (state.content.blogPosts || []).forEach((post) => {
        if (state.blogSelectedIds.includes(post.id)) post.isPublished = bulkAction === 'publish';
      });
    }
    state.blogSelectedIds = [];
    markDirty('Blog toplu işlem uygulandı.');
    render();
    return;
  }
  if (action === 'add-collection') return addCollection(button.dataset.collectionType);
  if (action === 'delete-collection') return deleteCollection(button.dataset.collectionType, Number(button.dataset.index));
  if (action === 'copy-media-url') return copyText(button.dataset.url || '');
  if (action === 'delete-media') {
    const url = button.dataset.url || '';
    if (!url) return;
    if (!window.confirm('Bu görsel galeriden ve kullanıldığı içeriklerden kaldırılsın mı?')) return;
    removeMediaUrl(url);
    markDirty('Görsel kaldırıldı. Kalıcı olması için kaydedin.');
    render();
    return;
  }
  if (action === 'export-json') return exportJson();
  if (action === 'import-json') {
    try {
      await importJson();
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
    return;
  }
  if (action === 'add-info-block') {
    state.content.pageTexts.info.blocks.push({ id: uid('info'), title: 'Yeni Bilgi Bloğu', description: '', icon: 'shield' });
    markDirty('Bilgi bloğu eklendi.');
    return render();
  }
  if (action === 'delete-info-block') {
    state.content.pageTexts.info.blocks.splice(Number(button.dataset.index), 1);
    markDirty('Bilgi bloğu silindi.');
    return render();
  }
  if (action === 'upload-media') {
    const input = document.querySelector('#mediaUploader');
    const file = input?.files?.[0];
    if (!file) return showToast('Önce bir görsel seçin.');
    try {
      const result = await uploadFile(file);
      addMediaLibraryItem(result.url, file.name);
      markDirty('Görsel galeriye eklendi. Kalıcı olması için kaydedin.');
      render();
      const lastUploadUrl = document.querySelector('#lastUploadUrl');
      if (lastUploadUrl) lastUploadUrl.value = result.url;
      showToast('Görsel yüklendi ve galeriye eklendi.');
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
  }

  if (action === 'ship-order') {
    const orderId = button.dataset.id;
    const idx = Number(button.dataset.index);
    if (!orderId) return showToast('Sipariş ID bulunamadı.');
    const trackingInput = document.getElementById(`tracking-${idx}`);
    const carrierInput  = document.getElementById(`carrier-${idx}`);
    const trackingNumber = trackingInput?.value?.trim() || '';
    const carrier        = carrierInput?.value?.trim() || '';

    if (!window.confirm(`Sipariş kargoya verildi olarak işaretlensin mi?\nMüşteriye kargo bildirim maili gönderilecek.`)) return;

    button.disabled = true;
    button.textContent = 'Gönderiliyor...';
    try {
      const result = await api('order-ship.php', {
        method: 'POST',
        body: JSON.stringify({ orderId, trackingNumber, carrier }),
      });
      // Yerel state'i güncelle
      const orders = state.content.orders || [];
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        order.status = 'shipped';
        order.shippedAt = result.order?.shippedAt || new Date().toISOString();
        order.trackingNumber = trackingNumber;
        order.carrier = carrier;
      }
      showToast('✓ Kargo bildirimi gönderildi. Müşteriye mail atıldı.');
      render();
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
      button.disabled = false;
      button.textContent = '🚚 Kargoya Verildi – Müşteriye Bildir';
    }
  }
}

function handleMainInput(event) {
  const target = event.target;
  if (target.dataset.testMailField) {
    state.testMail[target.dataset.testMailField] = target.value;
    return;
  }

  if (target.matches('[data-blog-search]')) {
    state.query = target.value;
    render();
    return;
  }

  if (target.matches('[data-blog-category-filter]')) {
    state.blogCategoryFilter = target.value || 'all';
    render();
    return;
  }

  if (target.matches('[data-blog-select-all]')) {
    const ids = Array.from(document.querySelectorAll('[data-blog-select]')).map((input) => input.dataset.blogSelect).filter(Boolean);
    state.blogSelectedIds = target.checked ? ids : [];
    render();
    return;
  }

  if (target.matches('[data-blog-select]')) {
    const id = target.dataset.blogSelect;
    if (!id) return;
    state.blogSelectedIds = target.checked
      ? Array.from(new Set([...state.blogSelectedIds, id]))
      : state.blogSelectedIds.filter((item) => item !== id);
    render();
    return;
  }

  if (target.dataset.path) {
    setPath(state.content, target.dataset.path, target.value);
    markDirty();
    return;
  }

  if (target.dataset.pathCheckbox) {
    setPath(state.content, target.dataset.pathCheckbox, target.checked);
    markDirty();
    return;
  }

  if (target.dataset.collection) {
    const collection = target.dataset.collection;
    const index = Number(target.dataset.index);
    const fieldName = target.dataset.field;
    const kind = target.dataset.kind;
    const value = kind === 'checkbox' ? target.checked : parseByKind(target.value, kind);
    const items = getPath(state.content, collection);
    if (!Array.isArray(items) || !items[index]) return;
    items[index][fieldName] = value;
    markDirty();
  }
}

async function sendTestMail(button) {
  const payload = {
    to: state.testMail.to,
    subject: state.testMail.subject,
    body: state.testMail.body,
    settings: state.content.mailSettings || {},
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.to || '').trim())) {
    showToast('Geçerli bir test alıcısı girin.');
    return;
  }

  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = 'Gönderiliyor...';

  try {
    const result = await api('test-mail.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    els.alertBar.hidden = false;
    els.alertBar.textContent = `${result.to || payload.to} adresine test maili gönderildi.`;
    showToast(result.message || 'Test maili gönderildi.');
  } catch (error) {
    if (handleAuthError(error)) return;
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = previousText;
  }
}

async function handleDrawerClick(event) {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.productTab = tab.dataset.tab;
    renderProductDrawer();
    return;
  }

  const button = event.target.closest('button');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'close-drawer') {
    state.selectedProductId = null;
    els.drawer.hidden = true;
    return;
  }
  if (action === 'delete-product') return deleteProduct(button.dataset.id);
  if (action === 'save-now') {
    const product = selectedProduct();
    if (product) product.isPublished = true;
    markDirty('Ürün yayına hazırlandı.');
    render();
    return saveContent();
  }
}

async function handleDrawerInput(event) {
  const target = event.target;
  const product = selectedProduct();
  if (!product) return;

  if (target.matches('[data-upload-product-image]')) {
    const file = target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      addMediaLibraryItem(result.url, file.name);
      product.image = result.url;
      product.gallery = Array.from(new Set([result.url, ...(product.gallery || [])]));
      markDirty('Görsel yüklendi ve ürüne bağlandı.');
      renderProductDrawer();
      showToast('Ürün görseli yüklendi.');
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
    return;
  }

  if (target.matches('[data-upload-gallery-image]')) {
    const file = target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile(file);
      addMediaLibraryItem(result.url, file.name);
      product.gallery = Array.from(new Set([...(product.gallery || []), result.url]));
      if (!product.image) product.image = result.url;
      markDirty('Görsel galeriye eklendi.');
      renderProductDrawer();
      showToast('Galeri görseli yüklendi.');
    } catch (error) {
      if (handleAuthError(error)) return;
      showToast(error.message);
    }
    return;
  }

  if (target.dataset.productField) {
    product[target.dataset.productField] = parseByKind(target.value, target.dataset.kind);
    markDirty();
    return;
  }

  if (target.dataset.productBool) {
    product[target.dataset.productBool] = target.checked;
    markDirty();
    return;
  }

  if (target.dataset.food) {
    const checked = Array.from(els.drawer.querySelectorAll('[data-food]:checked')).map((input) => input.dataset.food);
    product.foodCompliance = checked.includes('None') && checked.length > 1 ? checked.filter((item) => item !== 'None') : checked.length ? checked : ['None'];
    markDirty();
  }
}

async function init() {
  bindEvents();
  try {
    const session = await api('session.php');
    setAuthenticated(Boolean(session.authenticated));
    if (session.authenticated) {
      await loadContent();
      render();
    }
  } catch {
    setAuthenticated(false);
  }
}

init();
