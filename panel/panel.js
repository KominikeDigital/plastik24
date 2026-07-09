/* ==================================================
   Plastik24 – Üye Paneli JavaScript
   ================================================== */

const API = '/api/';

const state = {
  member: null,
  orders: [],
  currentPanel: 'dashboard',
};

// ─── DOM Helpers ────────────────────────────────────
const $ = (id) => document.getElementById(id);
const loginView = $('loginView');
const panelView = $('panelView');

function showToast(msg, duration = 3500) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, duration);
}

function escHtml(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── API calls ──────────────────────────────────────
async function apiFetch(path, options = {}) {
  const resp = await fetch(API + path, {
    credentials: 'same-origin',
    ...options,
    headers: options.body instanceof FormData
      ? (options.headers || {})
      : { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await resp.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: false, message: text }; }
  if (!resp.ok || data.ok === false) {
    const err = new Error(data.message || 'İşlem tamamlanamadı.');
    err.status = resp.status;
    throw err;
  }
  return data;
}

// ─── Auth ────────────────────────────────────────────
async function checkSession() {
  try {
    const data = await apiFetch('member-session.php');
    if (data.loggedIn && data.member) {
      state.member = data.member;
      return true;
    }
  } catch (e) {
    if (e.status !== 401) console.warn(e);
  }
  return false;
}

async function login(email, password) {
  const data = await apiFetch('member-login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  state.member = data.member || null;
  if (state.member) {
    sessionStorage.setItem('p24_member', JSON.stringify(state.member));
  }
  return data;
}

async function logout() {
  sessionStorage.removeItem('p24_member');
  await apiFetch('logout.php', { method: 'POST', body: '{}' }).catch(() => {});
  state.member = null;
  state.orders = [];
  showLogin();
}

// ─── Orders ──────────────────────────────────────────
async function loadOrders() {
  const data = await apiFetch('member-orders.php');
  state.orders = data.orders || [];
}

function statusLabel(s) {
  const map = {
    pending: 'Beklemede',
    processing: 'İşlemde',
    shipped: 'Kargoda',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    'on-hold': 'Askıda',
  };
  return map[s] || s || 'Beklemede';
}

function statusClass(s) {
  const map = {
    pending: 'badge-pending',
    processing: 'badge-processing',
    shipped: 'badge-shipped',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    'on-hold': 'badge-pending',
  };
  return map[s] || 'badge-pending';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric' });
  } catch { return iso.slice(0, 10); }
}

function renderOrderRow(order, index) {
  const detailId = `order-detail-${index}`;
  const items = (order.items || []).map(it => {
    const name = it.name || it.productName || 'Ürün';
    const qty = it.quantity || it.qty || 1;
    const sku = it.sku ? ` <span style="color:var(--muted);font-size:11px;">[${escHtml(it.sku)}]</span>` : '';
    return `<li>${escHtml(name)}${sku} × ${qty}</li>`;
  }).join('');

  const trackingHtml = order.trackingNumber
    ? `<div class="tracking-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span>Kargo Takip: <strong>${escHtml(order.trackingNumber)}</strong></span>
       </div>`
    : '';

  // Receipt upload - sadece pending/processing durumda göster ve dekont yoksa
  const canUpload = ['pending', 'processing'].includes(order.status) && !order.receiptUrl;
  const receiptHtml = canUpload
    ? `<div class="receipt-upload-form">
        <label>
          <span>💳 Ödeme dekontu yükle (PDF, JPG, PNG – max 10 MB)</span>
          <input type="file" id="receipt-file-${index}" accept=".pdf,.jpg,.jpeg,.png,.webp" />
        </label>
        <div class="upload-row">
          <button class="primary-action" type="button" onclick="uploadReceipt('${escHtml(order.id)}','${escHtml(order.orderNumber)}',${index})" style="padding:8px 16px;font-size:13px;">Dekontu Yükle</button>
          <span style="color:var(--muted);font-size:12px;">veya <a href="mailto:info@plastik24.com.tr?subject=Dekont – ${escHtml(order.orderNumber)}" style="color:var(--accent)">e-posta ile gönderin</a></span>
        </div>
       </div>`
    : order.receiptUrl
      ? `<p style="font-size:13px;color:var(--success);margin-top:10px;">✓ Dekont yüklendi</p>`
      : '';

  return `
    <div class="order-row" onclick="toggleOrderDetail('${detailId}',this)" style="cursor:pointer;">
      <div>
        <div class="order-number">${escHtml(order.orderNumber)}</div>
        <div class="order-date">${formatDate(order.createdAt)}</div>
      </div>
      <div class="order-total">${Number(order.grandTotal || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})} ${escHtml(order.currency || 'EUR')}</div>
      <span class="badge ${statusClass(order.status)}">${statusLabel(order.status)}</span>
      <button class="mini-btn expand" type="button" title="Detay">›</button>
    </div>
    <div class="order-detail" id="${detailId}">
      <div class="order-detail-grid">
        <div class="detail-item"><span>Sipariş No</span><strong>${escHtml(order.orderNumber)}</strong></div>
        <div class="detail-item"><span>Tarih</span><strong>${formatDate(order.createdAt)}</strong></div>
        <div class="detail-item"><span>Durum</span><strong>${statusLabel(order.status)}</strong></div>
        <div class="detail-item"><span>Ödeme</span><strong>${order.paymentMethod === 'bank-transfer' ? 'Havale / EFT' : escHtml(order.paymentMethod || '—')}</strong></div>
        ${order.shippedAt ? `<div class="detail-item"><span>Kargo Tarihi</span><strong>${formatDate(order.shippedAt)}</strong></div>` : ''}
      </div>
      ${items ? `<ul style="padding-left:16px;font-size:13px;color:var(--muted);margin-bottom:10px;">${items}</ul>` : ''}
      ${trackingHtml}
      ${receiptHtml}
    </div>
  `;
}

window.toggleOrderDetail = function(id, row) {
  const detail = document.getElementById(id);
  if (!detail) return;
  const isOpen = detail.classList.toggle('open');
  const btn = row.querySelector('.expand');
  if (btn) btn.textContent = isOpen ? '⌄' : '›';
};

window.uploadReceipt = async function(orderId, orderNumber, index) {
  const fileInput = document.getElementById(`receipt-file-${index}`);
  const file = fileInput?.files?.[0];
  if (!file) { showToast('Önce bir dosya seçin.'); return; }

  const fd = new FormData();
  fd.append('receipt', file);
  fd.append('orderId', orderId);
  fd.append('orderNumber', orderNumber);

  try {
    showToast('Yükleniyor...');
    await apiFetch('receipt-upload.php', { method: 'POST', body: fd });
    showToast('✓ Dekontunuz başarıyla yüklendi.');
    await refreshOrders();
  } catch (e) {
    showToast(e.message);
  }
};

async function refreshOrders() {
  await loadOrders();
  renderOrdersList($('ordersList'), state.orders);
  renderOrdersList($('dashboardOrdersList'), state.orders.slice(0, 5));
  updateKpis();
}

function renderOrdersList(container, orders) {
  if (!container) return;
  if (!orders.length) {
    container.innerHTML = '<div class="order-empty">Henüz sipariş bulunmuyor.</div>';
    return;
  }
  container.innerHTML = orders.map((o, i) => renderOrderRow(o, i)).join('');
}

function updateKpis() {
  const orders = state.orders;
  $('kpiTotal').textContent = orders.length;
  $('kpiPending').textContent = orders.filter(o => ['pending', 'processing', 'on-hold'].includes(o.status)).length;
  $('kpiShipped').textContent = orders.filter(o => o.status === 'shipped').length;
  $('kpiCompleted').textContent = orders.filter(o => o.status === 'completed').length;
}

// ─── Navigation ──────────────────────────────────────
function showPanel(name) {
  state.currentPanel = name;
  document.querySelectorAll('.panel-section').forEach(el => el.hidden = true);
  const target = document.getElementById(`panel-${name}`);
  if (target) target.hidden = false;

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === name);
  });

  const titles = { dashboard: 'Genel Bakış', orders: 'Siparişlerim', profile: 'Profil Bilgileri', security: 'Güvenlik' };
  $('panelTitle').textContent = titles[name] || name;
}

// ─── Member Display ──────────────────────────────────
function renderMemberInfo() {
  const m = state.member;
  if (!m) return;
  $('memberName').textContent = m.authorizedName || m.companyName || 'Üye';
  $('memberEmail').textContent = m.authorizedEmail || '';
  const initial = (m.authorizedName || m.companyName || 'U').charAt(0).toUpperCase();
  $('memberAvatar').textContent = initial;
}

function fillProfileForm() {
  const m = state.member;
  if (!m) return;
  $('fCompanyName').value = m.companyName || '';
  $('fTaxNo').value = m.taxNo || '';
  $('fTaxOffice').value = m.taxOffice || '';
  $('fAddress').value = m.address || '';
  $('fAuthorizedName').value = m.authorizedName || '';
  $('fAuthorizedPhone').value = m.authorizedPhone || '';
  $('fEmail').value = m.authorizedEmail || '';
}

// ─── Views ───────────────────────────────────────────
function showLogin() {
  loginView.hidden = false;
  panelView.hidden = true;
}

async function showPanel_main() {
  loginView.hidden = true;
  panelView.hidden = false;
  renderMemberInfo();
  fillProfileForm();
  try {
    await loadOrders();
    renderOrdersList($('ordersList'), state.orders);
    renderOrdersList($('dashboardOrdersList'), state.orders.slice(0, 5));
    updateKpis();
  } catch (e) {
    showToast('Siparişler yüklenemedi: ' + e.message);
  }
  showPanel('dashboard');
}

// ─── Events ──────────────────────────────────────────
$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  const msg = $('loginMessage');
  const btn = $('loginBtn');
  msg.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Giriş yapılıyor...';
  try {
    await login(email, password);
    await showPanel_main();
  } catch (err) {
    msg.textContent = err.message;
    msg.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Giriş Yap';
  }
});

$('logoutBtn').addEventListener('click', logout);

document.getElementById('sidebarNav').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-panel]');
  if (!btn) return;
  showPanel(btn.dataset.panel);
});

// "Tümünü Gör" bağlantısı
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-panel]');
  if (!btn || !panelView || panelView.hidden) return;
  showPanel(btn.dataset.panel);
});

$('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    companyName: $('fCompanyName').value.trim(),
    taxOffice: $('fTaxOffice').value.trim(),
    address: $('fAddress').value.trim(),
    authorizedName: $('fAuthorizedName').value.trim(),
    authorizedPhone: $('fAuthorizedPhone').value.trim(),
  };
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    const data = await apiFetch('member-update.php', { method: 'POST', body: JSON.stringify(payload) });
    state.member = { ...state.member, ...data.member };
    renderMemberInfo();
    showToast('✓ Bilgileriniz güncellendi.');
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
  }
});

$('securityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const newPass = form.newPassword.value;
  const confirm = form.newPasswordConfirm.value;
  if (newPass !== confirm) { showToast('Şifreler eşleşmiyor.'); return; }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await apiFetch('member-update.php', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: form.currentPassword.value, newPassword: newPass }),
    });
    showToast('✓ Şifreniz güncellendi.');
    form.reset();
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
  }
});

// ─── Init ────────────────────────────────────────────
(async () => {
  const cached = sessionStorage.getItem('p24_member');
  if (cached) {
    try {
      state.member = JSON.parse(cached);
      await showPanel_main();
      // Arka planda session doğrula — hata olursa logout yapma,
      // çünkü cookie expired olabilir ama member verisi geçerli
      checkSession().then(loggedIn => {
        if (loggedIn) {
          // Session geçerli, member verisini güncelle
          sessionStorage.setItem('p24_member', JSON.stringify(state.member));
        }
        // Session geçersizse paneli kapatma — kullanıcı deneyimini bozar
      }).catch(() => {});
      return;
    } catch (e) {
      sessionStorage.removeItem('p24_member');
    }
  }

  const loggedIn = await checkSession();
  if (loggedIn) {
    sessionStorage.setItem('p24_member', JSON.stringify(state.member));
    await showPanel_main();
  } else {
    showLogin();
  }
})();
